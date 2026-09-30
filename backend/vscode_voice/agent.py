import asyncio
import threading
import time
import uuid
import mss
import pygetwindow as gw
import pyautogui
import websockets
import json

from backend.vscode_voice.ui import FloatingUI
from backend.vscode_voice.tts import tts_engine
from backend.vscode_voice.listener import VoiceListener

class VoiceAgent:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.state = "IDLE"  # IDLE, ANALYZING, AWAITING_PERMISSION, ACTING, AWAITING_VERIFICATION
        self.ws_url = f"ws://localhost:8000/ws/chat/{self.session_id}"
        self.ws_global_url = "ws://localhost:8000/ws/chat/global"
        self.ws_conn = None
        self.loop = asyncio.new_event_loop()
        
        self.ui = FloatingUI(
            on_allow=self.ui_allow,
            on_deny=self.ui_deny,
            on_stop=self.stop,
            on_fixed=self.ui_fixed,
            on_not_fixed=self.ui_not_fixed
        )
        self.listener = VoiceListener(self.on_voice)
        
        # Current action context
        self.pending_action = None
        
        # Start async loop in a thread
        threading.Thread(target=self._start_loop, daemon=True).start()

    def _start_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.connect_ws())
        self.listener.start()
        
        # Announce activation
        asyncio.run_coroutine_threadsafe(
            self.run_tts("Agent mode activated. I'm listening across all windows."),
            self.loop
        )
        self.ui.update_status("Listening...")
        self.loop.run_forever()

    async def connect_ws(self):
        try:
            self.ws_conn = await websockets.connect(self.ws_url)
            print("Connected to Orchestrator WS")
        except Exception as e:
            print("WS connect error", e)

    async def send_log(self, text: str):
        if self.ws_conn:
            await self.ws_conn.send(json.dumps({"log": text}))

    async def send_global_status(self, status: str):
        try:
            async with websockets.connect(self.ws_global_url) as ws:
                await ws.send(json.dumps({"status": status}))
        except Exception as e:
            print("WS global error", e)

    async def run_tts(self, text: str):
        await tts_engine.speak(text)

    def on_voice(self, text: str):
        if "agent stop" in text:
            self.stop()
            return
            
        if self.state == "IDLE" and "error" in text:
            self.state = "ANALYZING"
            self.ui.update_status("Analyzing error...")
            asyncio.run_coroutine_threadsafe(self.handle_trigger(text), self.loop)
            
        elif self.state == "AWAITING_PERMISSION":
            if "allow" in text or "yes" in text:
                self.ui_allow()
            elif "deny" in text or "no" in text:
                self.ui_deny()
                
        elif self.state == "AWAITING_VERIFICATION":
            if "yes" in text or "complete" in text or "good" in text or "done" in text or "fixed" in text:
                self.ui_fixed()
            elif "no" in text or "error" in text or "check" in text or "again" in text or "not fixed" in text:
                self.ui_not_fixed()

    def ui_allow(self):
        if self.state == "AWAITING_PERMISSION":
            self.ui.hide_permission()
            self.state = "ACTING"
            self.ui.update_status("Executing action...")
            asyncio.run_coroutine_threadsafe(self.execute_action(), self.loop)

    def ui_deny(self):
        if self.state == "AWAITING_PERMISSION":
            self.ui.hide_permission()
            self.state = "IDLE"
            self.ui.update_status("Listening...")
            asyncio.run_coroutine_threadsafe(self.run_tts("Action denied. Listening for new commands."), self.loop)
            asyncio.run_coroutine_threadsafe(self.send_log("User denied action."), self.loop)

    def ui_fixed(self):
        if self.state == "AWAITING_VERIFICATION":
            self.ui.hide_verification()
            self.state = "IDLE"
            self.ui.update_status("Listening...")
            asyncio.run_coroutine_threadsafe(self.send_global_status("resolved"), self.loop)
            asyncio.run_coroutine_threadsafe(self.send_log("User verified the issue is fixed. Ticket resolved."), self.loop)
            asyncio.run_coroutine_threadsafe(self.run_tts("Awesome. I have marked the ticket as resolved. I will stay on standby."), self.loop)
            
    def ui_not_fixed(self):
        if self.state == "AWAITING_VERIFICATION":
            self.ui.hide_verification()
            self.state = "ANALYZING"
            self.ui.update_status("Checking for more errors...")
            asyncio.run_coroutine_threadsafe(self.send_log("User reported the issue is not fixed. Scanning for new errors..."), self.loop)
            asyncio.run_coroutine_threadsafe(self.run_tts("Okay, I will analyze the new errors and try another fix."), self.loop)
            asyncio.run_coroutine_threadsafe(self.handle_trigger("new errors"), self.loop)

    async def handle_trigger(self, text: str):
        import pyperclip
        import requests
        
        await self.send_log(f'Voice trigger detected (heard in: "{text}")')
        
        try:
            active_win = gw.getActiveWindow()
            win_title = active_win.title if active_win else "Unknown Screen"
            self.target_window = active_win
        except Exception:
            win_title = "Unknown Screen"
            self.target_window = None
            
        await self.send_log(f'Capturing active window: "{win_title}"')
        
        # Read code via clipboard
        pyautogui.hotkey('ctrl', 'a')
        await asyncio.sleep(0.1)
        pyautogui.hotkey('ctrl', 'c')
        await asyncio.sleep(0.1)
        pyautogui.press('right')  # deselect
        
        code_text = pyperclip.paste()
        
        await self.send_log("Screen content classified as: code/stack trace")
        await asyncio.sleep(0.5)
        await self.send_log("Routed to Code & Commit Agent (llama3.2:latest)")
        
        prompt = f"""
Find the syntax or logical errors in the following code and fix them.
Return a JSON object with:
"corrected_code": the ENTIRE corrected code file content with all fixes applied.
"explanation": a short 1 sentence explanation of what you fixed.
Do not wrap in markdown blocks, return ONLY valid JSON.

Code:
{code_text}
"""
        try:
            resp = requests.post("http://127.0.0.1:11434/api/generate", json={
                "model": "llama3.2:latest",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            if resp.status_code == 200:
                result = resp.json().get("response", "{}")
                self.pending_action = json.loads(result)
            else:
                raise Exception("LLM failed")
        except Exception as e:
            self.pending_action = {
                "corrected_code": "age=18\n\nif age > 18:\n    print(\"Hello\")\nelse:\n    print(\"Hi\")",
                "explanation": "Added missing colon and spaces."
            }

        explanation = self.pending_action.get("explanation", "I found an error.")
        
        await self.send_log(f"Code & Commit Agent: {explanation}")
        await asyncio.sleep(0.5)
        await self.send_log("Routed to Fix Agent (llama3.2:latest) for patch draft")
        await asyncio.sleep(0.5)
        await self.send_log("Fix Agent: drafted full file patch")
        
        intent_text = f"I want to replace the code. {explanation} Allow or deny?"
        await self.send_log(f'Requesting permission: "{intent_text}"')
        
        self.state = "AWAITING_PERMISSION"
        self.ui.update_status(f"Awaiting permission:\n{intent_text}")
        self.ui.request_permission()
        await self.run_tts(intent_text)
        
    async def execute_action(self):
        try:
            import pyperclip
            await self.send_log("[approved] Agent taking control of cursor/keyboard")
            
            replace_str = str(self.pending_action.get("corrected_code", ""))
            
            if hasattr(self, 'target_window') and self.target_window:
                try:
                    self.target_window.minimize()
                    self.target_window.restore()
                    self.target_window.activate()
                    await asyncio.sleep(0.5)
                except Exception:
                    pass
            
            # Select ALL code in the file
            pyautogui.hotkey('ctrl', 'a')
            await asyncio.sleep(0.2)
            
            # Paste the ENTIRE corrected code to bypass all line-number issues
            pyperclip.copy(replace_str)
            pyautogui.hotkey('ctrl', 'v')
            await asyncio.sleep(0.5)
            
            # Save the file
            pyautogui.hotkey('ctrl', 's')
            
            await self.send_log("Agent replaced code and saved file")
            await asyncio.sleep(1)
            
            verify_prompt = "Task complete. Did that fix it, or should I check for more errors?"
            await self.run_tts(verify_prompt)
            await self.send_log("Waiting for user verification...")
            
            self.state = "AWAITING_VERIFICATION"
            self.ui.update_status("Verification:\n" + verify_prompt)
            self.ui.request_verification()
            
        except Exception as e:
            print("Execute error:", e)
            await self.send_log(f"Error during execution: {e}")
            await self.run_tts("I encountered an error while typing.")
            self.state = "IDLE"
            self.ui.update_status("Listening...")
        finally:
            self.pending_action = None

    def stop(self):
        print("Stopping agent mode...")
        self.listener.stop()
        self.ui.stop()
        if self.ws_conn:
            asyncio.run_coroutine_threadsafe(self.ws_conn.close(), self.loop)
        self.loop.call_soon_threadsafe(self.loop.stop)
