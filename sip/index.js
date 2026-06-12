import {
    UserAgent,
    Registerer,
    Inviter,
    SessionState
} from "sip.js";

let userAgent;
let registerer;
let session;

const SERVER = "10.10.10.30";
const WSS_URL = "ws://10.10.10.30:8088/ws";

const status = document.getElementById("status");

// Create audio element for remote audio
const remoteAudio = document.createElement("audio");
remoteAudio.autoplay = true;
remoteAudio.controls = true;
document.body.appendChild(remoteAudio);

function setupRemoteAudio(session) {
    const sdh = session.sessionDescriptionHandler;

    if (!sdh || !sdh.peerConnection) {
        console.error("No PeerConnection found");
        return;
    }

    const pc = sdh.peerConnection;

    const remoteStream = new MediaStream();

    pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
            remoteStream.addTrack(receiver.track);
        }
    });

    remoteAudio.srcObject = remoteStream;

    remoteAudio.play().catch((err) => {
        console.error("Audio playback failed:", err);
    });

    console.log("Remote audio attached");
}

document.getElementById("loginBtn").addEventListener("click", async () => {

    const extension = document.getElementById("extension").value.trim();
    const password = document.getElementById("password").value.trim();

    try {

        userAgent = new UserAgent({
            uri: UserAgent.makeURI(`sip:${extension}@${SERVER}`),

            transportOptions: {
                server: WSS_URL
            },

            authorizationUsername: extension,
            authorizationPassword: password,

            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
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

                await invitation.accept();

                session = invitation;

                session.stateChange.addListener((state) => {

                    console.log("Incoming Call State:", state);

                    switch (state) {

                        case SessionState.Establishing:
                            status.innerText = "Connecting...";
                            break;

                        case SessionState.Established:
                            status.innerText = "Call Connected";

                            setTimeout(() => {
                                setupRemoteAudio(session);
                            }, 1000);

                            break;

                        case SessionState.Terminated:
                            status.innerText = "Call Ended";
                            session = null;
                            break;
                    }
                });
            }
        };

        await userAgent.start();

        registerer = new Registerer(userAgent);

        await registerer.register();

        status.innerText = "Registered";

        console.log("Registered Successfully");

    } catch (error) {

        console.error(error);

        status.innerText = "Registration Failed";
    }
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

        session = new Inviter(userAgent, targetURI, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
        });

        session.stateChange.addListener((state) => {

            console.log("Outgoing Call State:", state);

            switch (state) {

                case SessionState.Initial:
                    break;

                case SessionState.Establishing:
                    status.innerText = "Calling...";
                    break;

                case SessionState.Established:

                    status.innerText = "Call Connected";

                    setTimeout(() => {
                        setupRemoteAudio(session);
                    }, 1000);

                    break;

                case SessionState.Terminated:

                    status.innerText = "Call Ended";

                    session = null;

                    break;
            }
        });

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