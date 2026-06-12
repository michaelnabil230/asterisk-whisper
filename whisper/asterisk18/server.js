const ari = require('ari-client');

const ASTERISK_URL = 'http://127.0.0.1:8088';
const USERNAME = 'node';
const PASSWORD = 'secret123';

ari.connect(
    ASTERISK_URL,
    USERNAME,
    PASSWORD,
    async (err, client) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        client.on('StasisStart', async (event, channel) => {
            try {

                console.log(
                    'StasisStart:',
                    channel.id,
                    channel.name
                );

                // Ignore ExternalMedia channels
                if (
                    channel.name &&
                    channel.name.startsWith('UnicastRTP/')
                ) {
                    console.log(
                        'Ignoring ExternalMedia channel:',
                        channel.id
                    );
                    return;
                }

                const bridge = await client.bridges.create({
                    type: 'mixing'
                });

                await bridge.addChannel({
                    channel: channel.id
                });

                const extMedia =
                    await client.channels.externalMedia({
                        app: 'whisper-app',
                        external_host: '100.122.218.38:4000',
                        format: 'ulaw'
                    });

                await bridge.addChannel({
                    channel: extMedia.id
                });

                console.log(
                    'ExternalMedia Created:',
                    extMedia.id
                );

            } catch (err) {
                console.error(err);
            }
        });

        client.start('whisper-app');

        console.log('ARI Connected');
    }
);