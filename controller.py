"""
TitanRE Controller — MVC bridge between CustomTkinter and async backend.

SKILL BREAKDOWN: Thread-Safe GUI / Async Integration
----------------------------------------------------
Tkinter is not asyncio-aware. Running ``asyncio.run`` on the main thread
blocks the UI. The canonical pattern: dedicate one background thread to the
event loop, communicate via ``queue.Queue`` and ``threading`` primitives, and
marshal UI updates with ``root.after(0, ...)`` to stay on the main loop.
"""

from __future__ import annotations

import asyncio
import math
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
from models.task_model import ModuleMode, TaskState, TaskStatus


LogCallback = Callable[[str, str], None]
StateCallback = Callable[[TaskState], None]


class TitanREController:
    """
    Orchestrates engines, async loop thread, and GUI-safe callbacks.

    SKILL BREAKDOWN: Modular Component Pattern
    --------------------------------------------
    The controller composes engines (network, fuzzer, stealth, state) without
    inheriting from them — enabling swap tests, mock injection, and isolated
    unit validation per security module.
    """

    def __init__(
        self,
        log_callback: Optional[LogCallback] = None,
        state_callback: Optional[StateCallback] = None,
        db_path: Optional[Path] = None,
    ) -> None:
        self._log_callback = log_callback
        self._state_callback = state_callback

        self._state = TaskState()
        self._state_lock = threading.Lock()

        self._stealth = StealthMiddleware(enabled=True)
        self._network = NetworkEngine(self._stealth)
        self._fuzzer = FuzzerEngine(enabled=False)
        self._state_manager = StateManager(
            dead_man=DeadManConfig(enabled=True, timeout_seconds=600.0)
        )

        db_file = db_path or Path("titanre_logs.sqlite3")
        self._db = LogDatabase(db_file)

        self._async_thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._shutdown = threading.Event()
        self._task_queue: queue.Queue = queue.Queue()
        self._active_workers = 0

    # ------------------------------------------------------------------
    # Public API consumed by the GUI (thread-safe entry points)
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Boot async worker thread and arm anti-forensics watchdog."""
        if self._async_thread and self._async_thread.is_alive():
            return
        self._shutdown.clear()
        self._async_thread = threading.Thread(
            target=self._async_thread_main,
            name="TitanRE-AsyncLoop",
            daemon=True,
        )
        self._async_thread.start()
        self._state_manager.arm_dead_man_switch()
        self._log("INFO", "Controller online — async loop started.")
        self._publish_state(last_message="Async backend ready.")

    def stop(self) -> None:
        """Gracefully stop background loop and close network session."""
        self._shutdown.set()
        if self._loop and self._loop.is_running():
            future = asyncio.run_coroutine_threadsafe(self._network.stop(), self._loop)
            try:
                future.result(timeout=5)
            except Exception:  # noqa: BLE001
                pass
            self._loop.call_soon_threadsafe(self._loop.stop)
        if self._async_thread:
            self._async_thread.join(timeout=3)
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
        Dead-Man's Switch / manual purge — wipes volatile state and DB.

        SKILL BREAKDOWN: Anti-Forensics Emergency Response
        ----------------------------------------------------
        Coordinated wipe across memory registry and SQLite log reduces
        forensic continuity. GUI callbacks still run on main thread after
        wipe to confirm operator intent was executed.
        """
        wiped = self._state_manager.trigger_dead_man_switch(reason="operator")
        self._db.purge()
        self._log("WARN", f"Emergency wipe executed — {wiped} volatile artifacts cleared.")
        self._publish_state(
            status=TaskStatus.IDLE,
            last_message="Emergency wipe complete.",
            memory_entropy=0.0,
            network_entropy=0.0,
        )

    def run_network_probe(self, url: str) -> None:
        """Schedule a stealth network fingerprint probe (non-blocking)."""
        self._enqueue(self._job_network_probe(url))

    def run_sample_fuzz(self, url: str) -> None:
        """Schedule a demo fuzz batch against a URL (educational)."""
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
                self._log("DEBUG", f"Persona decoy metadata: {decoy}")

                fp = await self._network.fingerprint_probe(url)
                self._log("INFO", f"TLS persona: {fp['tls_profile']} | pseudo_fp={fp['pseudo_fingerprint']}")

                response = await self._network.request("GET", url)
                self._log(
                    "INFO",
                    f"GET {url} -> {response.status} ({response.elapsed_ms:.1f}ms) "
                    f"entropy={response.entropy:.2f}",
                )
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    network_entropy=response.entropy / 8.0,
                    memory_entropy=self._compute_memory_entropy(),
                    last_message=f"Probe complete: HTTP {response.status}",
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
                cases = self._fuzzer.mutate_json_payload(base_payload, rounds=4)

                async def _sender(payload: Any) -> Dict[str, Any]:
                    body = str(payload).encode()
                    resp = await self._network.request("POST", url, data=body)
                    return {"status_code": resp.status, "body": resp.body_preview}

                results = await self._fuzzer.run_cases(cases, _sender)
                anomalies = [r for r in results if r.anomaly_score >= 0.5]
                self._log(
                    "INFO",
                    f"Fuzz batch complete — {len(results)} cases, {len(anomalies)} anomalies.",
                )
                for hit in anomalies[:3]:
                    self._log(
                        "WARN",
                        f"Anomaly {hit.anomaly_score:.2f} | {hit.case.strategy.value} | {hit.notes}",
                    )
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    last_message=f"Fuzzed {len(results)} cases ({len(anomalies)} anomalies)",
                )
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Fuzz job failed: {exc}")
                self._publish_state(status=TaskStatus.FAILED, last_message=str(exc))
            finally:
                self._worker_end()

        return _coro

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _async_thread_main(self) -> None:
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.create_task(self._dispatch_loop())
        self._loop.run_forever()

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
        """
        Synthetic entropy gauge from volatile store size and RNG.

        SKILL BREAKDOWN: Entropy as Operational Telemetry
        -------------------------------------------------
        True memory entropy requires scanning address space; for GUI teaching
        we derive a bounded scalar from secrets generator output mapped to
        [0,1] so operators visualize *change* rather than absolute entropy.
        """
        keys = len(self._state_manager.volatile_keys)
        rng = secrets.randbits(16) / 65535.0
        return min(1.0, (keys * 0.1) + (rng * 0.5))

    def _log(self, level: str, message: str) -> None:
        if self._log_callback:
            self._log_callback(level, message)

    def _publish_state(
        self,
        status: Optional[TaskStatus] = None,
        last_message: Optional[str] = None,
        memory_entropy: Optional[float] = None,
        network_entropy: Optional[float] = None,
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
            snapshot = self._state.clone()

        if self._state_callback:
            self._state_callback(snapshot)
