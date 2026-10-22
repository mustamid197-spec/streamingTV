/**
 * KusoTV Configuration
 */
(function() {
    'use strict';

    const currentHost = (typeof window !== 'undefined' && window.location) ? window.location.hostname : 'localhost';

    const config = {
        ASSET_ORIGIN: "https://kltraid.pages.dev",
        PLAYER_ORIGIN: window.location.origin ? window.location.origin : '.',
        PLAYER_ORIGINS: [
            "https://kltra-stream.elutuna.workers.dev",
            "https://playerkltra.pages.dev",
            "https://playkltratv.elutuna.workers.dev",
            window.location.origin || "http://localhost:3000"
        ],
        API_ORIGIN: "https://kltratv-web.pages.dev",
        FEED_MATERIAL_V2: "KLTRATV_LIVE_WEB_KEY_jv5pyp88NCZVDHMg0N0RDBBQnowgXEkCW5yuW_k4LPaOCZxPPfl1Gg0ufwM5JHum62hpAGFKF1hb5ASaFMZ1yTmSw8bsPaEHKdnkfD11JKbm91WEuUnISzJS6WINDMej2tyIcTm5CISyixqYlvMEaT7A3DHodtFMuyzQbebPuNFYJjEMFqoNN9icCeWKnw2KpXnVjBBZkWMU6fMZ7o0mx0YD365qUadl6cS1wfAlwS2P1c6N2CpvONJ_Ncg2P6i5OUedB0oXCxFI68G7svWMvkzJtxryAuUcDjmiJP0mhT1GZugLUccOkmsZoB5n1mV2uJ60cpVQkm9U_pU5wsaHAD6zTkKgKzvmox60YIKYDjHRec0kGmsqt46tvQFP0TiFVeOAdEdkzOiEHqBntfWT8ogiYbvJn9OP3pgg9U9FpT_jctAhM1hkXA9YpIEZ5gt0m60HMZx6JwK7TC0BNGsOIIGhfjemJI6ryqwZnvsiAcG2sjLXUn7KTeFD6FHWkmvqEeDsHyW2NhKciyQMMkBV_Y5Fehbc7KgjRvjCeLIeBUrAAdvA4ENlpyCn08rKsG9iUAhDCPhBBhyBMyuhthfODos9Czn0g6Zbk9DEj1Q_0t80NPSEwrr6zk4CkqRb_FAVZHvt1RpJd7bVK4hdew046dvX4FnHinH_NSkFoNHRii8WYmqmcsCkg5BC9vHZ95sq_dzWg4hZ8VFXlEk5NrKSzf0ApwpqHH8t3pAH9yXYZpZUmEBa32fvcJRsJ3JbW8QngrcQddeYHfkaf4TQGosJ1_VNCUWtZuxr4StltSsbN4QuolXbrD3ea4eaWpBWRF1PJ3x3Of76zCzZHbFB1rqrBuninkEMobWQOE79nCgX5mo8ElGjVvADKjf6wVII9zvi5XuVo6UgCURRlSXO3WQ2s9aWL2ozOv7hV0mog9AHMPrbUXoWJk7BiTQxTKz8Osg4HqYVhUcdb3vVhE1d_3u",
        CATALOG_PATHS: {
            EVENTS: "/bro/f-82c6a419.json",
            SERVERS: "/bro/f-b4d9037e.json",
            LIVE_TV: "/bro/f-1e7a5c92.json",
            HD_AUTO: "/bro/f-60d8f3ab.json"
        },
        LOCAL_PATHS: {
            EVENTS: "./data/events.json",
            SERVERS: "./data/servers.json",
            LIVE_TV: "./data/channels.json",
            HD_AUTO: "./data/usop.json"
        },
        HOME_ORIGIN: [
            window.location.origin || "http://localhost:3000"
        ],
        BLOG_ORIGIN: [
            "https://kltratv13.blogspot.com",
            "https://gratisbro45.blogspot.com",
            currentHost
        ],
        ADS: {
            ENABLED: false,
            PLAYER_PAGES_ONLY: false,
            POPUNDER_ENABLED: false,
            POPUNDER_URL: "",
            PLAYER_GATE: {
                ENABLED: false,
                URL: "",
                SESSION_KEY: ""
            }
        },
        ALLOWED_HOSTS: [
            currentHost,
            "localhost",
            "127.0.0.1",
            "kltraid.pages.dev",
            "kltra-stream.elutuna.workers.dev",
            "playerkltra.pages.dev",
            "playkltratv.elutuna.workers.dev",
            "kltramy.pages.dev",
            "kltratv13.blogspot.com",
            "gratisbro45.blogspot.com"
        ]
    };

    window.KLTRA_CONFIG = Object.freeze(config);
})();
