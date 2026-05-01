const localtunnel = require('localtunnel');
const https = require('https');

const SUBDOMAIN = 'undead-server';

function checkTunnel(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 5000);
    https.get(url, (res) => { clearTimeout(timeout); resolve(true); })
      .on('error', () => { clearTimeout(timeout); resolve(false); });
  });
}

async function start() {
  while (true) {
    let tunnel;
    try {
      tunnel = await localtunnel({ port: 3000, subdomain: SUBDOMAIN });

      // Error-Handler SOFORT registrieren, bevor irgendwas anderes passiert
      let dead = false;
      let resolveWait;
      const waitPromise = new Promise((r) => { resolveWait = r; });

      const die = (reason) => {
        if (!dead) {
          dead = true;
          console.log(reason);
          resolveWait();
        }
      };

      tunnel.on('close', () => die('Tunnel closed'));
      tunnel.on('error', (err) => die(`Tunnel error: ${err.message}`));

      if (!tunnel.url.includes(SUBDOMAIN)) {
        console.log(`Wrong subdomain: ${tunnel.url} - retrying...`);
        tunnel.close();
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.log(`Connected: ${tunnel.url}`);

      // Heartbeat alle 10s
      const heartbeat = setInterval(async () => {
        if (dead) return;
        const alive = await checkTunnel(tunnel.url);
        if (!alive && !dead) die('Tunnel not responding');
      }, 10000);

      await waitPromise;
      clearInterval(heartbeat);
      try { tunnel.close(); } catch (_) {}
      console.log('Restarting...');
    } catch (e) {
      console.log(`Error: ${e.message} - retrying...`);
      try { tunnel?.close(); } catch (_) {}
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

start();
