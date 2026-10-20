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
        FEED_MATERIAL_V2: "KLTRATV_WEBSTREAM_KEY_fBAot5pTmCjRk5Jxr5d373ZUX2vp6bopSi5hFRCLcYPwd1kNYsD8CtY6iJ8ZAH9644080qDtHHnC94p26mh1WOKsyPg7vM9K8lRavVtzAbxVfukrHzSlGWhyCaGrzApzxXUGdOLIjNm10iwYKtb89ASvKD74ry4eKUxMHbGmN9NzOlTjBIanSfclCaF2WopHJ6_QhCr_twTWTZrEmUbWomAyedMuJqf4RBCnzH1QVKzrO1gTZukfWD7iEGpAL2k8Hjg_Ntw0JcdyeT_NWH3o0KZpEKUajU6NSByzRITJRGTa53KQCAvei_d1ekWefIbHOgeGMAl0gG0Y574OIxRbKDFplMxYj7eOndp3IBfqDpHoqkP3e5ulAjsGO9aeXbRlvRFaXr5HUmw_l2JYcOmp5QyOdBHkW7_UnI08I1Nnxww3lghy4Q3WhXFILZeGwUapgytJ8VFwixuh5nhY4edWSrNNu02rFG7rPdlxhYuMv6QnEyARcvavkQi_Nz2OLC73hmRsAozhNer1cCrAt0HnSkTY3_QrYC6p5xcU2hbHGBzwnapjhLQ4Pm3udlthzOyDd2jdWap1rDXZPjsM_wnWWIoIXPsEgU62pHRW9z47kkJ5YMLvGjROKPqj9KcqoGMdyT061fXgs6LrWe0GcX3O_SH2yWjhTwERdI_eEEQ4B5t6eSvCdTuZ_pJ429BjMZGN1Kw3MSx2MFbFPWWC4p4SljlNwT9U5gD6OOm8dw8AnskQp7EUNiTxIdlHIjhwvF5rgNHcuTJI46RSU4vWXXPnOsC3rIFrcNIrfvZRN53h7i_Y45ODJtYk3lYFzrDE3ttyMEyKycnfxFLqz3WwXa2SLO2b0oZTD5AhES7mVeCf3aG2dXHfwLAaUrXM0GwcH0JvN7E2GOOuXTE1S0tLMSRW8GGKnICQTVRNv4JnGqPuACjVGkSTT2RClJFBEQVrEd3eE1kKt5ixZI81E_ivVY",
        CATALOG_PATHS: {
            EVENTS: "/bro/luffy.json",
            SERVERS: "/bro/zoro.json",
            LIVE_TV: "/bro/sanji.json",
            HD_AUTO: "/bro/usop.json"
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
