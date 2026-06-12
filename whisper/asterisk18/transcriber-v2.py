import socket
import audioop
import threading
import time

import numpy as np
from faster_whisper import WhisperModel

HOST = "0.0.0.0"
PORT = 4000

# RTP G.711 μ-law input
INPUT_RATE = 8000
WHISPER_RATE = 16000

# Keep last 15 seconds only
WINDOW_SECONDS = 15
MAX_BUFFER_BYTES = INPUT_RATE * 2 * WINDOW_SECONDS

model = WhisperModel(
    "large-v3",
    device="auto",
    compute_type="int8",
)

audio_buffer = bytearray()
buffer_lock = threading.Lock()

last_text = ""


def transcriber():
    global last_text

    while True:
        time.sleep(1)

        with buffer_lock:
            # Wait until we have at least 3 seconds of audio
            if len(audio_buffer) < INPUT_RATE * 2 * 3:
                continue

            pcm = bytes(audio_buffer)

        try:
            # Resample 8kHz -> 16kHz
            pcm16k, _ = audioop.ratecv(
                pcm,
                2,              # sample width
                1,              # mono
                INPUT_RATE,
                WHISPER_RATE,
                None,
            )

            audio = (
                np.frombuffer(pcm16k, dtype=np.int16)
                .astype(np.float32)
                / 32768.0
            )

            segments, _ = model.transcribe(
                audio,
                language=None,
                beam_size=1,
                vad_filter=True,
            )

            text = " ".join(
                segment.text.strip()
                for segment in segments
            ).strip()

            if not text:
                continue

            # Print only new text
            if text.startswith(last_text):
                new_text = text[len(last_text):].strip()
            else:
                new_text = text

            if new_text:
                print(new_text, flush=True)

            last_text = text

        except Exception as e:
            print("Whisper error:", e)


threading.Thread(
    target=transcriber,
    daemon=True,
).start()

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((HOST, PORT))

print(f"Listening RTP on UDP {PORT}")

while True:
    try:
        packet, addr = sock.recvfrom(2048)

        if len(packet) <= 12:
            continue

        # RTP payload (assumes standard 12-byte RTP header)
        payload = packet[12:]

        # μ-law -> 16-bit PCM
        pcm = audioop.ulaw2lin(payload, 2)

        with buffer_lock:
            audio_buffer.extend(pcm)

            # Keep only the latest WINDOW_SECONDS
            if len(audio_buffer) > MAX_BUFFER_BYTES:
                del audio_buffer[:-MAX_BUFFER_BYTES]

    except Exception as e:
        print("RTP error:", e)