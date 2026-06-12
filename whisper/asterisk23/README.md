# Asterisk Real-Time Transcription Using AudioSocket and Whisper

This guide explains how to stream live call audio from Asterisk to a Whisper transcription server using the built-in AudioSocket application.

Unlike ExternalMedia, AudioSocket uses a direct TCP connection and does not require RTP processing, bridge creation, or ARI applications.

---

# Overview

The call flow is:

```text
Caller
   │
   ▼
Extension 800
   │
   ▼
AudioSocket()
   │
   ▼
TCP Audio Stream
   │
   ▼
Whisper Server
   │
   ▼
Live Transcript
```

---

# Requirements

## Asterisk

Recommended versions:

* Asterisk 22+

Required modules:

```bash
app_audiosocket.so
```

Verify:

```bash
module show like audiosocket
```

Expected:

```text
app_audiosocket.so
```

---

# Dialplan Configuration

Add the following to:

```text
extensions_custom.conf
```

```asterisk
[from-internal]

exten => 800,1,NoOp(AudioSocket Test)
 same => n,Answer()
 same => n,Set(UUID=${UUID()})
 same => n,AudioSocket(${UUID},100.122.218.38:9090)
 same => n,Hangup()
```

Reload the dialplan:

```bash
asterisk -rx "dialplan reload"
```

---

# How AudioSocket Works

When a caller dials extension:

```text
800
```

Asterisk:

1. Answers the call.
2. Generates a unique call UUID.
3. Opens a TCP connection to the AudioSocket server.
4. Streams raw call audio over TCP.
5. Closes the connection when the call ends.

No ARI application is required.

No RTP processing is required.

No bridge creation is required.

---

# AudioSocket Protocol

AudioSocket sends framed packets over TCP.

Each packet contains:

```text
+--------+--------+--------+
| Type   | Length | Data   |
+--------+--------+--------+
 1 byte   2 bytes   N bytes
```

Packet length is encoded as:

```text
Big Endian (Network Order)
```

---

# Common Packet Types

## Hangup

```text
0x00
```

Indicates the call has ended.

---

## Audio

```text
0x10
```

Contains audio payload data.

These packets are continuously sent during the call.

---

# Audio Format

AudioSocket delivers:

| Property    | Value             |
| ----------- | ----------------- |
| Format      | Signed Linear PCM |
| Channels    | Mono              |
| Sample Rate | 8000 Hz           |
| Sample Size | 16-bit            |
| Transport   | TCP               |

Because the audio is already linear PCM:

* No RTP decoding is needed.
* No μ-law conversion is needed.
* No codec transcoding is needed.

This makes AudioSocket significantly simpler than ExternalMedia for transcription workloads.

---

# Whisper Integration

The transcription service should:

1. Accept TCP connections.
2. Parse AudioSocket frames.
3. Extract audio packets.
4. Buffer audio samples.
5. Send buffered audio to Whisper.
6. Output transcription results.

Recommended Whisper models:

| Model    | Speed    | Accuracy |
| -------- | -------- | -------- |
| base     | Fast     | Basic    |
| small    | Fast     | Good     |
| medium   | Balanced | Better   |
| large-v3 | Slower   | Best     |

For production deployments:

* GPU acceleration is recommended.
* INT8 quantization provides good performance.
* Process audio in chunks rather than waiting for call completion.

---

# Network Requirements

Example deployment:

```text
Asterisk Server
192.168.1.10

Whisper Server
100.122.218.38:9090
```

Allow:

```text
TCP/9090
```

from the Asterisk server to the transcription server.

---

# Testing

Start the AudioSocket transcription server.

Call:

```text
800
```

Expected behavior:

1. Asterisk connects to the AudioSocket server.
2. Audio packets begin flowing.
3. Speech is processed by Whisper.
4. Transcripts are displayed in real time.
5. Connection closes automatically when the call ends.

---

# Troubleshooting

## AudioSocket Connection Fails

Verify the server is listening:

```bash
ss -lntp | grep 9090
```

Expected:

```text
LISTEN 0 128 *:9090
```

---

## Cannot Connect

Test connectivity from the Asterisk server:

```bash
telnet 100.122.218.38 9090
```

or

```bash
nc -vz 100.122.218.38 9090
```

---

## No Audio Received

Verify:

* The call is answered.
* AudioSocket is reached in the dialplan.
* The TCP connection remains open.
* Firewalls allow TCP/9090.

---

## Poor Transcription Quality

Verify:

* Audio is interpreted as signed 16-bit PCM.
* Sample rate is 8000 Hz.
* Audio buffers are not truncated.
* Background noise is minimized.

---

# AudioSocket vs ExternalMedia

| Feature                 | AudioSocket | ExternalMedia |
| ----------------------- | ----------- | ------------- |
| Setup Complexity        | Simple      | Advanced      |
| Uses ARI                | No          | Yes           |
| Uses RTP                | No          | Yes           |
| Uses TCP                | Yes         | No            |
| Requires Bridge         | No          | Yes           |
| RTP Parsing             | No          | Yes           |
| μ-law Decoding          | No          | Usually       |
| Real-Time Transcription | Yes         | Yes           |

For transcription-only applications, AudioSocket is typically easier to deploy and maintain.

---

# Production Recommendations

* Run Whisper on dedicated hardware.
* Use GPU acceleration when available.
* Implement connection monitoring.
* Log transcripts to a database.
* Add speaker tracking if needed.
* Implement automatic reconnect handling.
* Monitor CPU and memory usage during large call volumes.

---

# Summary

AudioSocket provides a straightforward way to stream live call audio from Asterisk directly to an external transcription service. Since audio is delivered over TCP as linear PCM, it eliminates RTP handling and codec conversion, making it an excellent choice for integrating Faster-Whisper and other speech-to-text engines.
