"""
Intentionally vulnerable mock API for TitanRE self-testing.

SKILL BREAKDOWN: Deliberate Vulnerability Seeding
-------------------------------------------------
Educational targets embed classic API flaws (IDOR, mass assignment) so the
Vulnerability Path Tracer can validate detection logic against known ground
truth without touching external systems.

Run: python tests/mock_target_server.py
"""

from __future__ import annotations

import json
import traceback
from typing import Any, Dict

from flask import Flask, jsonify, request

app = Flask(__name__)

# In-memory user store — alice=1, bob=2
USERS: Dict[int, Dict[str, Any]] = {
    1: {"id": 1, "name": "alice", "role": "user", "is_admin": False},
    2: {"id": 2, "name": "bob", "role": "user", "is_admin": False},
}

SESSIONS: Dict[str, int] = {}


@app.route("/auth", methods=["POST"])
def auth() -> Any:
    """
    Step 1: Authentication — returns session token.

    SKILL BREAKDOWN: Auth Hop in Path Tracer
    ----------------------------------------
    Issues a bearer token bound to user_id for subsequent resource hops.
    """
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")
    if username == "alice" and password == "alice123":
        token = "tok-alice-session"
        SESSIONS[token] = 1
        return jsonify({"token": token, "user_id": 1, "user": USERS[1]})
    return jsonify({"error": "invalid credentials"}), 401


@app.route("/api/user/<int:user_id>", methods=["GET"])
def get_user(user_id: int) -> Any:
    """
    IDOR vulnerability — no authorization check on object owner.

    SKILL BREAKDOWN: BOLA/IDOR Ground Truth
    ---------------------------------------
    Any caller can fetch any user by ID; authenticated alice can read bob's
    record — classic broken object-level authorization.
    """
    user = USERS.get(user_id)
    if user is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(user)


@app.route("/api/profile", methods=["POST"])
def update_profile() -> Any:
    """
    Mass assignment vulnerability — merges all JSON fields into user model.

    SKILL BREAKDOWN: Mass Assignment Ground Truth
    ---------------------------------------------
    Accepts privileged keys like role/is_admin from client without allow-list.
    """
    data = request.get_json(silent=True) or {}
    user_id = 1  # defaults to alice for lab
    user = USERS[user_id].copy()
    user.update(data)
    USERS[user_id] = user
    return jsonify({"status": "updated", "user": user})


@app.route("/api/debug", methods=["POST"])
def debug() -> Any:
    """Error propagation — returns verbose traceback (intentional)."""
    try:
        payload = request.get_json(silent=True) or {}
        if payload.get("__crash"):
            raise ValueError(f"Simulated fault: {payload['__crash']}")
        return jsonify({"ok": True})
    except Exception as exc:  # noqa: BLE001 — intentional for lab
        return jsonify(
            {
                "error": str(exc),
                "traceback": traceback.format_exc(),
                "exception": type(exc).__name__,
            }
        ), 500


@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "service": "titanre-mock-target"})


if __name__ == "__main__":
    print("TitanRE mock target listening on http://127.0.0.1:8765")
    app.run(host="127.0.0.1", port=8765, debug=False, threaded=True)
