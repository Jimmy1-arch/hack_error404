import speech_recognition as sr
import threading
import queue

class VoiceListener:
    def __init__(self, callback):
        self.recognizer = sr.Recognizer()
        self.callback = callback
        self.microphone = sr.Microphone()
        self.is_listening = False
        self.stop_listening_fn = None

    def start(self):
        if self.is_listening:
            return
        self.is_listening = True
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source)
            
        print("Voice listener started...")
        self.stop_listening_fn = self.recognizer.listen_in_background(self.microphone, self.callback_wrapper)

    def callback_wrapper(self, recognizer, audio):
        try:
            text = recognizer.recognize_google(audio).lower()
            if text:
                print(f"[Voice Detected]: {text}")
                self.callback(text)
        except sr.UnknownValueError:
            pass
        except sr.RequestError as e:
            print(f"Could not request results; {e}")

    def stop(self):
        if self.stop_listening_fn:
            self.stop_listening_fn(wait_for_stop=False)
        self.is_listening = False
        print("Voice listener stopped.")
