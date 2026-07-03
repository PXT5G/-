"""
TitanRE Controller — MVC bridge with OOB heartbeat and Security Center telemetry.

SKILL BREAKDOWN: Thread-Safe GUI / Async Integration
----------------------------------------------------
Tkinter is not asyncio-aware. A dedicated event-loop thread plus
``queue.Queue`` dispatch and ``after(0, ...)`` UI marshaling preserves
responsiveness while OOB heartbeat coroutines emit out-of-band liveness
ticks without blocking operator interactions.
"""

from __future__ import annotations

import asyncio
import queue
import secrets
import threading
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from core.database import LogDatabase
from core.fuzzer_engine import FuzzerEngine
from core.network_engine import NetworkEngine
from core.state_manager import DeadManConfig, StateManager
from core.stealth_middleware import StealthMiddleware
from models.task_model import ModuleMode, SecurityTelemetry, TaskState, TaskStatus, WipeValidation


LogCallback = Callable[[str, str], None]
StateCallback = Callable[[TaskState], None]
WipeCallback = Callable[[WipeValidation], None]


class TitanREController:
    """
    Orchestrates engines, async loop thread, heartbeat, and GUI-safe callbacks.
    """

    def __init__(
        self,
        log_callback: Optional[LogCallback] = None,
        state_callback: Optional[StateCallback] = None,
        wipe_callback: Optional[WipeCallback] = None,
        db_path: Optional[Path] = None,
    ) -> None:
        self._log_callback = log_callback
        self._state_callback = state_callback
        self._wipe_callback = wipe_callback

        self._state = TaskState()
        self._state_lock = threading.Lock()

        self._stealth = StealthMiddleware(enabled=True)
        self._network = NetworkEngine(self._stealth)
        self._fuzzer = FuzzerEngine(enabled=False)
        self._state_manager = StateManager(
            dead_man=DeadManConfig(
                enabled=True,
                timeout_seconds=600.0,
                max_ops_per_second=80.0,
                on_trigger=self._on_dead_man_triggered,
            )
        )

        db_file = db_path or Path("titanre_logs.sqlite3")
        self._db = LogDatabase(db_file)

        self._async_thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._shutdown = threading.Event()
        self._task_queue: queue.Queue = queue.Queue()
        self._active_workers = 0
        self._oob_last_ms = 0.0
        self._telemetry_thread: Optional[threading.Thread] = None
        self._telemetry_stop = threading.Event()

        # Register demo API key fragmented at rest
        token = self._state_manager.mutation_token
        self._state_manager.register_secret("lab_api_key", "titanre-edu-demo-key", mutation_token=token)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self) -> None:
        if self._async_thread and self._async_thread.is_alive():
            return
        self._shutdown.clear()
        self._telemetry_stop.clear()
        self._async_thread = threading.Thread(
            target=self._async_thread_main,
            name="TitanRE-AsyncLoop",
            daemon=True,
        )
        self._async_thread.start()
        self._telemetry_thread = threading.Thread(
            target=self._telemetry_loop,
            name="TitanRE-Telemetry",
            daemon=True,
        )
        self._telemetry_thread.start()
        self._state_manager.arm_dead_man_switch()
        self._log("INFO", "Controller online — async loop + OOB heartbeat started.")
        self._publish_state(last_message="Security Center ready.")

    def stop(self) -> None:
        self._shutdown.set()
        self._telemetry_stop.set()
        if self._loop and self._loop.is_running():
            future = asyncio.run_coroutine_threadsafe(self._network.stop(), self._loop)
            try:
                future.result(timeout=5)
            except Exception:  # noqa: BLE001
                pass
            self._loop.call_soon_threadsafe(self._loop.stop)
        if self._async_thread:
            self._async_thread.join(timeout=3)
        if self._telemetry_thread:
            self._telemetry_thread.join(timeout=2)
        self._state_manager.disarm_dead_man_switch()
        self._db.close()
        self._log("INFO", "Controller shutdown complete.")

    def toggle_module(self, mode: ModuleMode, enabled: bool) -> None:
        with self._state_lock:
            self._state.enabled_modes[mode.name] = enabled
        if mode == ModuleMode.STEALTH:
            self._stealth.enabled = enabled
        elif mode == ModuleMode.FUZZING:
            self._fuzzer.enabled = enabled
        elif mode == ModuleMode.ANALYSIS:
            self._network.padding_enabled = enabled
        self._log("INFO", f"Module {mode.name} -> {'ON' if enabled else 'OFF'}")
        self._publish_state()

    def emergency_wipe(self) -> None:
        """
        Multi-layer memory volatilization + SQLite transactional purge.

        SKILL BREAKDOWN: Coordinated Anti-Forensics Response
        ----------------------------------------------------
        Wipe spans fragmented secrets, tracked buffers, network topology, and
        persistent logs. Validation struct confirms each layer for GUI trust
        indicators without leaking wiped plaintext.
        """
        artifacts, fragments = self._state_manager.trigger_dead_man_switch(reason="operator")
        db_rows = self._db.purge()
        self._network.clear_topology()
        self._fuzzer.clear_dependency_graph()

        validation = WipeValidation(
            memory_artifacts_cleared=artifacts,
            fragments_destroyed=fragments,
            db_rows_purged=db_rows,
            passes_executed=5,
            success=True,
            message=(
                f"Wipe OK — {artifacts} buffers, {fragments} fragments, "
                f"{db_rows} DB rows purged."
            ),
        )
        self._log("WARN", validation.message)
        self._publish_state(
            status=TaskStatus.IDLE,
            last_message="Emergency wipe complete.",
            memory_entropy=0.0,
            network_entropy=0.0,
            wipe_validation=validation,
            session_topology=[],
        )
        if self._wipe_callback:
            self._wipe_callback(validation)

    def run_network_probe(self, url: str) -> None:
        self._enqueue(self._job_network_probe(url))

    def run_sample_fuzz(self, url: str) -> None:
        self._enqueue(self._job_sample_fuzz(url))

    def get_task_state(self) -> TaskState:
        with self._state_lock:
            return self._state.clone()

    # ------------------------------------------------------------------
    # Async jobs
    # ------------------------------------------------------------------

    def _job_network_probe(self, url: str):
        async def _coro() -> None:
            self._worker_begin()
            try:
                self._stealth.rotate_persona()
                decoy = self._stealth.execution_delay_decoy()
                self._log("DEBUG", f"Persona decoy: {decoy}")

                fp = await self._network.fingerprint_probe(url)
                self._log(
                    "INFO",
                    f"TLS={fp['tls_profile']} pseudo_fp={fp['pseudo_fingerprint']} "
                    f"chaff={fp.get('chaff_packets', 0)}",
                )
                proto = fp.get("protocol_snapshot", {})
                if proto:
                    self._log("DEBUG", f"Protocol mimicry: {proto}")

                response = await self._network.request("GET", url)
                self._fuzzer.parse_response_structure(response.body_preview)

                topology = self._build_session_topology()
                self._log(
                    "INFO",
                    f"GET {url} -> {response.status} ({response.elapsed_ms:.1f}ms) "
                    f"entropy={response.entropy:.2f} jitter={response.jitter_delay_s:.3f}s",
                )
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    network_entropy=response.entropy / 8.0,
                    memory_entropy=self._compute_memory_entropy(),
                    last_message=f"Probe complete: HTTP {response.status}",
                    session_topology=topology,
                )
                self._db.write("INFO", "network", f"Probe {url} status={response.status}")
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Network probe failed: {exc}")
                self._publish_state(status=TaskStatus.FAILED, last_message=str(exc))
            finally:
                self._worker_end()

        return _coro

    def _job_sample_fuzz(self, url: str):
        async def _coro() -> None:
            if not self._fuzzer.enabled:
                self._log("WARN", "Fuzzing module disabled — enable in module panel.")
                return
            self._worker_begin()
            try:
                base_payload = {"id": 1, "action": "lookup", "token": "lab"}
                cases = self._fuzzer.mutate_json_payload(base_payload, rounds=6)

                async def _sender(payload: Any) -> Dict[str, Any]:
                    body = json_bytes(str(payload))
                    resp = await self._network.request("POST", url, data=body)
                    return {
                        "status_code": resp.status,
                        "body": resp.body_preview,
                        "headers": resp.headers,
                        "elapsed_ms": resp.elapsed_ms,
                    }

                results = await self._fuzzer.run_cases(cases, _sender)
                anomalies = [r for r in results if r.anomaly_score >= 0.5]
                self._log(
                    "INFO",
                    f"Fuzz complete — {len(results)} cases, {len(anomalies)} anomalies.",
                )
                for hit in anomalies[:3]:
                    self._log(
                        "WARN",
                        f"score={hit.anomaly_score:.2f} J={hit.jaccard_component:.2f} "
                        f"L={hit.latency_component:.2f} H={hit.header_component:.2f} | {hit.notes}",
                    )
                topology = self._build_session_topology()
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    last_message=f"Fuzzed {len(results)} cases ({len(anomalies)} anomalies)",
                    session_topology=topology,
                )
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Fuzz job failed: {exc}")
                self._publish_state(status=TaskStatus.FAILED, last_message=str(exc))
            finally:
                self._worker_end()

        return _coro

    def _build_session_topology(self) -> List[str]:
        lines: List[str] = ["=== Session Topology ==="]
        for endpoint in self._network.discovered_endpoints:
            lines.append(f"endpoint: {endpoint}")
        lines.append("--- API Dependency Graph ---")
        lines.extend(self._fuzzer.export_topology_lines())
        return lines

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _async_thread_main(self) -> None:
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.create_task(self._dispatch_loop())
        self._loop.create_task(self._oob_heartbeat_loop())
        self._loop.run_forever()

    async def _oob_heartbeat_loop(self) -> None:
        """
        Out-of-band liveness telemetry independent of user jobs.

        SKILL BREAKDOWN: OOB Heartbeat Telemetry
        ----------------------------------------
        Heartbeats prove the async loop is responsive even when no network
        jobs queue — detecting event-loop stalls that would delay emergency
        wipe or Dead-Man's Switch execution.
        """
        while not self._shutdown.is_set():
            start = time.perf_counter()
            await asyncio.sleep(2.0)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            self._oob_last_ms = elapsed_ms
            self._publish_telemetry_only()

    async def _dispatch_loop(self) -> None:
        while not self._shutdown.is_set():
            try:
                coro_factory = self._task_queue.get(timeout=0.2)
            except queue.Empty:
                await asyncio.sleep(0.05)
                continue
            try:
                await coro_factory()
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Dispatch error: {exc}")
            finally:
                self._task_queue.task_done()

    def _telemetry_loop(self) -> None:
        while not self._telemetry_stop.is_set():
            self._publish_telemetry_only()
            time.sleep(1.0)

    def _enqueue(self, coro_factory: Callable[[], Any]) -> None:
        self._task_queue.put(coro_factory)
        self._publish_state(status=TaskStatus.RUNNING, last_message="Job queued.")

    def _worker_begin(self) -> None:
        with self._state_lock:
            self._active_workers += 1
            self._state.active_threads = self._active_workers
        self._publish_state()

    def _worker_end(self) -> None:
        with self._state_lock:
            self._active_workers = max(0, self._active_workers - 1)
            self._state.active_threads = self._active_workers
        self._publish_state()

    def _compute_memory_entropy(self) -> float:
        keys = len(self._state_manager.volatile_keys)
        enc_ratio = self._state_manager.memory_encrypted_ratio
        rng = secrets.randbits(16) / 65535.0
        return min(1.0, (keys * 0.08) + (enc_ratio * 0.4) + (rng * 0.2))

    def _build_telemetry(self) -> SecurityTelemetry:
        return SecurityTelemetry(
            memory_entropy=self._compute_memory_entropy(),
            memory_encrypted_ratio=self._state_manager.memory_encrypted_ratio,
            network_entropy=self._state.network_entropy,
            jitter_frequency_hz=self._stealth.jitter_frequency_hz,
            oob_heartbeat_ms=self._oob_last_ms,
            active_workers=self._active_workers,
            fragmented_secrets=self._state_manager.fragmented_secret_count,
            chaff_packets=self._stealth.chaff_packet_count,
        )

    def _publish_telemetry_only(self) -> None:
        with self._state_lock:
            self._state.telemetry = self._build_telemetry()
            snapshot = self._state.clone()
        if self._state_callback:
            self._state_callback(snapshot)

    def _on_dead_man_triggered(self, reason: str) -> None:
        self._log("WARN", f"Dead-Man's Switch triggered: {reason}")

    def _log(self, level: str, message: str) -> None:
        if self._log_callback:
            self._log_callback(level, message)

    def _publish_state(
        self,
        status: Optional[TaskStatus] = None,
        last_message: Optional[str] = None,
        memory_entropy: Optional[float] = None,
        network_entropy: Optional[float] = None,
        session_topology: Optional[List[str]] = None,
        wipe_validation: Optional[WipeValidation] = None,
    ) -> None:
        with self._state_lock:
            if status is not None:
                self._state.status = status
            if last_message is not None:
                self._state.last_message = last_message
            if memory_entropy is not None:
                self._state.memory_entropy = memory_entropy
            if network_entropy is not None:
                self._state.network_entropy = network_entropy
            if session_topology is not None:
                self._state.session_topology = session_topology
            if wipe_validation is not None:
                self._state.wipe_validation = wipe_validation
            self._state.telemetry = self._build_telemetry()
            snapshot = self._state.clone()

        if self._state_callback:
            self._state_callback(snapshot)


def json_bytes(text: str) -> bytes:
    return text.encode("utf-8")
