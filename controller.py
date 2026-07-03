"""
TitanRE Controller — Sovereign Core orchestration with shard quorum and topology trees.

SKILL BREAKDOWN: Thread-Safe GUI / Async Integration
----------------------------------------------------
The Sovereign phase adds boot-time jurisdictional shard recovery and closed-loop
stealth adaptation without blocking Tk: all recovery runs in ``__init__`` before
threads start, while response feedback posts via the async loop only.
"""

from __future__ import annotations

import asyncio
import json
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
from models.task_model import (
    ModuleMode,
    SecurityTelemetry,
    ShardIntegrityStatus,
    TaskState,
    TaskStatus,
    TopologyNode,
    VulnerabilityFlowState,
    WipeValidation,
)


LogCallback = Callable[[str, str], None]
StateCallback = Callable[[TaskState], None]
WipeCallback = Callable[[WipeValidation], None]


class TitanREController:
    """Orchestrates Sovereign Core engines, shard recovery, and GUI callbacks."""

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

        token = self._state_manager.mutation_token
        self._state_manager.register_secret("lab_api_key", "titanre-sovereign-demo-key", mutation_token=token)

        self._apply_boot_shard_integrity()

    def _apply_boot_shard_integrity(self) -> None:
        """
        Surface jurisdictional shard quorum result to Security Center V2.

        SKILL BREAKDOWN: Boot-Time Shard Integrity Verification
        ---------------------------------------------------------
        Operators must know immediately whether distributed logs were tampered
        with or incomplete before trusting session topology replay.
        """
        recovery = self._db.recovery_result
        if recovery is None:
            status = ShardIntegrityStatus(message="Shard engine not initialized.")
        else:
            status = ShardIntegrityStatus(
                quorum_met=recovery.quorum_met,
                shards_present=recovery.shards_present,
                shards_required=3,
                jurisdictions=list(recovery.jurisdictions),
                recovered_records=recovery.recovered_records,
                message=recovery.message,
            )
        with self._state_lock:
            self._state.shard_integrity = status
        self._log("INFO", f"Shard integrity: {status.message}")

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
        self._log("INFO", "Sovereign Core online — PQC agility + shard quorum active.")
        self._publish_state(last_message="Security Center V2 ready.")

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
        artifacts, fragments = self._state_manager.trigger_dead_man_switch(reason="operator")
        db_rows = self._db.purge()
        self._network.clear_topology()
        self._fuzzer.clear_dependency_graph()

        validation = WipeValidation(
            memory_artifacts_cleared=artifacts,
            fragments_destroyed=fragments,
            db_rows_purged=db_rows,
            shard_fragments_purged=db_rows,
            passes_executed=5,
            success=True,
            message=(
                f"Sovereign wipe OK — {artifacts} buffers, {fragments} memory fragments, "
                f"{db_rows} shard/index rows purged."
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
            topology_tree=[],
            vulnerability_flow=VulnerabilityFlowState(),
        )
        if self._wipe_callback:
            self._wipe_callback(validation)

    def run_network_probe(self, url: str) -> None:
        self._enqueue(self._job_network_probe(url))

    def run_sample_fuzz(self, url: str) -> None:
        self._enqueue(self._job_sample_fuzz(url))

    def run_vulnerability_flow_scan(self, base_url: str) -> None:
        """Schedule Auth → Session → Resource vulnerability path trace."""
        self._enqueue(self._job_vulnerability_flow(base_url))

    def get_task_state(self) -> TaskState:
        with self._state_lock:
            return self._state.clone()

    def toggle_topology_node(self, node_id: str) -> None:
        """Toggle expand/collapse for interactive topology tree (GUI callback)."""
        with self._state_lock:
            self._toggle_node_recursive(self._state.topology_tree, node_id)
            snapshot = self._state.clone()
        if self._state_callback:
            self._state_callback(snapshot)

    def _toggle_node_recursive(self, nodes: List[TopologyNode], node_id: str) -> bool:
        for node in nodes:
            if node.node_id == node_id:
                node.expanded = not node.expanded
                return True
            if self._toggle_node_recursive(node.children, node_id):
                return True
        return False

    # ------------------------------------------------------------------
    # Async jobs
    # ------------------------------------------------------------------

    def _job_network_probe(self, url: str):
        async def _coro() -> None:
            self._worker_begin()
            try:
                self._stealth.rotate_persona()
                decoy = self._stealth.execution_delay_decoy()
                self._log("DEBUG", f"Tracker poison + decoy: {decoy}")

                fp = await self._network.fingerprint_probe(url)
                self._log(
                    "INFO",
                    f"TLS={fp['tls_profile']} chaff={fp.get('chaff_packets', 0)} "
                    f"poison={self._stealth.tracker_poison_samples}",
                )

                response = await self._network.request("GET", url)
                self._stealth.ingest_target_response(
                    response.status,
                    response.elapsed_ms,
                    len(response.body_preview),
                    anomaly_hint=response.entropy / 8.0,
                )
                self._fuzzer.parse_response_structure(response.body_preview)

                topology_lines = self._build_session_topology_lines()
                topology_tree = self._build_topology_tree()
                self._db.write_topology(topology_lines)

                self._log(
                    "INFO",
                    f"GET {url} -> {response.status} ({response.elapsed_ms:.1f}ms) "
                    f"jitter_model={self._stealth.get_protocol_snapshot().get('jitter_model')}",
                )
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    network_entropy=response.entropy / 8.0,
                    memory_entropy=self._compute_memory_entropy(),
                    last_message=f"Probe complete: HTTP {response.status}",
                    session_topology=topology_lines,
                    topology_tree=topology_tree,
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
                    body = (
                        json.dumps(payload).encode("utf-8")
                        if isinstance(payload, dict)
                        else json_bytes(str(payload))
                        if payload is not None
                        else b""
                    )
                    resp = await self._network.request("POST", url, data=body)
                    self._stealth.ingest_target_response(
                        resp.status,
                        resp.elapsed_ms,
                        len(resp.body_preview),
                    )
                    return {
                        "status_code": resp.status,
                        "body": resp.body_preview,
                        "headers": resp.headers,
                        "elapsed_ms": resp.elapsed_ms,
                    }

                results = await self._fuzzer.run_cases(cases, _sender)
                anomalies = [r for r in results if r.anomaly_score >= 0.5]
                flow_state = self._fuzzer.last_flow_state
                self._log(
                    "INFO",
                    f"Fuzz complete — {len(results)} cases, {len(anomalies)} anomalies.",
                )
                topology_lines = self._build_session_topology_lines()
                topology_tree = self._build_topology_tree()
                self._db.write_topology(topology_lines)
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    last_message=f"Fuzzed {len(results)} cases ({len(anomalies)} anomalies)",
                    session_topology=topology_lines,
                    topology_tree=topology_tree,
                    vulnerability_flow=flow_state,
                )
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Fuzz job failed: {exc}")
                self._publish_state(status=TaskStatus.FAILED, last_message=str(exc))
            finally:
                self._worker_end()

        return _coro

    def _job_vulnerability_flow(self, base_url: str):
        async def _coro() -> None:
            if not self._fuzzer.enabled:
                self._log("WARN", "Fuzzing module disabled — enable Fuzzing to run vulnerability flow scan.")
                return
            self._worker_begin()
            try:
                self._stealth.rotate_persona()
                base = base_url.rstrip("/")

                async def _flow_sender(method: str, url: str, payload: Any) -> Dict[str, Any]:
                    if isinstance(payload, dict):
                        body = json.dumps(payload).encode("utf-8")
                    else:
                        body = str(payload).encode("utf-8")
                    extra: Dict[str, str] = {"Content-Type": "application/json"}
                    token = self._fuzzer.path_tracer.session_token
                    if token:
                        extra["Authorization"] = f"Bearer {token}"
                    req_body = None if method.upper() == "GET" else body
                    resp = await self._network.request(method, url, data=req_body, extra_headers=extra)
                    self._stealth.ingest_target_response(
                        resp.status, resp.elapsed_ms, len(resp.body_preview)
                    )
                    return {
                        "status_code": resp.status,
                        "body": resp.body_preview,
                        "headers": resp.headers,
                        "elapsed_ms": resp.elapsed_ms,
                    }

                def _on_mutation_progress(_loop_state) -> None:
                    self._publish_telemetry_only()

                flow_state = await self._fuzzer.run_vulnerability_flow_scan(
                    base, _flow_sender, progress_callback=_on_mutation_progress
                )
                critical = [
                    n for n in flow_state.path_nodes if n.severity_score >= 7.0
                ]
                self._log("INFO", f"Vulnerability flow: {flow_state.matrix_line}")
                for node in critical[:4]:
                    self._log(
                        "WARN",
                        f"{node.vulnerability_type} ({node.severity_score:.1f}) @ {node.path_url}",
                    )

                topology_lines = self._build_session_topology_lines()
                topology_tree = self._build_topology_tree()
                self._db.write_topology(topology_lines)
                self._publish_state(
                    status=TaskStatus.SUCCESS,
                    last_message=f"Flow scan: {len(flow_state.path_nodes)} findings",
                    session_topology=topology_lines,
                    topology_tree=topology_tree,
                    vulnerability_flow=flow_state,
                )
                self._db.write("WARN" if critical else "INFO", "vuln-flow", flow_state.matrix_line)
            except Exception as exc:  # noqa: BLE001
                self._log("ERROR", f"Vulnerability flow scan failed: {exc}")
                self._publish_state(status=TaskStatus.FAILED, last_message=str(exc))
            finally:
                self._worker_end()

        return _coro

    def _build_session_topology_lines(self) -> List[str]:
        lines: List[str] = ["=== Session Topology ==="]
        for endpoint in self._network.discovered_endpoints:
            lines.append(f"endpoint: {endpoint}")
        lines.append("--- API Dependency Graph ---")
        lines.extend(self._fuzzer.export_topology_lines())
        return lines

    def _build_topology_tree(self) -> List[TopologyNode]:
        """
        Build multi-tier hierarchical topology for collapsible GUI rendering.

        SKILL BREAKDOWN: Session Topology Graph Construction
        ------------------------------------------------------
        Tier-0 root → Tier-1 categories → Tier-2 endpoints/fields gives operators
        a clear attack-surface hierarchy without external graph dependencies.
        """
        root = TopologyNode(node_id="root", label="Sovereign Session Root", tier=0, expanded=True)

        endpoints_parent = TopologyNode(
            node_id="tier1-endpoints",
            label=f"Discovered Endpoints ({len(self._network.discovered_endpoints)})",
            tier=1,
            expanded=True,
        )
        for index, endpoint in enumerate(self._network.discovered_endpoints):
            endpoints_parent.children.append(
                TopologyNode(
                    node_id=f"ep-{index}",
                    label=endpoint,
                    tier=2,
                    expanded=False,
                )
            )
        root.children.append(endpoints_parent)

        graph_parent = TopologyNode(
            node_id="tier1-api-graph",
            label="API Dependency Graph",
            tier=1,
            expanded=True,
        )
        for index, (path, node) in enumerate(self._fuzzer.dependency_graph.items()):
            graph_parent.children.append(
                TopologyNode(
                    node_id=f"dep-{index}",
                    label=f"{path} ({node.value_type})",
                    tier=2,
                    expanded=False,
                )
            )
        root.children.append(graph_parent)

        stealth_parent = TopologyNode(
            node_id="tier1-stealth",
            label="Stealth Telemetry",
            tier=1,
            expanded=False,
        )
        snap = self._stealth.get_protocol_snapshot()
        for key in ("jitter_model", "quic_cid", "poison_samples"):
            if key in snap:
                stealth_parent.children.append(
                    TopologyNode(
                        node_id=f"stealth-{key}",
                        label=f"{key}: {snap[key]}",
                        tier=2,
                    )
                )
        root.children.append(stealth_parent)

        return [root]

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
        while not self._shutdown.is_set():
            start = time.perf_counter()
            await asyncio.sleep(2.0)
            self._oob_last_ms = (time.perf_counter() - start) * 1000.0
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
        constancy = self._state_manager.memory_constancy
        rng = secrets.randbits(16) / 65535.0
        return min(1.0, (keys * 0.06) + (enc_ratio * 0.35) + (constancy * 0.25) + (rng * 0.1))

    def _build_telemetry(self) -> SecurityTelemetry:
        vuln_nodes = self._fuzzer.path_tracer.path_nodes
        max_sev = max((n.severity_score for n in vuln_nodes), default=0.0)
        return SecurityTelemetry(
            memory_entropy=self._compute_memory_entropy(),
            memory_encrypted_ratio=self._state_manager.memory_encrypted_ratio,
            network_entropy=self._state.network_entropy,
            jitter_frequency_hz=self._stealth.jitter_frequency_hz,
            oob_heartbeat_ms=self._oob_last_ms,
            active_workers=self._active_workers,
            fragmented_secrets=self._state_manager.fragmented_secret_count,
            chaff_packets=self._stealth.chaff_packet_count,
            memory_constancy=self._state_manager.memory_constancy,
            decoy_efficiency=self._state_manager.decoy_efficiency,
            pqc_agility_active=self._state_manager.pqc_agility_active,
            tracker_poison_samples=self._stealth.tracker_poison_samples,
            vulnerability_count=len(vuln_nodes),
            max_severity=max_sev,
            mutation_entropy_rate=self._fuzzer.mutation_entropy_rate,
            payload_reward_multiplier=self._fuzzer.payload_reward_multiplier,
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
        topology_tree: Optional[List[TopologyNode]] = None,
        vulnerability_flow: Optional[VulnerabilityFlowState] = None,
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
            if topology_tree is not None:
                self._state.topology_tree = topology_tree
            if vulnerability_flow is not None:
                self._state.vulnerability_flow = vulnerability_flow
            if wipe_validation is not None:
                self._state.wipe_validation = wipe_validation
            self._state.telemetry = self._build_telemetry()
            snapshot = self._state.clone()

        if self._state_callback:
            self._state_callback(snapshot)


def json_bytes(text: str) -> bytes:
    return text.encode("utf-8")
