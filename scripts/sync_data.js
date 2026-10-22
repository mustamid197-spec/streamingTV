const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

const key = 'KLTRATV_LIVE_WEB_KEY_jv5pyp88NCZVDHMg0N0RDBBQnowgXEkCW5yuW_k4LPaOCZxPPfl1Gg0ufwM5JHum62hpAGFKF1hb5ASaFMZ1yTmSw8bsPaEHKdnkfD11JKbm91WEuUnISzJS6WINDMej2tyIcTm5CISyixqYlvMEaT7A3DHodtFMuyzQbebPuNFYJjEMFqoNN9icCeWKnw2KpXnVjBBZkWMU6fMZ7o0mx0YD365qUadl6cS1wfAlwS2P1c6N2CpvONJ_Ncg2P6i5OUedB0oXCxFI68G7svWMvkzJtxryAuUcDjmiJP0mhT1GZugLUccOkmsZoB5n1mV2uJ60cpVQkm9U_pU5wsaHAD6zTkKgKzvmox60YIKYDjHRec0kGmsqt46tvQFP0TiFVeOAdEdkzOiEHqBntfWT8ogiYbvJn9OP3pgg9U9FpT_jctAhM1hkXA9YpIEZ5gt0m60HMZx6JwK7TC0BNGsOIIGhfjemJI6ryqwZnvsiAcG2sjLXUn7KTeFD6FHWkmvqEeDsHyW2NhKciyQMMkBV_Y5Fehbc7KgjRvjCeLIeBUrAAdvA4ENlpyCn08rKsG9iUAhDCPhBBhyBMyuhthfODos9Czn0g6Zbk9DEj1Q_0t80NPSEwrr6zk4CkqRb_FAVZHvt1RpJd7bVK4hdew046dvX4FnHinH_NSkFoNHRii8WYmqmcsCkg5BC9vHZ95sq_dzWg4hZ8VFXlEk5NrKSzf0ApwpqHH8t3pAH9yXYZpZUmEBa32fvcJRsJ3JbW8QngrcQddeYHfkaf4TQGosJ1_VNCUWtZuxr4StltSsbN4QuolXbrD3ea4eaWpBWRF1PJ3x3Of76zCzZHbFB1rqrBuninkEMobWQOE79nCgX5mo8ElGjVvADKjf6wVII9zvi5XuVo6UgCURRlSXO3WQ2s9aWL2ozOv7hV0mog9AHMPrbUXoWJk7BiTQxTKz8Osg4HqYVhUcdb3vVhE1d_3u';

function decode(raw) {
    const binaryStr = Buffer.from(raw.trim(), 'base64');
    const keyBytes = Buffer.from(key);
    const out = Buffer.alloc(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        out[i] = binaryStr[i] ^ keyBytes[i % keyBytes.length];
    }
    return JSON.parse(out.toString('utf8'));
}

async function sync() {
    const apiOrigin = 'https://kltratv-web.pages.dev';
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('Fetching live updated data from kltratv-web.pages.dev...');

    const [eventsRaw, serversRaw, channelsRaw, usopRaw] = await Promise.all([
        fetch(`${apiOrigin}/bro/f-82c6a419.json`),
        fetch(`${apiOrigin}/bro/f-b4d9037e.json`),
        fetch(`${apiOrigin}/bro/f-1e7a5c92.json`),
        fetch(`${apiOrigin}/bro/f-60d8f3ab.json`)
    ]);

    const events = decode(eventsRaw);
    const servers = decode(serversRaw);
    const channels = decode(channelsRaw);
    const usop = decode(usopRaw);

    // Save formatted JSON locally
    fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify(events, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'servers.json'), JSON.stringify(servers, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'channels.json'), JSON.stringify(channels, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'usop.json'), JSON.stringify(usop, null, 2), 'utf8');

    // Also update legacy names so any fallback works
    fs.writeFileSync(path.join(dataDir, 'luffy.json'), JSON.stringify(events, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'zoro.json'), JSON.stringify(servers, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'sanji.json'), JSON.stringify(channels, null, 2), 'utf8');

    console.log('Successfully saved to data/:');
    console.log(' - events.json:', events.length, 'items');
    console.log(' - servers.json:', servers.length, 'items');
    console.log(' - channels.json:', channels.length, 'items');
    console.log(' - usop.json:', Object.keys(usop).length, 'channels');
}

sync().catch(console.error);
