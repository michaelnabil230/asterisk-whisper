# Asterisk Real-Time Call Transcription Using ARI and Whisper

This guide explains how to build real-time call transcription on older Asterisk versions using:

* Asterisk ARI (Asterisk REST Interface)
* Stasis applications
* ExternalMedia channels
* RTP audio streaming
* Faster-Whisper speech recognition

The solution streams live call audio from Asterisk to an external transcription service over RTP, where Whisper converts speech into text in real time.

---

# Architecture

```text
Caller
  │
  ▼
Asterisk Extension (800)
  │
  ▼
Stasis Application
  │
  ▼
ARI Application
  │
  ▼
Mixing Bridge
  │
  ├── Caller Channel
  │
  └── ExternalMedia Channel
           │
           ▼
      RTP Audio Stream
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

* Asterisk 16+
* Asterisk 18+
* Asterisk 20+

Required modules:

```bash
res_ari.so
res_ari_channels.so
res_ari_bridges.so
res_http_websocket.so
chan_rtp.so
```

Verify loaded modules:

```bash
module show like ari
module show like rtp
```

---

# Enable ARI

Edit:

```ini
/etc/asterisk/http.conf
```

Example configuration:

```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
```

Edit:

```ini
/etc/asterisk/ari.conf
```

Example:

```ini
[general]
enabled=yes
pretty=yes

[node]
type=user
read_only=no
password=secret123
```

Reload ARI:

```bash
asterisk -rx "module reload res_ari.so"
```

Verify connectivity:

```bash
curl -u node:secret123 \
https://localhost:8088/ari/applications
```

---

# Dialplan Configuration

Add a custom extension to send calls into a Stasis application.

File:

```text
extensions_custom.conf
```

Example:

```asterisk
[from-internal-custom]

exten => 800,1,NoOp(Whisper AI Call)
 same => n,Answer()
 same => n,Stasis(whisper-app)
 same => n,Hangup()
```

Reload the dialplan:

```bash
asterisk -rx "dialplan reload"
```

Calling extension **800** will now transfer the call into the ARI application.

---

# How the ARI Application Works

When a caller reaches extension **800**:

1. The call enters the `whisper-app` Stasis application.
2. The ARI application receives a `StasisStart` event.
3. A mixing bridge is created.
4. The caller channel is added to the bridge.
5. An ExternalMedia channel is created.
6. The ExternalMedia channel is added to the bridge.
7. Asterisk begins streaming RTP audio to the configured external host.
8. The transcription server receives the RTP stream and sends audio to Whisper.
9. Whisper generates live text transcription.

---

# RTP Audio Format

The ExternalMedia channel streams audio as:

| Property    | Value        |
| ----------- | ------------ |
| Codec       | G.711 μ-law  |
| Sample Rate | 8000 Hz      |
| Channels    | Mono         |
| Transport   | RTP over UDP |

The transcription service must be able to:

1. Receive RTP packets.
2. Extract the RTP payload.
3. Decode G.711 μ-law audio.
4. Convert audio to PCM.
5. Resample from 8 kHz to 16 kHz if required.
6. Pass audio into Whisper.

---

# Whisper Server Requirements

The transcription server should:

* Listen on a UDP port.
* Accept RTP packets from Asterisk.
* Decode μ-law audio.
* Process incoming audio continuously.
* Feed audio into Faster-Whisper.
* Output or store transcription results.

Recommended models:

* `base`
* `small`
* `medium`
* `large-v3`

For production deployments, GPU acceleration is recommended.

---

# Network Requirements

Allow UDP traffic from the Asterisk server to the transcription server.

Example:

```text
Asterisk Server
192.168.1.10

Whisper Server
192.168.1.20:4000
```

Ensure:

```bash
UDP/4000
```

is reachable from the Asterisk host.

---

# Testing

1. Start the transcription server.
2. Start the ARI application.
3. Verify ARI is connected.
4. Call extension:

```text
800
```

5. Speak into the call.
6. Confirm RTP packets are being received.
7. Confirm transcription output is generated.

---

# Troubleshooting

## No ARI Connection

Verify:

```bash
curl -u node:secret123 \
https://localhost:8088/ari/applications
```

Check:

```bash
asterisk -rvvv
```

for ARI-related errors.

---

## No RTP Traffic

Capture traffic:

```bash
tcpdump -ni any udp port 4000
```

If no packets appear:

* Verify the ExternalMedia channel is created.
* Verify firewall rules.
* Verify the destination IP address.
* Verify the destination UDP port.

---

## ExternalMedia Channel Fails

Verify channel support:

```bash
core show channeltypes
```

You should see:

```text
UnicastRTP
```

available.

---

## Poor Transcription Quality

Common causes:

* Packet loss
* Incorrect codec configuration
* Audio clipping
* Background noise
* Incorrect sample rate conversion

---

# Production Recommendations

* Use a dedicated transcription server.
* Run Whisper on GPU hardware when possible.
* Implement RTP buffering and jitter handling.
* Store transcripts in a database.
* Add speaker identification if required.
* Monitor ARI application health.
* Implement automatic bridge cleanup when calls end.

---

# Use Cases

This architecture can be extended for:

* Live call transcription
* Real-time translation
* AI call assistants
* Agent assistance
* Compliance monitoring
* Sentiment analysis
* Voice bots
* Call summaries
* Speech analytics

---

# Summary

Asterisk streams call audio through an ExternalMedia channel into a Whisper-powered transcription service. The ARI application manages the call and bridge lifecycle, while the external transcription server receives RTP audio and converts speech into text in real time.
