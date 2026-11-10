const fs = require('fs');
const path = require('path');

const VERIFIED_FTA_CHANNELS = {
    "SPORTITALIA": {
        "url": "https://amg01370-italiansportcom-sportitalia-rakuten-3hmdb.amagi.tv/hls/amagi_hls_data_rakutenAA-sportitalia-rakuten/CDN/master.m3u8"
    },
    "CBS SPORTS HQ": {
        "url": "https://dai.google.com/linear/hls/event/Sid4xiTQTkCT1SLu6rjUSQ/master.m3u8"
    },
    "TVRI SPORT HD": {
        "url": "https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD.m3u8"
    },
    "A MOJI": {
        "url": "https://op-flashcon-digdayahd-1.dens.tv/h/h207/index.m3u8"
    },
    "MOJI TV HD": {
        "url": "https://op-flashcon-digdayahd-1.dens.tv/h/h207/index.m3u8"
    },
    "REAL MADRID TV": {
        "url": "https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8"
    },
    "REAL MADRID TV2": {
        "url": "https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8"
    },
    "RED BULL TV": {
        "url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"
    },
    "RED BULL 1080P": {
        "url": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_6660.m3u8"
    },
    "FUSBALL 2": {
        "url": "https://sdn-global-live-streaming-packager-cache.3qsdn.com/77693/77693_264_live.m3u8"
    },
    "OMAN SPORTS": {
        "url": "https://partneta.cdn.mgmlcdn.com/omsport/smil:omsport.stream.smil/chunklist.m3u8"
    },
    "KTV": {
        "url": "https://kwtspta.cdn.mangomolo.com/sp/smil:sp.stream.smil/index.m3u8"
    }
};

const MAJOR_LEAGUES = [
    { slug: 'idn.1', key: 'Indo', name: 'BRI Liga 1 Indonesia', max: 6 },
    { slug: 'eng.1', key: 'Inggris', name: 'Liga Inggris (Premier League)', max: 9 },
    { slug: 'ita.1', key: 'Italia', name: 'Liga Italia (Serie A)', max: 9 },
    { slug: 'fra.1', key: 'Perancis', name: 'Liga Perancis (Ligue 1)', max: 6 },
    { slug: 'esp.1', key: 'Spanyol', name: 'Liga Spanyol (LaLiga)', max: 9 },
    { slug: 'ned.1', key: 'Belanda', name: 'Liga Belanda (Eredivisie)', max: 6 },
    { slug: 'por.1', key: 'Portugal', name: 'Liga Portugal (Primeira Liga)', max: 6 },
    { slug: 'ger.1', key: 'Jerman', name: 'Liga Jerman (Bundesliga)', max: 6 },
    { slug: 'uefa.champions', key: 'UCL', name: 'Liga Champions (UCL)', max: 9 },
    { slug: 'eng.2', key: 'Championship', name: 'Championship League (EFL)', max: 6 },
    { slug: 'uefa.europa', key: 'Championship', name: 'UEFA Europa League', max: 6 },
    { slug: 'uefa.europa.conf', key: 'Konferensi', name: 'UEFA Conference League', max: 6 },
    { slug: 'aff.championship', key: 'AFF', name: 'AFF ASEAN Championship', max: 6 }
];

async function sync() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('Fetching major football leagues schedule from ESPN Scoreboard API...');

    const responses = await Promise.all(
        MAJOR_LEAGUES.map(lg =>
            fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg.slug}/scoreboard`)
                .then(r => r.json())
                .catch(() => ({ events: [] }))
        )
    );

    const events = [];

    MAJOR_LEAGUES.forEach((lg, idx) => {
        const list = (responses[idx] && responses[idx].events) || [];
        list.slice(0, lg.max).forEach(ev => {
            const comp = ev.competitions && ev.competitions[0];
            const competitors = (comp && comp.competitors) || [];
            const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
            const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};
            const dt = new Date(ev.date || Date.now());
            const dateStr = dt.toISOString().slice(0, 10);
            const timeStr = dt.toTimeString().slice(0, 5);
            events.push({
                id: `espn-${ev.id}`,
                duration: 2,
                league: lg.name,
                leagueKey: lg.key,
                team1: {
                    name: home.team?.shortDisplayName || home.team?.name || 'Team 1',
                    logo: home.team?.logo || 'images/sportsicon/Soccer.png'
                },
                team2: {
                    name: away.team?.shortDisplayName || away.team?.name || 'Team 2',
                    logo: away.team?.logo || 'images/sportsicon/Soccer.png'
                },
                kickoff_date: dateStr,
                kickoff_time: timeStr,
                match_date: dateStr,
                match_time: timeStr
            });
        });
    });

    let existingUsop = {};
    const usopPath = path.join(dataDir, 'usop.json');
    if (fs.existsSync(usopPath)) {
        try {
            existingUsop = JSON.parse(fs.readFileSync(usopPath, 'utf8'));
        } catch (_) {}
    }
    const mergedUsop = Object.assign({}, existingUsop, VERIFIED_FTA_CHANNELS);

    fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify(events, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'luffy.json'), JSON.stringify(events, null, 2), 'utf8');
    fs.writeFileSync(usopPath, JSON.stringify(mergedUsop, null, 2), 'utf8');

    console.log('Successfully updated local fallback data/:');
    console.log(' - events.json:', events.length, 'major league matches');
    console.log(' - usop.json:', Object.keys(mergedUsop).length, 'channels');
}

sync().catch(console.error);
