import socket
import audioop
import threading
import time

import numpy as np
from faster_whisper import WhisperModel

HOST = "0.0.0.0"
PORT = 4000

INPUT_RATE = 8000
WHISPER_RATE = 16000

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
            if not audio_buffer:
                continue

            pcm = bytes(audio_buffer)

        try:
            # Resample 8kHz -> 16kHz
            pcm16k, _ = audioop.ratecv(
                pcm,
                2,
                1,
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

            if text and text != last_text:
                print(text, flush=True)
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
    packet, addr = sock.recvfrom(2048)

    if len(packet) <= 12:
        continue

    try:
        # RTP payload (assumes standard 12-byte RTP header)
        payload = packet[12:]

        # G.711 μ-law -> 16-bit PCM
        pcm = audioop.ulaw2lin(payload, 2)

        with buffer_lock:
            audio_buffer.extend(pcm)

    except Exception as e:
        print("RTP error:", e)