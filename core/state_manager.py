"""
Anti-forensics state manager with secure wipe and Dead-Man's Switch.

SKILL BREAKDOWN: Anti-Forensics / Secure Memory Hygiene
-------------------------------------------------------
Python objects cannot guarantee kernel-level memory erasure, but we apply
defense-in-depth: overwrite mutable buffers with random bytes, delete
references, invoke ``gc.collect()``, and maintain a volatile registry that
the Dead-Man's Switch can purge on timeout or manual trigger. This teaches
why languages with precise memory control (Rust/C) are preferred for
high-assurance wipe semantics, while still demonstrating the *intent* and
API surface in Python research tooling.
"""

from __future__ import annotations

import gc
import secrets
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional


@dataclass
class DeadManConfig:
    """Configuration for automatic state annihilation."""

    enabled: bool = True
    timeout_seconds: float = 300.0
    on_trigger: Optional[Callable[[], None]] = None


class StateManager:
    """
    Volatile in-memory registry with secure wipe and emergency purge.

    SKILL BREAKDOWN: RAM-Only Execution Simulation
    ------------------------------------------------
    The ``_volatile_store`` dict simulates TmpFS-style ephemeral state: no
    disk spill for registered secrets. Registration is explicit so engineers
    learn to classify data before it enters long-lived structures.
    """

    def __init__(self, dead_man: Optional[DeadManConfig] = None) -> None:
        self._lock = threading.RLock()
        self._volatile_store: Dict[str, Any] = {}
        self._wipe_targets: List[bytearray] = []
        self._dead_man = dead_man or DeadManConfig()
        self._last_activity = time.monotonic()
        self._armed = False
        self._watchdog_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def register_secret(self, key: str, value: Any) -> None:
        """Store a value in the volatile registry."""
        with self._lock:
            self._volatile_store[key] = value
            self._touch()

    def register_buffer(self, buf: bytearray) -> None:
        """Track a mutable buffer for later cryptographic overwrite."""
        with self._lock:
            self._wipe_targets.append(buf)
            self._touch()

    def get(self, key: str, default: Any = None) -> Any:
        with self._lock:
            self._touch()
            return self._volatile_store.get(key, default)

    def _touch(self) -> None:
        self._last_activity = time.monotonic()

    def secure_wipe_buffer(self, buf: bytearray) -> None:
        """
        Overwrite buffer contents with random bytes then zero-fill.

        SKILL BREAKDOWN: Secure Memory Wipe
        -----------------------------------
        A single zero-fill may be optimized away by compilers in lower-level
        languages; here we first write OS CSPRNG bytes to maximize the chance
        the original plaintext is displaced in the underlying bytes object
        before shrinking references.
        """
        if not isinstance(buf, bytearray):
            return
        for i in range(len(buf)):
            buf[i] = secrets.randbits(8)
        for i in range(len(buf)):
            buf[i] = 0

    def secure_wipe_all(self) -> int:
        """
        Wipe tracked buffers and clear volatile store.

        Returns the count of wiped artifacts.
        """
        wiped = 0
        with self._lock:
            for buf in self._wipe_targets:
                self.secure_wipe_buffer(buf)
                wiped += 1
            self._wipe_targets.clear()

            for key in list(self._volatile_store.keys()):
                value = self._volatile_store.pop(key)
                if isinstance(value, bytearray):
                    self.secure_wipe_buffer(value)
                del value
                wiped += 1

            self._volatile_store.clear()
            gc.collect()
        return wiped

    def arm_dead_man_switch(self) -> None:
        """
        Start watchdog thread that fires if inactivity exceeds threshold.

        SKILL BREAKDOWN: Dead-Man's Switch
        ----------------------------------
        Used when an operator may be compromised or walk away from an active
        session. Inactivity-based annihilation limits the window where
        recovered RAM or swap could expose research artifacts.
        """
        if self._armed or not self._dead_man.enabled:
            return
        self._armed = True
        self._stop_event.clear()
        self._watchdog_thread = threading.Thread(
            target=self._dead_man_loop,
            name="TitanRE-DeadMan",
            daemon=True,
        )
        self._watchdog_thread.start()

    def disarm_dead_man_switch(self) -> None:
        self._stop_event.set()
        self._armed = False

    def trigger_dead_man_switch(self, reason: str = "manual") -> int:
        """Immediately execute wipe and optional callback."""
        count = self.secure_wipe_all()
        if self._dead_man.on_trigger:
            self._dead_man.on_trigger()
        return count

    def _dead_man_loop(self) -> None:
        while not self._stop_event.is_set():
            time.sleep(1.0)
            with self._lock:
                idle = time.monotonic() - self._last_activity
            if idle >= self._dead_man.timeout_seconds:
                self.trigger_dead_man_switch(reason="timeout")
                break

    def simulate_ram_only_execution(self, work: Callable[[], Any]) -> Any:
        """
        Execute callable and wipe transient buffers afterward.

        SKILL BREAKDOWN: TmpFS / Ephemeral Execution
        ----------------------------------------------
        Wraps sensitive work so buffers created in the callable can be
        registered and purged even if an exception occurs (finally block).
        """
        temp_buffers: List[bytearray] = []

        try:
            return work()
        finally:
            for buf in temp_buffers:
                self.secure_wipe_buffer(buf)
            temp_buffers.clear()
            gc.collect()

    @property
    def volatile_keys(self) -> List[str]:
        with self._lock:
            return list(self._volatile_store.keys())
