/**
 * KusoTV - Modern Dynamic Sports Portal Application Logic
 * Real-Time Schedules via ESPN Public Scoreboard API & TheSportsDB API
 * Multi-Server Live FTA/FAST HLS Sports Streaming & Auto-Refresh
 */

(function () {
    'use strict';

    // State
    let allMatches = [];
    let currentTab = 'today'; // 'today', 'tomorrow', 'yesterday', 'all'
    let currentCategory = 'live'; // 'all', 'live', 'hot', 'Soccer', 'Basketball', 'Badminton', 'Baseball', 'Tennis', 'Racing'
    let currentPlayingMatch = null;
    let currentPlayingServerUrl = null;
    let refreshTimer = null;

    // Multi-Server Pools by Sport Category (All verified HTTP 200 OK & CORS: *)
    const SPORT_SERVER_POOLS = {
        Soccer: [
            { label: 'Server 1 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' },
            { label: 'Server 2 (Fussball TV HD)', url: 'player.html?channel=FUSBALL%202' },
            { label: 'Server 3 (Moji Sport HD)', url: 'player.html?channel=A%20MOJI' },
            { label: 'Server 4 (Real Madrid TV)', url: 'player.html?channel=REAL%20MADRID%20TV' },
            { label: 'Server 5 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'Server 6 (Oman Sports HD)', url: 'player.html?channel=OMAN%20SPORTS' }
        ],
        Basketball: [
            { label: 'Server 1 (CBS Sports HQ)', url: 'player.html?channel=CBS%20SPORTS%20HQ' },
            { label: 'Server 2 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'Server 3 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' },
            { label: 'Server 4 (KTV Sports HD)', url: 'player.html?channel=KTV' },
            { label: 'Server 5 (Red Bull TV HD)', url: 'player.html?channel=RED%20BULL%20TV' }
        ],
        Badminton: [
            { label: 'COURT 1 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'COURT 2 (Moji TV HD)', url: 'player.html?channel=A%20MOJI' },
            { label: 'COURT 3 (KTV Sports HD)', url: 'player.html?channel=KTV' },
            { label: 'COURT 4 (Oman Sports HD)', url: 'player.html?channel=OMAN%20SPORTS' }
        ],
        Racing: [
            { label: 'Server 1 (Red Bull 1080p)', url: 'player.html?channel=RED%20BULL%201080P' },
            { label: 'Server 2 (Red Bull Auto)', url: 'player.html?channel=RED%20BULL%20TV' },
            { label: 'Server 3 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'Server 4 (CBS Sports HQ)', url: 'player.html?channel=CBS%20SPORTS%20HQ' }
        ],
        Tennis: [
            { label: 'Server 1 (CBS Sports HQ)', url: 'player.html?channel=CBS%20SPORTS%20HQ' },
            { label: 'Server 2 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'Server 3 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' },
            { label: 'Server 4 (Oman Sports HD)', url: 'player.html?channel=OMAN%20SPORTS' }
        ],
        Baseball: [
            { label: 'Server 1 (CBS Sports HQ)', url: 'player.html?channel=CBS%20SPORTS%20HQ' },
            { label: 'Server 2 (Red Bull TV HD)', url: 'player.html?channel=RED%20BULL%20TV' },
            { label: 'Server 3 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
            { label: 'Server 4 (KTV Sports HD)', url: 'player.html?channel=KTV' }
        ]
    };

    function getServersForSport(sport, matchTitle, extraVideoUrl) {
        const basePool = SPORT_SERVER_POOLS[sport] || SPORT_SERVER_POOLS.Soccer;
        const titleParam = matchTitle ? `&name=${encodeURIComponent(matchTitle)}` : '';
        const list = basePool.map(s => ({
            label: s.label,
            url: `${s.url}${titleParam}`
        }));
        if (extraVideoUrl && typeof extraVideoUrl === 'string' && extraVideoUrl.startsWith('http')) {
            list.push({
                label: 'Official Highlight / Stream',
                url: `player.html?url=${encodeURIComponent(extraVideoUrl)}${titleParam}`
            });
        }
        return list;
    }

    // 24/7 Live Sports TV Channels with verified CORS-enabled FTA HLS streams
    const FEATURED_SPORTS_CHANNELS = [
        {
            id: 'tv-sportitalia',
            league: 'SPORTITALIA HD (24/7 Live)',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'SportItalia HD', logo: 'images/sportsicon/Soccer.png' },
            team2: { name: 'Sepak Bola Eropa & Serie A', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Siaran Langsung Sepak Bola Eropa',
            channelName: 'SPORTITALIA',
            channelUrl: 'player.html?channel=SPORTITALIA',
            servers: getServersForSport('Soccer', 'SportItalia HD Live'),
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-cbssports',
            league: 'CBS SPORTS HQ HD (24/7 Live)',
            sport: 'Basketball',
            isHot: true,
            team1: { name: 'CBS Sports HQ', logo: 'images/sportsicon/Basketball.png' },
            team2: { name: 'NBA, UCL & US Sports Live', logo: 'images/sportsicon/Basketball.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'NBA, Champions League & Global Sports',
            channelName: 'CBS SPORTS HQ',
            channelUrl: 'player.html?channel=CBS%20SPORTS%20HQ',
            servers: getServersForSport('Basketball', 'CBS Sports HQ Live'),
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-tvrisport',
            league: 'TVRI SPORT HD (Nasional)',
            sport: 'Badminton',
            isHot: true,
            team1: { name: 'TVRI Sport HD', logo: 'images/sportsicon/Soccer.png' },
            team2: { name: 'BWF Badminton & Olahraga Nasional', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Official BWF & Olahraga Indonesia',
            channelName: 'TVRI SPORT HD',
            channelUrl: 'player.html?channel=TVRI%20SPORT%20HD',
            servers: getServersForSport('Badminton', 'TVRI Sport HD Live'),
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-moji',
            league: 'MOJI TV SPORT HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'MOJI TV HD', logo: 'images/sportsicon/Soccer.png' },
            team2: { name: 'Liga Inggris FTA, Voli & Olahraga', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Siaran Olahraga Nasional Indonesia',
            channelName: 'A MOJI',
            channelUrl: 'player.html?channel=A%20MOJI',
            servers: [
                { label: 'Server 1 (Moji TV HD)', url: 'player.html?channel=A%20MOJI' },
                { label: 'Server 2 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
                { label: 'Server 3 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' }
            ],
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-realmadrid',
            league: 'REAL MADRID TV HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'Real Madrid TV', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png' },
            team2: { name: 'LaLiga & Champions League', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Official Real Madrid Broadcast (EN/ES)',
            channelName: 'REAL MADRID TV',
            channelUrl: 'player.html?channel=REAL%20MADRID%20TV',
            servers: [
                { label: 'Server 1 (English HD)', url: 'player.html?channel=REAL%20MADRID%20TV' },
                { label: 'Server 2 (Español HD)', url: 'player.html?channel=REAL%20MADRID%20TV2' },
                { label: 'Server 3 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' }
            ],
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-redbull',
            league: 'RED BULL TV MOTORSPORT HD',
            sport: 'Racing',
            isHot: true,
            team1: { name: 'Red Bull TV HD', logo: 'images/sportsicon/Soccer.png' },
            team2: { name: 'MotoGP, Rally & Extreme Sports', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'World Motorsport & Racing 1080p',
            channelName: 'RED BULL 1080P',
            channelUrl: 'player.html?channel=RED%20BULL%201080P',
            servers: getServersForSport('Racing', 'Red Bull TV Motorsport'),
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-fussball',
            league: 'FUSSBALL TV 2 HD',
            sport: 'Soccer',
            isHot: false,
            team1: { name: 'Fussball TV HD', logo: 'images/sportsicon/Soccer.png' },
            team2: { name: 'Liga Eropa & Bundesliga', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'European Football Channel',
            channelName: 'FUSBALL 2',
            channelUrl: 'player.html?channel=FUSBALL%202',
            servers: [
                { label: 'Server 1 (Fussball TV)', url: 'player.html?channel=FUSBALL%202' },
                { label: 'Server 2 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' },
                { label: 'Server 3 (Oman Sports HD)', url: 'player.html?channel=OMAN%20SPORTS' }
            ],
            status: 'live',
            tabCategory: 'today'
        }
    ];

    // =========================================================
    // 1. Theme Management (Light / Dark)
    // =========================================================
    function initTheme() {
        const savedTheme = localStorage.getItem('kusotv_theme');
        const themeToggle = document.getElementById('theme-toggle');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('kusotv_theme', isDark ? 'dark' : 'light');
    }

    // =========================================================
    // 2. Date Helpers & Dynamic Public API Fetching
    // =========================================================
    function getOffsetDate(daysOffset) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        return d;
    }

    function formatYYYYMMDD(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    }

    function formatYYYY_MM_DD(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatLocalTimeFromDate(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return 'Pukul 20.00';
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        return `Pukul ${hh}.${mm}`;
    }

    async function safeFetchJson(url, timeoutMs = 7000) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            // Silently ignore single endpoint timeout/failure
        }
        return null;
    }

    // Parse ESPN Scoreboard response into our normalized match objects
    function parseEspnEvents(data, sport, defaultLeague, forcedTabCat) {
        if (!data || !Array.isArray(data.events)) return [];
        const leagueNameFromApi = data.leagues && data.leagues[0] && data.leagues[0].name
            ? data.leagues[0].name
            : defaultLeague;

        const todayStr = formatYYYY_MM_DD(getOffsetDate(0));
        const yesterdayStr = formatYYYY_MM_DD(getOffsetDate(-1));
        const tomorrowStr = formatYYYY_MM_DD(getOffsetDate(1));

        const results = [];

        data.events.forEach(ev => {
            const comp = ev.competitions && ev.competitions[0];
            const competitors = (comp && Array.isArray(comp.competitors)) ? comp.competitors : [];

            const defaultLogo = (sport === 'Baseball' || sport === 'Basketball' || sport === 'Soccer')
                ? `images/sportsicon/${sport}.png`
                : 'images/sportsicon/Soccer.png';

            let team1 = { name: '', logo: defaultLogo, score: '' };
            let team2 = { name: '', logo: defaultLogo, score: '' };

            if (competitors.length >= 2) {
                const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
                const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
                team1 = {
                    name: home.team?.shortDisplayName || home.team?.displayName || home.team?.name || home.athlete?.displayName || 'Home Team',
                    logo: home.team?.logo || home.athlete?.flag?.href || defaultLogo,
                    score: home.score
                };
                team2 = {
                    name: away.team?.shortDisplayName || away.team?.displayName || away.team?.name || away.athlete?.displayName || 'Away Team',
                    logo: away.team?.logo || away.athlete?.flag?.href || defaultLogo,
                    score: away.score
                };
            } else {
                const parts = String(ev.name || ev.shortName || defaultLeague).split(/\s+vs\.?\s+|\s+at\s+/i);
                team1.name = parts[0] || defaultLeague;
                team2.name = parts[1] || (ev.status?.type?.detail || 'Live Session');
            }

            const eventDate = new Date(ev.date);
            const localDateStr = !isNaN(eventDate.getTime()) ? formatYYYY_MM_DD(eventDate) : todayStr;

            let tabCat = forcedTabCat || 'today';
            if (!forcedTabCat) {
                if (localDateStr <= yesterdayStr) tabCat = 'yesterday';
                else if (localDateStr >= tomorrowStr) tabCat = 'tomorrow';
                else tabCat = 'today';
            }

            const state = ev.status?.type?.state || 'pre'; // 'in', 'pre', 'post'
            const shortDetail = ev.status?.type?.shortDetail || '';
            let status = 'upcoming';

            const nowMs = Date.now();
            const startMs = eventDate.getTime();
            const diffHours = (nowMs - startMs) / (1000 * 3600);

            if (state === 'in') {
                status = 'live';
            } else if (state === 'post' || ev.status?.type?.completed) {
                status = 'ended';
            } else if (!isNaN(startMs) && diffHours >= -0.25 && diffHours <= 3.0) {
                status = 'live';
            } else {
                status = 'upcoming';
            }

            let timeStr = formatLocalTimeFromDate(eventDate);
            if (state === 'in' && team1.score !== undefined && team2.score !== undefined) {
                timeStr = `Skor ${team1.score} - ${team2.score} (${shortDetail || 'Live'})`;
            } else if (state === 'post' && team1.score !== undefined && team2.score !== undefined) {
                timeStr = `FT: ${team1.score} - ${team2.score}`;
            }

            const leagueLabel = comp?.league?.name || ev.season?.slug?.toUpperCase() || leagueNameFromApi || defaultLeague;
            const broadcastName = (comp?.broadcasts && comp.broadcasts[0] && comp.broadcasts[0].names && comp.broadcasts[0].names[0])
                ? comp.broadcasts[0].names[0]
                : `${sport} HD Official`;

            const matchTitle = `${team1.name} vs ${team2.name}`;
            const servers = getServersForSport(sport, matchTitle);

            results.push({
                id: `espn-${ev.id}`,
                league: leagueLabel,
                sport: sport,
                isHot: status === 'live' || leagueLabel.toLowerCase().includes('champions') || leagueLabel.toLowerCase().includes('premier') || leagueLabel.toLowerCase().includes('nba'),
                team1: { name: team1.name, logo: team1.logo },
                team2: { name: team2.name, logo: team2.logo },
                timeStr: timeStr,
                commentator: broadcastName,
                channelName: servers[0]?.label || 'Server 1 HD',
                servers: servers,
                status: status,
                tabCategory: tabCat,
                sortTime: !isNaN(startMs) ? startMs : nowMs
            });
        });

        return results;
    }

    // Parse TheSportsDB events into normalized match objects
    function parseSportsDbEvents(data, tabCat) {
        if (!data || !Array.isArray(data.events)) return [];
        const results = [];

        data.events.forEach(ev => {
            const rawSport = String(ev.strSport || '').toLowerCase();
            let sport = 'Soccer';
            if (rawSport.includes('badminton')) sport = 'Badminton';
            else if (rawSport.includes('basketball')) sport = 'Basketball';
            else if (rawSport.includes('baseball')) sport = 'Baseball';
            else if (rawSport.includes('tennis')) sport = 'Tennis';
            else if (rawSport.includes('motorsport') || rawSport.includes('racing') || rawSport.includes('fighting')) sport = 'Racing';
            else if (rawSport.includes('soccer') || rawSport.includes('football')) sport = 'Soccer';

            const defaultLogo = (sport === 'Baseball' || sport === 'Basketball' || sport === 'Soccer')
                ? `images/sportsicon/${sport}.png`
                : 'images/sportsicon/Soccer.png';

            let team1Name = (ev.strHomeTeam || '').trim();
            let team2Name = (ev.strAwayTeam || '').trim();
            if (!team1Name && ev.strEvent) {
                const parts = ev.strEvent.split(/\s+vs\.?\s+/i);
                team1Name = parts[0] || ev.strLeague || sport;
                team2Name = parts[1] || 'Live Event';
            }
            if (!team1Name) team1Name = ev.strLeague || `${sport} Event`;
            if (!team2Name) team2Name = 'Main Round';

            const team1Logo = ev.strHomeTeamBadge || ev.strLeagueBadge || ev.strThumb || defaultLogo;
            const team2Logo = ev.strAwayTeamBadge || ev.strLeagueBadge || ev.strThumb || defaultLogo;

            let eventDate = null;
            if (ev.strTimestamp) {
                eventDate = new Date(ev.strTimestamp.endsWith('Z') ? ev.strTimestamp : ev.strTimestamp + 'Z');
            } else if (ev.dateEvent && ev.strTime) {
                eventDate = new Date(`${ev.dateEvent}T${ev.strTime}Z`);
            }

            const nowMs = Date.now();
            const startMs = (eventDate && !isNaN(eventDate.getTime())) ? eventDate.getTime() : nowMs;
            const diffHours = (nowMs - startMs) / (1000 * 3600);

            let status = 'upcoming';
            if (ev.intHomeScore !== null && ev.intHomeScore !== undefined && ev.intHomeScore !== '' && diffHours > 2) {
                status = 'ended';
            } else if (tabCat === 'yesterday') {
                status = 'ended';
            } else if (diffHours >= -0.5 && diffHours <= 3.5 && tabCat === 'today') {
                status = 'live';
            }

            let timeStr = (eventDate && !isNaN(eventDate.getTime()))
                ? formatLocalTimeFromDate(eventDate)
                : `Pukul ${(ev.strTime || '20:00').slice(0, 5).replace(':', '.')}`;

            if (ev.intHomeScore !== null && ev.intHomeScore !== undefined && ev.intHomeScore !== '') {
                timeStr = `${status === 'ended' ? 'FT' : 'Skor'}: ${ev.intHomeScore} - ${ev.intAwayScore}`;
            }

            const matchTitle = `${team1Name} vs ${team2Name}`;
            const servers = getServersForSport(sport, matchTitle, ev.strVideo);

            results.push({
                id: `tsdb-${ev.idEvent}`,
                league: ev.strLeague || `${sport} Championship`,
                sport: sport,
                isHot: status === 'live' || sport === 'Badminton' || sport === 'Racing',
                team1: { name: team1Name, logo: team1Logo },
                team2: { name: team2Name, logo: team2Logo },
                timeStr: timeStr,
                commentator: `${sport} Official Broadcast`,
                channelName: servers[0]?.label || 'Server 1 HD',
                servers: servers,
                status: status,
                tabCategory: tabCat,
                sortTime: startMs
            });
        });

        return results;
    }

    // =========================================================
    // 3. Load & Merge Live Matches Dynamically
    // =========================================================
    async function loadData(isBackgroundRefresh = false) {
        const yesterdayD = getOffsetDate(-1);
        const todayD = getOffsetDate(0);
        const tomorrowD = getOffsetDate(1);

        const ymdYesterday = formatYYYYMMDD(yesterdayD);
        const ymdToday = formatYYYYMMDD(todayD);
        const ymdTomorrow = formatYYYYMMDD(tomorrowD);

        const isoYesterday = formatYYYY_MM_DD(yesterdayD);
        const isoToday = formatYYYY_MM_DD(todayD);
        const isoTomorrow = formatYYYY_MM_DD(tomorrowD);

        const espnBase = 'https://site.api.espn.com/apis/site/v2/sports';
        const tsdbBase = 'https://www.thesportsdb.com/api/v1/json/123';

        // Fetch real-time schedules concurrently
        const [
            uclToday,
            eplToday,
            laligaToday,
            serieaToday,
            bundesToday,
            indoToday,
            soccerToday,
            soccerYesterday,
            soccerTomorrow,
            nbaToday,
            nbaYesterday,
            nbaTomorrow,
            tennisToday,
            mlbToday,
            f1Today,
            tsdbToday,
            tsdbTomorrow,
            tsdbBadminton
        ] = await Promise.all([
            safeFetchJson(`${espnBase}/soccer/uefa.champions/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/eng.1/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/esp.1/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/ita.1/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/ger.1/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/idn.1/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/all/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/soccer/all/scoreboard?dates=${ymdYesterday}`),
            safeFetchJson(`${espnBase}/soccer/all/scoreboard?dates=${ymdTomorrow}`),
            safeFetchJson(`${espnBase}/basketball/nba/scoreboard?dates=${ymdToday}`),
            safeFetchJson(`${espnBase}/basketball/nba/scoreboard?dates=${ymdYesterday}`),
            safeFetchJson(`${espnBase}/basketball/nba/scoreboard?dates=${ymdTomorrow}`),
            safeFetchJson(`${espnBase}/tennis/atp/scoreboard`),
            safeFetchJson(`${espnBase}/baseball/mlb/scoreboard`),
            safeFetchJson(`${espnBase}/racing/f1/scoreboard`),
            safeFetchJson(`${tsdbBase}/eventsday.php?d=${isoToday}`),
            safeFetchJson(`${tsdbBase}/eventsday.php?d=${isoTomorrow}`),
            safeFetchJson(`${tsdbBase}/eventsday.php?d=${isoToday}&s=Badminton`)
        ]);

        const fetchedMatches = [
            ...parseEspnEvents(uclToday, 'Soccer', 'UEFA Champions League', 'today'),
            ...parseEspnEvents(eplToday, 'Soccer', 'English Premier League', 'today'),
            ...parseEspnEvents(laligaToday, 'Soccer', 'Spanish LaLiga', 'today'),
            ...parseEspnEvents(serieaToday, 'Soccer', 'Italian Serie A', 'today'),
            ...parseEspnEvents(bundesToday, 'Soccer', 'German Bundesliga', 'today'),
            ...parseEspnEvents(indoToday, 'Soccer', 'Liga 1 Indonesia', 'today'),
            ...parseEspnEvents(soccerToday, 'Soccer', 'World Football', 'today'),
            ...parseEspnEvents(nbaToday, 'Basketball', 'NBA Basketball', 'today'),
            ...parseEspnEvents(tennisToday, 'Tennis', 'ATP World Tour', 'today'),
            ...parseEspnEvents(mlbToday, 'Baseball', 'MLB Baseball', 'today'),
            ...parseEspnEvents(f1Today, 'Racing', 'Formula 1 Championship', 'today'),
            ...parseSportsDbEvents(tsdbBadminton, 'today'),
            ...parseSportsDbEvents(tsdbToday, 'today'),
            ...parseEspnEvents(soccerTomorrow, 'Soccer', 'World Football', 'tomorrow'),
            ...parseEspnEvents(nbaTomorrow, 'Basketball', 'NBA Basketball', 'tomorrow'),
            ...parseSportsDbEvents(tsdbTomorrow, 'tomorrow'),
            ...parseEspnEvents(soccerYesterday, 'Soccer', 'World Football', 'yesterday'),
            ...parseEspnEvents(nbaYesterday, 'Basketball', 'NBA Basketball', 'yesterday')
        ];

        // Deduplicate by team pair + tabCategory
        const seenKeys = new Set();
        const uniqueMatches = [];

        for (const m of fetchedMatches) {
            const sig = `${m.tabCategory}-${m.team1.name.toLowerCase()}-${m.team2.name.toLowerCase()}`;
            if (!seenKeys.has(sig)) {
                seenKeys.add(sig);
                uniqueMatches.push(m);
            }
        }

        // Sort: live matches first, then hot matches, then by kickoff time
        uniqueMatches.sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;
            return (a.sortTime || 0) - (b.sortTime || 0);
        });

        // Ensure today's top priority matches are also marked 'live' if no match is currently mid-game,
        // so the "Live Event" tab always displays today's active broadcast schedule
        const liveInToday = uniqueMatches.filter(m => m.tabCategory === 'today' && m.status === 'live');
        if (liveInToday.length < 6) {
            let promoted = 0;
            for (const m of uniqueMatches) {
                if (m.tabCategory === 'today' && m.status === 'upcoming') {
                    m.status = 'live';
                    promoted++;
                    if (liveInToday.length + promoted >= 8) break;
                }
            }
        }

        // Offline Fallback: if all remote APIs failed (e.g. no internet), load ./data/events.json
        if (uniqueMatches.length === 0) {
            try {
                const localRes = await fetch('./data/events.json?v=' + Date.now());
                if (localRes.ok) {
                    const localEvents = await localRes.json();
                    if (Array.isArray(localEvents)) {
                        localEvents.forEach((item, idx) => {
                            const sport = (item.league || '').toLowerCase().includes('nba') ? 'Basketball'
                                : (item.league || '').toLowerCase().includes('badminton') ? 'Badminton'
                                : (item.league || '').toLowerCase().includes('motogp') ? 'Racing'
                                : 'Soccer';
                            const t1 = item.team1?.name || item.league || 'Live Team 1';
                            const t2 = item.team2?.name || 'Live Team 2';
                            const servers = getServersForSport(sport, `${t1} vs ${t2}`);
                            uniqueMatches.push({
                                id: item.id || `local-${idx}`,
                                league: item.league || 'Live Sports',
                                sport: sport,
                                isHot: true,
                                team1: { name: t1, logo: item.team1?.logo || 'images/sportsicon/Soccer.png' },
                                team2: { name: t2, logo: item.team2?.logo || 'images/sportsicon/Soccer.png' },
                                timeStr: `Pukul ${(item.match_time || '20:00').replace(':', '.')}`,
                                commentator: `${sport} Official Broadcast`,
                                channelName: servers[0].label,
                                servers: servers,
                                status: 'live',
                                tabCategory: 'today'
                            });
                        });
                    }
                }
            } catch (_) {}
        }

        // Combine dynamic matches with 24/7 Live Sports TV Channels
        const combined = [...uniqueMatches];
        FEATURED_SPORTS_CHANNELS.forEach(tv => {
            combined.push(tv);
            combined.push({
                ...tv,
                id: `${tv.id}-tmrw`,
                timeStr: 'Besok (Live 24 Jam)',
                tabCategory: 'tomorrow'
            });
        });

        allMatches = combined;
        renderMatches();

        // Start 60s background auto-refresh if not started
        if (!refreshTimer) {
            refreshTimer = setInterval(() => {
                loadData(true);
            }, 60000);
        }
    }

    // =========================================================
    // 4. Render Match Cards & Filtering
    // =========================================================
    function renderMatches() {
        const container = document.getElementById('matches-container');
        if (!container) return;

        // Apply both Date Filter AND Sport Category Filter
        let filtered = allMatches.filter(match => {
            // 1. Date Filter
            if (currentTab !== 'all' && match.tabCategory !== currentTab) {
                return false;
            }

            // 2. Sport Category Filter
            if (currentCategory === 'all') return true;
            if (currentCategory === 'live') return match.status === 'live';
            if (currentCategory === 'hot') return match.isHot || match.status === 'live';

            return (match.sport && match.sport.toLowerCase() === currentCategory.toLowerCase());
        });

        // Fallback if combination has no matches in the current date tab
        if (filtered.length === 0) {
            filtered = allMatches.filter(match => {
                if (currentCategory === 'all') return true;
                if (currentCategory === 'live') return match.status === 'live';
                if (currentCategory === 'hot') return match.isHot || match.status === 'live';
                return (match.sport && match.sport.toLowerCase() === currentCategory.toLowerCase());
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="matches-empty">
                    <i class="far fa-calendar-times" style="font-size: 36px; margin-bottom: 12px; opacity: 0.6;"></i>
                    <p>Tidak ada pertandingan untuk kategori <strong>${escapeHTML(currentCategory)}</strong>.</p>
                    <button onclick="window.resetFilters()">Lihat Semua Pertandingan</button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(match => {
            const isPlaying = currentPlayingMatch && currentPlayingMatch.id === match.id;
            const activeClass = isPlaying ? 'card-active' : '';

            // Status Badge
            let statusBadge = '';
            if (match.status === 'live') {
                statusBadge = `<span class="match-status-badge status-live"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i> Live</span>`;
            } else if (match.status === 'ended') {
                statusBadge = `<span class="match-status-badge status-ended">Selesai</span>`;
            } else {
                statusBadge = `<span class="match-status-badge status-upcoming">Segera Dimulai</span>`;
            }

            return `
                <div class="match-card ${activeClass}" data-id="${escapeHTML(match.id)}">
                    <!-- Upper: 3 Column Info -->
                    <div class="card-main">
                        <div class="team-left">
                            <img src="${escapeHTML(match.team1.logo)}" class="team-logo" alt="${escapeHTML(match.team1.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/sportsicon/Soccer.png'">
                            <span class="team-name">${escapeHTML(match.team1.name)}</span>
                        </div>
                        <div class="match-center">
                            <span class="match-time">${escapeHTML(match.timeStr)}</span>
                            ${statusBadge}
                        </div>
                        <div class="team-right">
                            <span class="team-name">${escapeHTML(match.team2.name)}</span>
                            <img src="${escapeHTML(match.team2.logo)}" class="team-logo" alt="${escapeHTML(match.team2.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/sportsicon/Soccer.png'">
                        </div>
                    </div>

                    <!-- Lower: Sub-bar Meta Info -->
                    <div class="card-sub-bar">
                        <div class="sub-item sub-league">
                            <span>${escapeHTML(match.league)}</span>
                            <i class="fas fa-trophy sub-icon" style="color: #eab308;"></i>
                        </div>
                        <div class="sub-item sub-commentator">
                            <span>${escapeHTML(match.commentator)}</span>
                            <i class="fas fa-microphone sub-icon" style="color: #94a3b8;"></i>
                        </div>
                        <div class="sub-item sub-channel">
                            <span>${escapeHTML(match.channelName)}</span>
                            <i class="fas fa-tv sub-icon"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach Card Click Event Listeners
        const cards = container.querySelectorAll('.match-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const match = allMatches.find(m => m.id === id);
                if (match) {
                    playMatch(match);
                }
            });
        });
    }

    // =========================================================
    // 5. Video Player Execution & Server Switcher
    // =========================================================
    function formatServerUrl(srvUrl, fallbackChannel, matchTitle) {
        const titleParam = matchTitle ? `&name=${encodeURIComponent(matchTitle)}` : '';
        if (!srvUrl) {
            return `player.html?channel=${encodeURIComponent(fallbackChannel || 'SPORTITALIA')}${titleParam}`;
        }
        if (srvUrl.startsWith('player.html')) {
            return srvUrl;
        }
        const channelMatch = srvUrl.match(/channel=([^&]+)/);
        if (channelMatch) {
            return `player.html?channel=${channelMatch[1]}${titleParam}`;
        }
        return `player.html?url=${encodeURIComponent(srvUrl)}${titleParam}`;
    }

    function playMatch(match, targetUrl = null) {
        currentPlayingMatch = match;
        const matchTitle = `${match.team1.name} vs ${match.team2.name}`;

        let streamUrl = targetUrl;
        if (!streamUrl) {
            if (match.servers && match.servers.length > 0) {
                const s = match.servers[0];
                streamUrl = formatServerUrl(s.url, match.channelName, matchTitle);
            } else if (match.channelUrl && match.channelUrl.startsWith('player.html')) {
                streamUrl = match.channelUrl;
            } else if (match.channelName) {
                streamUrl = formatServerUrl(null, match.channelName, matchTitle);
            } else {
                streamUrl = `player.html?channel=SPORTITALIA&name=${encodeURIComponent(matchTitle)}`;
            }
        }

        currentPlayingServerUrl = streamUrl;

        // UI Updates
        const placeholder = document.getElementById('player-placeholder');
        const iframe = document.getElementById('video-iframe');
        const nowPlayingBar = document.getElementById('now-playing-bar');
        const playingTitle = document.getElementById('playing-title');
        const serverChips = document.getElementById('server-chips');

        if (placeholder) placeholder.style.display = 'none';
        if (iframe) {
            iframe.style.display = 'block';
            iframe.src = streamUrl;
        }

        if (nowPlayingBar && playingTitle) {
            nowPlayingBar.style.display = 'flex';
            playingTitle.textContent = `${match.team1.name} vs ${match.team2.name} (${match.league || 'Live HD'})`;
        }

        // Render Server Chips
        if (serverChips) {
            const availableServers = (match.servers && match.servers.length > 0)
                ? match.servers.map((srv, idx) => ({
                    label: srv.label || `Server ${idx + 1}`,
                    url: formatServerUrl(srv.url, match.channelName, matchTitle)
                }))
                : getServersForSport(match.sport || 'Soccer', matchTitle);

            serverChips.innerHTML = availableServers.map((srv, i) => {
                const sUrl = srv.url || streamUrl;
                const active = (sUrl === streamUrl || (i === 0 && !targetUrl)) ? 'active' : '';
                return `<button class="server-chip-btn ${active}" data-url="${escapeHTML(sUrl)}">${escapeHTML(srv.label || `Server ${i + 1}`)}</button>`;
            }).join('');

            serverChips.querySelectorAll('.server-chip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    serverChips.querySelectorAll('.server-chip-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const url = btn.getAttribute('data-url');
                    playMatch(match, url);
                });
            });
        }

        // Highlight active card
        document.querySelectorAll('.match-card').forEach(c => {
            if (c.getAttribute('data-id') === match.id) {
                c.classList.add('card-active');
            } else {
                c.classList.remove('card-active');
            }
        });

        // Smooth scroll to player on mobile
        if (window.innerWidth <= 768) {
            const playerSec = document.getElementById('player-section');
            if (playerSec) {
                playerSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    // =========================================================
    // 6. Sports Category Bar Handlers
    // =========================================================
    function initSportsCategories() {
        const liveBtn = document.getElementById('btn-live-event');
        const arrowLeft = document.getElementById('cat-arrow-left');
        const arrowRight = document.getElementById('cat-arrow-right');
        const scrollWrapper = document.getElementById('category-scroll-wrapper');
        const catButtons = document.querySelectorAll('.category-button');

        if (liveBtn) {
            liveBtn.addEventListener('click', () => {
                setCategoryActive(liveBtn, 'live');
            });
        }

        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                setCategoryActive(btn, cat);
            });
        });

        if (arrowLeft && scrollWrapper) {
            arrowLeft.addEventListener('click', () => {
                scrollWrapper.scrollBy({ left: -160, behavior: 'smooth' });
            });
        }
        if (arrowRight && scrollWrapper) {
            arrowRight.addEventListener('click', () => {
                scrollWrapper.scrollBy({ left: 160, behavior: 'smooth' });
            });
        }
    }

    function setCategoryActive(activeEl, cat) {
        currentCategory = cat;
        document.querySelectorAll('.category-freeze, .category-button').forEach(b => b.classList.remove('active'));
        if (activeEl) activeEl.classList.add('active');
        renderMatches();
    }

    // =========================================================
    // 7. Filter Tabs Click Handlers
    // =========================================================
    function initTabs() {
        const tabButtons = document.querySelectorAll('.filter-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                window.switchTab(tab);
            });
        });
    }

    window.switchTab = function (tab) {
        currentTab = tab;
        document.querySelectorAll('.filter-btn').forEach(b => {
            if (b.getAttribute('data-tab') === tab) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        renderMatches();
    };

    window.resetFilters = function () {
        currentTab = 'all';
        currentCategory = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === 'all');
        });
        document.querySelectorAll('.category-freeze, .category-button').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-category') === 'all');
        });
        renderMatches();
    };

    function escapeHTML(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // =========================================================
    // 8. Initialization
    // =========================================================
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initSportsCategories();
        initTabs();

        const placeholder = document.getElementById('player-placeholder');
        if (placeholder) {
            placeholder.addEventListener('click', () => {
                if (allMatches.length > 0) {
                    playMatch(allMatches[0]);
                }
            });
        }

        loadData();
    });

})();
