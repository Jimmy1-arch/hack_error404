import asyncio
import os
import tempfile
try:
    import edge_tts
    import pygame
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

class AgentTTS:
    def __init__(self):
        self.voice = "en-US-AriaNeural"
        if EDGE_TTS_AVAILABLE:
            pygame.mixer.init()
            
        if PYTTSX3_AVAILABLE:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 160)
            
    async def speak(self, text: str):
        if EDGE_TTS_AVAILABLE:
            try:
                communicate = edge_tts.Communicate(text, self.voice)
                
                # Create a temporary file
                fd, temp_path = tempfile.mkstemp(suffix=".mp3")
                os.close(fd)
                
                await communicate.save(temp_path)
                
                # Play audio using pygame
                pygame.mixer.music.load(temp_path)
                pygame.mixer.music.play()
                
                # Wait for playback to finish
                while pygame.mixer.music.get_busy():
                    await asyncio.sleep(0.1)
                
                pygame.mixer.music.unload()
                
                # Try to remove temp file
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
                return
            except Exception as e:
                print(f"Edge TTS failed: {e}. Falling back to pyttsx3.")
                
        # Fallback
        if PYTTSX3_AVAILABLE:
            self.engine.say(text)
            self.engine.runAndWait()
        else:
            print(f"TTS Output: {text}")

# Global instance for ease of use
tts_engine = AgentTTS()
