import subprocess
import threading
import json
import os
import sys

class FloatingUI:
    def __init__(self, on_allow, on_deny, on_stop, on_fixed=None, on_not_fixed=None):
        self.on_allow = on_allow
        self.on_deny = on_deny
        self.on_stop = on_stop
        self.on_fixed = on_fixed
        self.on_not_fixed = on_not_fixed
        
        script_path = os.path.join(os.path.dirname(__file__), "ui_process.py")
        self.proc = subprocess.Popen(
            [sys.executable, script_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True
        )
        
        threading.Thread(target=self._read_output, daemon=True).start()

    def _read_output(self):
        while True:
            line = self.proc.stdout.readline()
            if not line:
                break
            cmd = line.strip()
            if cmd == "allow":
                self.on_allow()
            elif cmd == "deny":
                self.on_deny()
            elif cmd == "stop":
                self.on_stop()
            elif cmd == "fixed" and self.on_fixed:
                self.on_fixed()
            elif cmd == "not_fixed" and self.on_not_fixed:
                self.on_not_fixed()

    def _send(self, data):
        if self.proc.poll() is None:
            self.proc.stdin.write(json.dumps(data) + "\n")
            self.proc.stdin.flush()

    def update_status(self, text: str):
        self._send({"type": "status", "text": text})

    def request_permission(self):
        self._send({"type": "permission"})

    def hide_permission(self):
        self._send({"type": "hide_permission"})
        
    def request_verification(self):
        self._send({"type": "verification"})
        
    def hide_verification(self):
        self._send({"type": "hide_verification"})

    def stop(self):
        self._send({"type": "stop"})
        try:
            self.proc.terminate()
        except Exception:
            pass
