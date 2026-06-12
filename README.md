# Asterisk Whisper

A collection of Asterisk integration examples covering real-time speech recognition, media streaming, and browser-based SIP communications.

This repository demonstrates multiple approaches for working with Asterisk, including:

* ARI (Asterisk REST Interface)
* ExternalMedia channels
* AudioSocket
* Faster-Whisper transcription
* SIP.js
* WebRTC softphones
* Browser SIP clients

---

# Repository Structure

```text
.
├── README.md
├── Makefile
├── sip
│   ├── README.md
│   ├── index.html
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
└── whisper
    ├── asterisk18
    │   ├── README.md
    │   ├── requirements.txt
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── server.js
    │   ├── transcriber-v2.py
    │   └── transcriber.py
    └── asterisk23
        ├── README.md
        ├── requirements.txt
        └── server.py
```

---

# Quick Start

## Clone Repository

```bash
git clone https://github.com/michaelnabil230/asterisk-whisper
cd asterisk-whisper
```

---

## Install Everything

```bash
make install
```

This will:

* Install SIP dependencies
* Create Python virtual environments
* Install Python requirements
* Install Node.js dependencies

---

## Install Individual Projects

### SIP.js WebRTC Client

```bash
make install-sip
```

### Asterisk 18 + Whisper

```bash
make install-a18
```

### Asterisk 23 + Whisper

```bash
make install-a23
```

---

## Run Examples

### SIP.js WebRTC Client

```bash
make start-sip
```

### Asterisk 18 Whisper Transcriber

```bash
make start-a18
```

### Asterisk 18 Whisper Transcriber V2

```bash
make start-a18-v2
```

### Asterisk 23 AudioSocket Server

```bash
make start-a23
```

---

## Show Available Commands

```bash
make help
```

---

# Projects

## SIP

Browser-based SIP softphone built with SIP.js and WebRTC.

### Features

* SIP over WebSocket
* Browser registration
* Incoming calls
* Outgoing calls
* Remote audio playback
* WebRTC support
* Compatible with Asterisk PJSIP

Documentation:

```text
sip/README.md
```

---

## Whisper

Real-time speech-to-text integrations using Faster-Whisper.

Documentation:

```text
whisper/
```

### Asterisk 18

Uses:

* ARI
* Stasis
* Mixing Bridges
* ExternalMedia
* RTP Streaming

Flow:

```text
Caller
  →
Asterisk
  →
ARI
  →
ExternalMedia
  →
RTP
  →
Whisper
```

Documentation:

```text
whisper/asterisk18/README.md
```

---

### Asterisk 23

Uses:

* AudioSocket
* TCP Audio Streaming
* Faster-Whisper

Flow:

```text
Caller
  →
Asterisk
  →
AudioSocket
  →
Whisper
```

Documentation:

```text
whisper/asterisk23/README.md
```

---

# Requirements

Depending on the example, you may need:

* Asterisk 18+
* Asterisk 23+
* Node.js 20+
* Python 3.10+
* Faster-Whisper
* SIP.js
* WebRTC-compatible browser

Verify your environment:

```bash
node -v
npm -v
python3 --version
```

---

# Makefile Commands

```bash
make help
make install

make install-sip
make install-a18
make install-a23

make start-sip
make start-a18
make start-a18-v2
make start-a23
```

---

# Use Cases

These examples can be used as a starting point for:

* Live call transcription
* AI phone systems
* Real-time translation
* Voice assistants
* Agent assist platforms
* Browser softphones
* Speech analytics
* Call summaries
* AI-powered IVR systems

---

# Manual Setup

If you prefer not to use the Makefile:

### Create Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Install Python Dependencies

```bash
pip install -U pip
pip install -r requirements.txt
```

### Install Node Dependencies

```bash
npm install
```

