const https = require('https');

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

async function run() {
    const hdRaw = await fetch('https://kltratv-web.pages.dev/bro/f-60d8f3ab.json');
    const hd = decode(hdRaw);
    
    console.log('NBA match:', hd['philadelphia-76ers-vs-cleveland-cavaliers-cf4ff7a84dcb4e6ca233e48ce328732a']);
    console.log('TNT 2:', hd['TNT 2']);
    console.log('BEIN 1 AU:', hd['BEIN 1 AU']);
    console.log('SPOTV 1 PH:', hd['SPOTV 1 PH']);
    console.log('A RCTI:', hd['A RCTI']);
    console.log('A TRANS 7:', hd['A TRANS 7']);
}

run().catch(console.error);
