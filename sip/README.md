# Browser SIP Phone with SIP.js and Asterisk WebRTC

This guide explains how to create a browser-based SIP softphone using:

* Asterisk PJSIP
* WebRTC
* SIP over WebSocket (WS/WSS)
* SIP.js
* HTML and JavaScript

The application allows users to:

* Register SIP extensions from a web browser
* Make outbound calls
* Receive inbound calls
* Play remote audio
* Hang up active calls

---

# Architecture

```text
Browser
   │
   │ SIP over WebSocket
   ▼
Asterisk PJSIP
   │
   │ SIP
   ▼
Extensions / Trunks
```

For media:

```text
Browser Microphone
        │
        ▼
      WebRTC
        │
        ▼
    Asterisk
        │
        ▼
 Remote Extension

 Remote Audio
        │
        ▼
    Asterisk
        │
        ▼
      Browser
```

---

# Requirements

## Asterisk

Recommended versions:

* Asterisk 18+
* Asterisk 20+
* Asterisk 22+

Required modules:

```bash
res_pjsip.so
res_pjsip_transport_websocket.so
res_http_websocket.so
res_rtp_asterisk.so
res_srtp.so
codec_opus.so
```

Verify:

```bash
module show like websocket
module show like pjsip
```

---

# Enable HTTP/WebSocket

Edit:

```text
/etc/asterisk/http.conf
```

Example:

```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
```

Reload:

```bash
asterisk -rx "http reload"
```

Verify:

```bash
curl http://ASTERISK_IP:8088/httpstatus
```

---

# Configure WebSocket Transport

Add a WebSocket transport in:

```text
/etc/asterisk/pjsip.conf
```

Example:

```ini
[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0
```

For secure deployments:

```ini
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0
```

Reload:

```bash
asterisk -rx "pjsip reload"
```

---

# Configure WebRTC Extension

Example endpoint configuration:

```ini
[1001]
type=endpoint
transport=transport-ws
context=from-internal
disallow=all
allow=opus,ulaw,alaw
aors=1001
auth=1001
webrtc=yes

[1001]
type=auth
auth_type=userpass
username=1001
password=secret123

[1001]
type=aor
max_contacts=5
```

Reload:

```bash
asterisk -rx "pjsip reload"
```

---

# Browser Features

The SIP.js client provides:

### Registration

Users can register a SIP extension directly from a browser.

Example:

```text
Extension: 1001
Password: secret123
```

After registration:

```text
Registered
```

is displayed.

---

### Outbound Calling

Users enter a destination extension and initiate a SIP call.

Example:

```text
1002
```

The browser sends:

```text
INVITE
```

to Asterisk through WebSocket.

---

### Inbound Calling

When another extension calls the browser endpoint:

```text
1001
```

the browser receives an incoming INVITE.

The user may:

```text
Accept
Reject
```

the call.

---

### Remote Audio Playback

After call establishment:

```text
Session Established
```

remote media tracks are attached to a browser audio element.

The browser automatically begins audio playback.

---

### Call Termination

Users can terminate calls using:

```text
BYE
```

for active calls.

Or:

```text
CANCEL
```

for calls still in progress.

---

# Browser Permissions

The browser must be allowed to access:

```text
Microphone
```

When prompted:

```text
Allow Microphone Access
```

select:

```text
Allow
```

Without microphone access, outbound audio will not function.

---

# Supported Browsers

Recommended:

* Google Chrome
* Microsoft Edge
* Firefox
* Brave

Safari may require additional WebRTC configuration.

---

# Testing

## Verify Registration

Asterisk CLI:

```bash
pjsip show contacts
```

Expected:

```text
1001/sip:...
Avail
```

---

## Verify Endpoint

```bash
pjsip show endpoint 1001
```

Expected:

```text
Contact:
Transport:
Auth:
```

information should be displayed.

---

## Make a Test Call

Register:

```text
1001
```

Call:

```text
1002
```

Verify:

* Ringing occurs
* Call is answered
* Two-way audio is available

---

## Receive a Test Call

Call:

```text
1001
```

from another SIP device.

Verify:

* Browser receives call notification
* Call can be accepted
* Audio is established

---

# Troubleshooting

## Registration Fails

Verify:

```bash
pjsip set logger on
```

Check:

```text
401 Unauthorized
403 Forbidden
```

messages.

Verify:

* Username
* Password
* Endpoint configuration

---

## WebSocket Connection Fails

Verify:

```bash
http show status
```

Expected:

```text
HTTP Server Status:
Enabled
```

Check:

```bash
netstat -lntp | grep 8088
```

or:

```bash
ss -lntp | grep 8088
```

---

## No Audio

Verify:

* Browser microphone permissions
* RTP ports are open
* WebRTC is enabled
* Codec negotiation succeeds

Check:

```bash
rtp set debug on
```

for RTP traffic.

---

## One-Way Audio

Common causes:

* NAT issues
* Firewall restrictions
* Incorrect external media address
* ICE configuration problems

Verify:

```ini
external_media_address=
external_signaling_address=
```

when operating behind NAT.

---

## Browser Blocks Audio

Modern browsers may require user interaction before playing audio.

Ensure:

* The page is interacted with.
* Audio autoplay restrictions are satisfied.

---

# Security Recommendations

For production deployments:

Use:

```text
WSS
```

instead of:

```text
WS
```

Install TLS certificates and configure:

```ini
transport-wss
```

to encrypt SIP signaling.

Recommended:

* TLS
* SRTP
* Strong SIP passwords
* Firewall restrictions
* Fail2Ban protection

---

# Production Architecture

```text
Browser
   │
   ▼
WebSocket Secure (WSS)
   │
   ▼
Asterisk
   │
   ▼
PJSIP Endpoints
   │
   ▼
SIP Trunks
```

Optional integrations:

* Call recording
* Whisper transcription
* OpenAI Realtime API
* AI voice assistants
* CRM integration
* Call analytics

---

# Summary

Using SIP.js with Asterisk WebRTC allows a web browser to function as a full SIP softphone. Users can register SIP extensions, place and receive calls, and exchange audio using WebRTC without installing any desktop software. Asterisk handles SIP signaling and media routing while the browser provides the user interface and audio devices.
