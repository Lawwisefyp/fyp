const net = require('net');
const dns = require('dns').promises;

async function checkSmtp(email) {
    const domain = email.split('@')[1];
    try {
        console.log(`Checking MX for ${domain}...`);
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) return { success: false, error: 'No MX' };

        const host = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;
        console.log(`Connecting to ${host}...`);

        return new Promise((resolve) => {
            const socket = net.createConnection(25, host);
            let step = 0;

            socket.setTimeout(10000);

            socket.on('data', (data) => {
                const response = data.toString();
                console.log(`S: ${response.trim()}`);

                if (response.startsWith('220') && step === 0) {
                    socket.write('HELO lawwise-verification.com\r\n');
                    console.log('C: HELO lawwise-verification.com');
                    step = 1;
                } else if (response.startsWith('250') && step === 1) {
                    socket.write('MAIL FROM:<verify@lawwise.com>\r\n');
                    console.log('C: MAIL FROM:<verify@lawwise.com>');
                    step = 2;
                } else if (response.startsWith('250') && step === 2) {
                    socket.write(`RCPT TO:<${email}>\r\n`);
                    console.log(`C: RCPT TO:<${email}>`);
                    step = 3;
                } else if (step === 3) {
                    if (response.startsWith('250')) {
                        console.log('--- Address likely exists! ---');
                        resolve({ success: true });
                    } else if (response.startsWith('550')) {
                        console.log('--- Address definitively does not exist! ---');
                        resolve({ success: false, error: 'User unknown' });
                    } else {
                        console.log(`--- Ambiguous response: ${response.trim()} ---`);
                        resolve({ success: true, ambiguous: true });
                    }
                    socket.write('QUIT\r\n');
                    socket.end();
                }
            });

            socket.on('error', (err) => {
                console.log(`Socket error: ${err.message}`);
                resolve({ success: true, error: err.message, ambiguous: true });
            });

            socket.on('timeout', () => {
                console.log('Socket timeout');
                socket.destroy();
                resolve({ success: true, error: 'timeout', ambiguous: true });
            });
        });
    } catch (err) {
        return { success: true, error: err.message, ambiguous: true };
    }
}

async function run() {
    console.log('--- Testing SMTP Check ---');
    await checkSmtp('hunnya@gmail.com');
    console.log('--- Done ---');
}

run();
