#!/usr/bin/env python3
import hashlib
import hmac
import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
REPO_URL = os.environ.get("REPO_URL", "")
BRANCH = os.environ.get("BRANCH", "main")
WEBHOOK_PATH = os.environ.get("WEBHOOK_PATH", "/webhook")
DEPLOY_SCRIPT = os.environ.get("DEPLOY_SCRIPT", "/srv/cc-financial/bin/deploy.sh")


def log(msg):
    print(msg, flush=True)


def verify_signature(body, signature_header):
    if not WEBHOOK_SECRET:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    digest = hmac.new(WEBHOOK_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()
    expected = f"sha256={digest}"
    return hmac.compare_digest(expected, signature_header)


def repo_matches(payload):
    if not REPO_URL:
        return True
    repo = payload.get("repository", {})
    urls = {
        repo.get("clone_url"),
        repo.get("git_url"),
        repo.get("ssh_url"),
        repo.get("html_url"),
    }
    return REPO_URL in urls


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok"})
            return
        self._send(404, {"error": "not_found"})

    def do_POST(self):
        if self.path != WEBHOOK_PATH:
            self._send(404, {"error": "not_found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)

        signature = self.headers.get("X-Hub-Signature-256", "")
        if not verify_signature(body, signature):
            log("signature verification failed")
            self._send(401, {"error": "invalid_signature"})
            return

        event = self.headers.get("X-GitHub-Event", "")
        delivery = self.headers.get("X-GitHub-Delivery", "")

        try:
            payload = json.loads(body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid_json"})
            return

        if event == "ping":
            self._send(200, {"status": "pong", "delivery": delivery})
            return

        if event != "push":
            self._send(202, {"status": "ignored", "event": event})
            return

        ref = payload.get("ref", "")
        if ref != f"refs/heads/{BRANCH}":
            self._send(202, {"status": "ignored", "ref": ref})
            return

        if not repo_matches(payload):
            self._send(202, {"status": "ignored", "reason": "repo_mismatch"})
            return

        log(f"deploy triggered: event=push delivery={delivery} ref={ref}")
        env = os.environ.copy()

        subprocess.Popen([DEPLOY_SCRIPT], env=env, start_new_session=True)
        self._send(202, {"status": "deploy_started"})

    def log_message(self, fmt, *args):
        return


def main():
    port = int(os.environ.get("WEBHOOK_PORT", "9000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    log(f"webhook listening on :{port}{WEBHOOK_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
