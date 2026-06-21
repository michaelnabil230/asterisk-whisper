import {
    UserAgent,
    Registerer,
    Inviter,
    SessionState
} from "sip.js";

let userAgent;
let registerer;
let session;

window.sendDTMF = sendDTMF;
function sendDTMF(digits) {

    if (!session) {
        return;
    }

    if (session.state !== SessionState.Established) {
        return;
    }

    const sdh = session.sessionDescriptionHandler;

    if (!sdh || typeof sdh.sendDtmf !== "function") {
        console.error("DTMF not supported by this session");
        return;
    }

    const sent = sdh.sendDtmf(digits, {
        duration: 200,
        interToneGap: 100
    });

    if (!sent) {
        console.error("Failed to send DTMF");
    }
}

const SERVER = "localhost";
const WSS_URL = "wss://localhost:8089/ws";

const status = document.getElementById("status");

const remoteAudio = document.createElement("audio");
remoteAudio.autoplay = true;
remoteAudio.controls = true;
remoteAudio.muted = false;
remoteAudio.volume = 1;

document.body.appendChild(remoteAudio);

async function requestMicrophone() {
    return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    });
}

function attachRemoteAudio(session) {
    const sdh = session.sessionDescriptionHandler;

    if (!sdh) {
        console.error("No SessionDescriptionHandler");
        return;
    }

    const pc = sdh.peerConnection;

    if (!pc) {
        console.error("No PeerConnection");
        return;
    }

    const remoteStream = new MediaStream();

    pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
            remoteStream.addTrack(receiver.track);
        }
    });

    remoteAudio.srcObject = remoteStream;

    remoteAudio.play()
        .then(() => {
            console.log("Remote audio playing");
        })
        .catch(console.error);

    console.log("Audio tracks:", remoteStream.getAudioTracks());
}

function bindSessionEvents(currentSession) {

    currentSession.stateChange.addListener((state) => {

        console.log("Session State:", state);

        switch (state) {

            case SessionState.Establishing:

                status.innerText = "Connecting...";

                break;

            case SessionState.Established:

                status.innerText = "Call Connected";

                setTimeout(() => {
                    attachRemoteAudio(currentSession);
                }, 500);

                break;

            case SessionState.Terminated:

                status.innerText = "Call Ended";

                remoteAudio.srcObject = null;

                session = null;

                break;
        }
    });
}

document.getElementById("loginBtn").addEventListener("click", async () => {

    const extension = document.getElementById("extension").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        await requestMicrophone();

        userAgent = new UserAgent({
            uri: UserAgent.makeURI(`sip:${extension}@${SERVER}`),

            transportOptions: {
                server: WSS_URL
            },

            authorizationUsername: extension,
            authorizationPassword: password,
        });

        userAgent.delegate = {
            onInvite: async (invitation) => {

                const answer = confirm(
                    `Incoming call from ${invitation.remoteIdentity.uri.user}`
                );

                if (!answer) {
                    await invitation.reject();
                    return;
                }

                session = invitation;

                bindSessionEvents(session);

                await invitation.accept();
            }
        };

        await userAgent.start();

        registerer = new Registerer(userAgent);

        await registerer.register();

        status.innerText = "Registered";

        console.log("Registered");
    } catch (error) {

        console.error(error);

        status.innerText = "Registration Failed";
    }
});

document.getElementById("login1001Btn").addEventListener("click", () => {
    document.getElementById("extension").value = "1001";
    document.getElementById("password").value = "Password1001";
    document.getElementById("target").value = "1002";
    document.getElementById("loginBtn").click();
});

document.getElementById("login1002Btn").addEventListener("click", () => {
    document.getElementById("extension").value = "1002";
    document.getElementById("password").value = "Password1002";
    document.getElementById("target").value = "1001";
    document.getElementById("loginBtn").click();
});

document.getElementById("callBtn").addEventListener("click", async () => {

    const target = document.getElementById("target").value.trim();

    if (!target) {
        alert("Enter target extension");
        return;
    }

    try {

        const targetURI = UserAgent.makeURI(
            `sip:${target}@${SERVER}`
        );

        session = new Inviter(userAgent, targetURI);

        bindSessionEvents(session);

        await session.invite();

    } catch (error) {

        console.error(error);

        status.innerText = "Call Failed";
    }
});

document.getElementById("hangupBtn")?.addEventListener("click", async () => {

    if (!session) {
        return;
    }

    try {

        if (session.state === SessionState.Established) {
            await session.bye();
        } else {
            await session.cancel();
        }

    } catch (error) {

        console.error(error);
    }
});
