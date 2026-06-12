import socket
import struct
import tempfile
import wave
import threading

from faster_whisper import WhisperModel

HOST = "0.0.0.0"
PORT = 9090

print("Loading model...")

model = WhisperModel(
    "large-v3",
    device="auto",
    compute_type="int8",
)

print("Whisper ready")

def save_wav(audio_bytes):
    tmp = tempfile.NamedTemporaryFile(
        suffix=".wav",
        delete=False
    )

    with wave.open(tmp.name, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8000)
        wav_file.writeframes(audio_bytes)

    return tmp.name


def transcribe(audio_bytes):

    if len(audio_bytes) < 16000:
        return
    
    wav_path = save_wav(audio_bytes)

    segments, info = model.transcribe(
        wav_path,
        language=None,
        beam_size=1
    )

    text = " ".join(
        segment.text.strip()
        for segment in segments
    )

    if text.strip():
        print("TRANSCRIPT:", text)


def handle_client(conn):

    print("AudioSocket Connected")

    audio_buffer = b""

    try:

        while True:

            header = conn.recv(3)

            if not header:
                break

            packet_type = header[0]
            packet_len = struct.unpack(">H", header[1:3])[0]

            payload = b""

            while len(payload) < packet_len:
                chunk = conn.recv(packet_len - len(payload))

                if not chunk:
                    break

                payload += chunk

            #
            # Audio packet
            #
            if packet_type == 0x10:

                audio_buffer += payload

                if len(audio_buffer) >= 160000:
                    transcribe(audio_buffer)
                    audio_buffer = b""

            #
            # Hangup
            #
            elif packet_type == 0x00:
                break

    except Exception as e:
        print("ERROR:", e)

    finally:

        if audio_buffer:
            transcribe(audio_buffer)

        conn.close()

        print("Disconnected")


server = socket.socket(
    socket.AF_INET,
    socket.SOCK_STREAM
)

server.setsockopt(
    socket.SOL_SOCKET,
    socket.SO_REUSEADDR,
    1
)

server.bind((HOST, PORT))
server.listen(10)

print(f"Listening on {HOST}:{PORT}")

while True:

    client, addr = server.accept()

    threading.Thread(
        target=handle_client,
        args=(client,),
        daemon=True
    ).start()