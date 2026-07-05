"""BENIGN TEST FIXTURE -- intentionally insecure patterns for the analyzer.

This file is *sample input* for the static analyzer's detection rules. It is
not a real application and is never executed by the toolkit (the analyzer only
parses it). It deliberately contains well-known insecure coding patterns so the
detector has something to find during demos and tests.
"""

import hashlib
import os
import pickle
import sqlite3
import subprocess

import yaml
from flask import Flask, request

app = Flask(__name__)

# CWE-798: hard-coded secret.
API_KEY = "sk_live_hardcoded_example_key_do_not_use"


@app.route("/run")
def run_command():
    # CWE-78: OS command injection via shell=True with user input.
    cmd = request.args.get("cmd", "")
    subprocess.call("echo " + cmd, shell=True)
    os.system("uptime")
    return "ok"


@app.route("/calc")
def calc():
    # CWE-95: code injection via eval on untrusted input.
    expr = request.args.get("expr", "0")
    return str(eval(expr))


@app.route("/user")
def get_user():
    # CWE-89: SQL injection via string formatting.
    user_id = request.args.get("id", "")
    conn = sqlite3.connect("app.db")
    conn.execute("SELECT * FROM users WHERE id = '%s'" % user_id)
    return "done"


def load_profile(blob):
    # CWE-502: insecure deserialization.
    return pickle.loads(blob)


def load_config(text):
    # CWE-502: unsafe YAML load.
    return yaml.load(text)


def checksum(data):
    # CWE-327: weak hash algorithm.
    return hashlib.md5(data).hexdigest()


if __name__ == "__main__":
    # CWE-489 style exposure: binds on all interfaces with debug on.
    app.run(host="0.0.0.0", port=8000, debug=True)
