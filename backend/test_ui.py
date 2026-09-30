from backend.vscode_voice.ui import FloatingUI
import time

def allow(): print("allow")
def deny(): print("deny")
def stop(): print("stop")

ui = FloatingUI(allow, deny, stop)
time.sleep(2)
ui.update_status("Testing UI...")
time.sleep(5)
ui.request_permission()
time.sleep(5)
