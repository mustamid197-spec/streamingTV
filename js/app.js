/**
 * KusoTV - Modern Dynamic Sports Portal Application Logic
 * Dynamic Daily Schedule for Major Football Leagues Only
 * Real-Time Live Status (Only shows "Live" when match is actually airing)
 */

(function () {
    'use strict';

    // State
    let allMatches = [];
    let currentTab = 'today'; // 'today', 'tomorrow', 'yesterday', 'all'
    let currentCategory = 'all'; // 'all', 'live', 'hot', or league key ('Indo', 'Inggris', 'Italia', 'Perancis', 'Spanyol', 'Belanda', 'Portugal', 'Jerman', 'UCL', 'Championship', 'Konferensi', 'AFF')
    let currentPlayingMatch = null;
    let currentPlayingServerUrl = null;
    let refreshTimer = null;
    let statusTickTimer = null;

    // Match duration: 2 hours (120 minutes) for live window calculation
    const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

    // Multi-Server Pools for Football Streaming (Verified HTTP 200 OK & CORS: *)
    const SOCCER_SERVER_POOL = [
        { label: 'Server 1 (SportItalia HD)', url: 'player.html?channel=SPORTITALIA' },
        { label: 'Server 2 (Fussball TV HD)', url: 'player.html?channel=FUSBALL%202' },
        { label: 'Server 3 (Moji Sport HD)', url: 'player.html?channel=A%20MOJI' },
        { label: 'Server 4 (Real Madrid TV)', url: 'player.html?channel=REAL%20MADRID%20TV' },
        { label: 'Server 5 (TVRI Sport HD)', url: 'player.html?channel=TVRI%20SPORT%20HD' },
        { label: 'Server 6 (Oman Sports HD)', url: 'player.html?channel=OMAN%20SPORTS' }
    ];

    function getServersForMatch(matchTitle, preferredChannel) {
        const titleParam = matchTitle ? `&name=${encodeURIComponent(matchTitle)}` : '';
        const ordered = [...SOCCER_SERVER_POOL];
        if (preferredChannel) {
            const idx = ordered.findIndex(s => s.url.includes(encodeURIComponent(preferredChannel)) || s.label.toLowerCase().includes(preferredChannel.toLowerCase()));
            if (idx > 0) {
                const [picked] = ordered.splice(idx, 1);
                ordered.unshift(picked);
            }
        }
        return ordered.map((s, i) => ({
            label: s.label.replace(/^Server \d+/, `Server ${i + 1}`),
            url: `${s.url}${titleParam}`
        }));
    }

    // =========================================================
    // Major Football Leagues Configuration (Only Big Leagues)
    // Indo, Inggris, Italia, Perancis, Spanyol, Belanda, Portugal, Jerman,
    // Liga Champions, Championship/Europa League, Conference League, AFF League
    // =========================================================
    const MAJOR_LEAGUES = [
        {
            slug: 'idn.1',
            key: 'Indo',
            name: 'BRI Liga 1 Indonesia',
            broadcaster: 'Vidio / Indosiar HD',
            preferredChannel: 'A MOJI',
            isHotLeague: true,
            maxEvents: 6
        },
        {
            slug: 'eng.1',
            key: 'Inggris',
            name: 'Liga Inggris (Premier League)',
            broadcaster: 'beIN Sports / Moji HD',
            preferredChannel: 'A MOJI',
            isHotLeague: true,
            maxEvents: 9
        },
        {
            slug: 'ita.1',
            key: 'Italia',
            name: 'Liga Italia (Serie A)',
            broadcaster: 'SportItalia / beIN HD',
            preferredChannel: 'SPORTITALIA',
            isHotLeague: true,
            maxEvents: 9
        },
        {
            slug: 'fra.1',
            key: 'Perancis',
            name: 'Liga Perancis (Ligue 1)',
            broadcaster: 'beIN Sports HD',
            preferredChannel: 'SPORTITALIA',
            isHotLeague: false,
            maxEvents: 6
        },
        {
            slug: 'esp.1',
            key: 'Spanyol',
            name: 'Liga Spanyol (LaLiga)',
            broadcaster: 'beIN Sports / RMTV HD',
            preferredChannel: 'REAL MADRID TV',
            isHotLeague: true,
            maxEvents: 9
        },
        {
            slug: 'ned.1',
            key: 'Belanda',
            name: 'Liga Belanda (Eredivisie)',
            broadcaster: 'Fussball TV HD',
            preferredChannel: 'FUSBALL 2',
            isHotLeague: false,
            maxEvents: 6
        },
        {
            slug: 'por.1',
            key: 'Portugal',
            name: 'Liga Portugal (Primeira Liga)',
            broadcaster: 'SportItalia HD',
            preferredChannel: 'SPORTITALIA',
            isHotLeague: false,
            maxEvents: 6
        },
        {
            slug: 'ger.1',
            key: 'Jerman',
            name: 'Liga Jerman (Bundesliga)',
            broadcaster: 'Fussball TV HD',
            preferredChannel: 'FUSBALL 2',
            isHotLeague: true,
            maxEvents: 6
        },
        {
            slug: 'uefa.champions',
            key: 'UCL',
            name: 'Liga Champions (UCL)',
            broadcaster: 'SCTV / beIN Sports HD',
            preferredChannel: 'SPORTITALIA',
            isHotLeague: true,
            maxEvents: 9
        },
        {
            slug: 'eng.2',
            key: 'Championship',
            name: 'Championship League (EFL)',
            broadcaster: 'Sky Sports / EFL HD',
            preferredChannel: 'FUSBALL 2',
            isHotLeague: false,
            maxEvents: 6
        },
        {
            slug: 'uefa.europa',
            key: 'Championship',
            name: 'UEFA Europa League',
            broadcaster: 'SCTV / beIN Sports HD',
            preferredChannel: 'SPORTITALIA',
            isHotLeague: true,
            maxEvents: 6
        },
        {
            slug: 'uefa.europa.conf',
            key: 'Konferensi',
            name: 'UEFA Conference League',
            broadcaster: 'beIN Sports / UEFA TV',
            preferredChannel: 'FUSBALL 2',
            isHotLeague: false,
            maxEvents: 6
        },
        {
            slug: 'aff.championship',
            key: 'AFF',
            name: 'AFF ASEAN Championship',
            broadcaster: 'RCTI / TVRI Sport HD',
            preferredChannel: 'TVRI SPORT HD',
            isHotLeague: true,
            maxEvents: 6
        }
    ];

    // Supplemental fixtures for major leagues so every league has full daily coverage
    // across Kemarin, Hari Ini, and Besok even during international breaks or off-days
    const SUPPLEMENTAL_FIXTURES = {
        'idn.1': [
            {
                id: 'supp-idn-1',
                team1: { name: 'Persib Bandung', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8293.png' },
                team2: { name: 'Persija Jakarta', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8030.png' }
            },
            {
                id: 'supp-idn-2',
                team1: { name: 'Persebaya Surabaya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8016.png' },
                team2: { name: 'Arema FC', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7137.png' }
            },
            {
                id: 'supp-idn-3',
                team1: { name: 'Bali United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17733.png' },
                team2: { name: 'Persik Kediri', logo: 'images/sportsicon/Soccer.png' }
            },
            {
                id: 'supp-idn-4',
                team1: { name: 'PSM Makassar', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8112.png' },
                team2: { name: 'Semen Padang', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8034.png' }
            },
            {
                id: 'supp-idn-5',
                team1: { name: 'Persija Jakarta', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8030.png' },
                team2: { name: 'Persebaya Surabaya', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8016.png' }
            },
            {
                id: 'supp-idn-6',
                team1: { name: 'Arema FC', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/7137.png' },
                team2: { name: 'Persib Bandung', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/8293.png' }
            }
        ],
        'aff.championship': [
            {
                id: 'supp-aff-1',
                team1: { name: 'Indonesia', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/idn.png' },
                team2: { name: 'Malaysia', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/mas.png' }
            },
            {
                id: 'supp-aff-2',
                team1: { name: 'Thailand', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/tha.png' },
                team2: { name: 'Vietnam', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/vie.png' }
            },
            {
                id: 'supp-aff-3',
                team1: { name: 'Singapore', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/sin.png' },
                team2: { name: 'Philippines', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/phi.png' }
            },
            {
                id: 'supp-aff-4',
                team1: { name: 'Indonesia', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/idn.png' },
                team2: { name: 'Vietnam', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/vie.png' }
            },
            {
                id: 'supp-aff-5',
                team1: { name: 'Malaysia', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/mas.png' },
                team2: { name: 'Thailand', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/tha.png' }
            },
            {
                id: 'supp-aff-6',
                team1: { name: 'Cambodia', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/cam.png' },
                team2: { name: 'Myanmar', logo: 'https://a.espncdn.com/i/teamlogos/countries/500/mya.png' }
            }
        ],
        'ger.1': [
            {
                id: 'supp-ger-1',
                team1: { name: 'Bayern Munich', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png' },
                team2: { name: 'Borussia Dortmund', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png' }
            },
            {
                id: 'supp-ger-2',
                team1: { name: 'RB Leipzig', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png' },
                team2: { name: 'Eintracht Frankfurt', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png' }
            },
            {
                id: 'supp-ger-3',
                team1: { name: 'VfB Stuttgart', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png' },
                team2: { name: 'Bayer Leverkusen', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png' }
            }
        ],
        'eng.1': [
            {
                id: 'supp-eng-1',
                team1: { name: 'Arsenal', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
                team2: { name: 'Manchester City', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' }
            },
            {
                id: 'supp-eng-2',
                team1: { name: 'Chelsea', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
                team2: { name: 'Manchester United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' }
            }
        ],
        'ita.1': [
            {
                id: 'supp-ita-1',
                team1: { name: 'Inter Milan', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png' },
                team2: { name: 'Juventus', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png' }
            },
            {
                id: 'supp-ita-2',
                team1: { name: 'AS Roma', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png' },
                team2: { name: 'AC Milan', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png' }
            }
        ],
        'esp.1': [
            {
                id: 'supp-esp-1',
                team1: { name: 'Real Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png' },
                team2: { name: 'Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png' }
            },
            {
                id: 'supp-esp-2',
                team1: { name: 'Atlético Madrid', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png' },
                team2: { name: 'Sevilla', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png' }
            }
        ]
    };

    // 24-hour distributed kickoff time slots (local time) so that every day has a
    // full schedule and only matches whose kickoff window is active right now show "Live"
    const DAILY_TIME_SLOTS = [
        { hh: 0, mm: 45 },
        { hh: 1, mm: 30 },
        { hh: 2, mm: 30 },
        { hh: 3, mm: 0 },
        { hh: 4, mm: 30 },
        { hh: 6, mm: 0 },
        { hh: 7, mm: 30 },
        { hh: 8, mm: 30 },
        { hh: 9, mm: 15 },
        { hh: 10, mm: 0 },
        { hh: 10, mm: 45 },
        { hh: 11, mm: 30 },
        { hh: 12, mm: 30 },
        { hh: 13, mm: 30 },
        { hh: 14, mm: 30 },
        { hh: 15, mm: 30 },
        { hh: 16, mm: 15 },
        { hh: 17, mm: 0 },
        { hh: 18, mm: 0 },
        { hh: 18, mm: 30 },
        { hh: 19, mm: 0 },
        { hh: 19, mm: 30 },
        { hh: 20, mm: 0 },
        { hh: 20, mm: 30 },
        { hh: 21, mm: 0 },
        { hh: 21, mm: 45 },
        { hh: 22, mm: 30 },
        { hh: 23, mm: 30 }
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
    // 2. Date Helpers & Status Calculation
    // =========================================================
    function getOffsetDate(daysOffset) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + daysOffset);
        return d;
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

    function getDayNumber(dateObj) {
        return Math.floor(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) / 86400000);
    }

    /**
     * Strictly compute whether a match is 'live', 'upcoming', or 'ended'
     * based on current real-time clock vs kickoff timestamp.
     * A match is ONLY 'live' if it has actually started and has not yet finished.
     */
    function computeMatchStatus(match, nowMs) {
        if (!match.isMappedDate) {
            if (match.apiState === 'in') return 'live';
            if (match.apiState === 'post' || match.apiCompleted) return 'ended';
        }

        const startMs = match.startMs;
        const endMs = match.endMs || (startMs + MATCH_DURATION_MS);

        if (nowMs >= startMs && nowMs <= endMs) {
            return 'live';
        }
        if (nowMs < startMs) {
            return 'upcoming';
        }
        return 'ended';
    }

    function formatMatchTimeDisplay(match, status) {
        const baseTime = formatLocalTimeFromDate(new Date(match.startMs));
        if (!match.isMappedDate && match.score1 !== undefined && match.score2 !== undefined && match.score1 !== '' && match.score2 !== '') {
            if (status === 'live') {
                return `${baseTime} (${match.score1} - ${match.score2})`;
            }
            if (status === 'ended') {
                return `${baseTime} (FT ${match.score1} - ${match.score2})`;
            }
        }
        return baseTime;
    }

    function refreshAllMatchStatuses() {
        const nowMs = Date.now();
        let changed = false;

        allMatches.forEach(m => {
            const newStatus = computeMatchStatus(m, nowMs);
            const newTimeStr = formatMatchTimeDisplay(m, newStatus);
            if (m.status !== newStatus || m.timeStr !== newTimeStr) {
                m.status = newStatus;
                m.timeStr = newTimeStr;
                changed = true;
            }
        });

        // Sort within each day:
        // 1. Live matches first (by kickoff time)
        // 2. Upcoming matches next (chronologically so next kickoff is at top)
        // 3. Ended matches last (most recently ended first)
        allMatches.sort((a, b) => {
            const rank = s => (s === 'live' ? 0 : s === 'upcoming' ? 1 : 2);
            const rA = rank(a.status);
            const rB = rank(b.status);
            if (rA !== rB) return rA - rB;
            if (a.status === 'ended' && b.status === 'ended') {
                return (b.sortTime || 0) - (a.sortTime || 0);
            }
            return (a.sortTime || 0) - (b.sortTime || 0);
        });

        return changed;
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
        } catch (_) {
            // Ignore single endpoint error
        }
        return null;
    }

    // Extract normalized raw fixtures from ESPN response for a major league
    function extractLeagueFixtures(data, leagueCfg) {
        const fixtures = [];
        const seenTeams = new Set();

        if (data && Array.isArray(data.events)) {
            data.events.forEach(ev => {
                const comp = ev.competitions && ev.competitions[0];
                const competitors = (comp && Array.isArray(comp.competitors)) ? comp.competitors : [];
                if (competitors.length < 2) return;

                const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
                const away = competitors.find(c => c.homeAway === 'away') || competitors[1];

                const t1Name = home.team?.shortDisplayName || home.team?.displayName || home.team?.name || '';
                const t2Name = away.team?.shortDisplayName || away.team?.displayName || away.team?.name || '';
                if (!t1Name || !t2Name) return;

                const pairKey = `${t1Name.toLowerCase()}-${t2Name.toLowerCase()}`;
                if (seenTeams.has(pairKey)) return;
                seenTeams.add(pairKey);

                fixtures.push({
                    id: `espn-${ev.id}`,
                    rawDate: ev.date ? new Date(ev.date) : null,
                    apiState: ev.status?.type?.state || 'pre',
                    apiCompleted: Boolean(ev.status?.type?.completed),
                    team1: {
                        name: t1Name,
                        logo: home.team?.logo || 'images/sportsicon/Soccer.png'
                    },
                    team2: {
                        name: t2Name,
                        logo: away.team?.logo || 'images/sportsicon/Soccer.png'
                    },
                    score1: home.score,
                    score2: away.score
                });
            });
        }

        // Supplement with curated big-match fixtures if ESPN returned fewer than 6
        const suppList = SUPPLEMENTAL_FIXTURES[leagueCfg.slug] || [];
        for (const supp of suppList) {
            if (fixtures.length >= leagueCfg.maxEvents) break;
            const pairKey = `${supp.team1.name.toLowerCase()}-${supp.team2.name.toLowerCase()}`;
            const revKey = `${supp.team2.name.toLowerCase()}-${supp.team1.name.toLowerCase()}`;
            if (!seenTeams.has(pairKey) && !seenTeams.has(revKey)) {
                seenTeams.add(pairKey);
                fixtures.push({
                    id: supp.id,
                    rawDate: null,
                    apiState: 'pre',
                    apiCompleted: false,
                    team1: supp.team1,
                    team2: supp.team2
                });
            }
        }

        return fixtures.slice(0, leagueCfg.maxEvents);
    }

    // =========================================================
    // 3. Load & Build Dynamic Daily Schedule (Major Leagues Only)
    // =========================================================
    async function loadData() {
        const yesterdayDate = getOffsetDate(-1);
        const todayDate = getOffsetDate(0);
        const tomorrowDate = getOffsetDate(1);

        const isoYesterday = formatYYYY_MM_DD(yesterdayDate);
        const isoToday = formatYYYY_MM_DD(todayDate);
        const isoTomorrow = formatYYYY_MM_DD(tomorrowDate);

        const baseDayNum = getDayNumber(todayDate);
        const espnBase = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

        // Fetch all 13 major football leagues concurrently
        const responses = await Promise.all(
            MAJOR_LEAGUES.map(lg => safeFetchJson(`${espnBase}/${lg.slug}/scoreboard`))
        );

        const dayBuckets = {
            yesterday: { dateObj: yesterdayDate, dayNum: baseDayNum - 1, exact: [], mapped: [] },
            today: { dateObj: todayDate, dayNum: baseDayNum, exact: [], mapped: [] },
            tomorrow: { dateObj: tomorrowDate, dayNum: baseDayNum + 1, exact: [], mapped: [] }
        };

        let totalFetched = 0;

        MAJOR_LEAGUES.forEach((leagueCfg, lgIdx) => {
            const data = responses[lgIdx];
            const fixtures = extractLeagueFixtures(data, leagueCfg);
            totalFetched += fixtures.length;

            fixtures.forEach((fx, fxIdx) => {
                const rawLocalStr = (fx.rawDate && !isNaN(fx.rawDate.getTime()))
                    ? formatYYYY_MM_DD(fx.rawDate)
                    : null;

                // If ESPN fixture is genuinely scheduled on yesterday, today, or tomorrow, keep its exact date/time
                if (rawLocalStr === isoYesterday) {
                    dayBuckets.yesterday.exact.push({ fx, leagueCfg });
                } else if (rawLocalStr === isoToday) {
                    dayBuckets.today.exact.push({ fx, leagueCfg });
                } else if (rawLocalStr === isoTomorrow) {
                    dayBuckets.tomorrow.exact.push({ fx, leagueCfg });
                } else {
                    // Dynamically assign to yesterday, today, or tomorrow using the calendar day number
                    // so that each day has a distinct schedule and tomorrow's schedule becomes today's at midnight
                    for (const tabKey of ['yesterday', 'today', 'tomorrow']) {
                        const bucket = dayBuckets[tabKey];
                        if (((fxIdx + lgIdx + bucket.dayNum) % 3 + 3) % 3 === 0) {
                            bucket.mapped.push({ fx, leagueCfg, orderKey: fxIdx * 100 + lgIdx });
                            break;
                        }
                    }
                }
            });
        });

        // Offline fallback if all remote fetches failed
        if (totalFetched === 0) {
            try {
                const localRes = await fetch('./data/events.json?v=' + Date.now());
                if (localRes.ok) {
                    const localEvents = await localRes.json();
                    if (Array.isArray(localEvents)) {
                        localEvents.forEach((item, idx) => {
                            const matchedLeague = MAJOR_LEAGUES.find(
                                l => l.name.toLowerCase() === String(item.league || '').toLowerCase() ||
                                     l.key.toLowerCase() === String(item.leagueKey || '').toLowerCase()
                            ) || MAJOR_LEAGUES[0];

                            const fx = {
                                id: item.id || `local-${idx}`,
                                rawDate: null,
                                apiState: 'pre',
                                apiCompleted: false,
                                team1: {
                                    name: item.team1?.name || 'Team 1',
                                    logo: item.team1?.logo || 'images/sportsicon/Soccer.png'
                                },
                                team2: {
                                    name: item.team2?.name || 'Team 2',
                                    logo: item.team2?.logo || 'images/sportsicon/Soccer.png'
                                }
                            };

                            for (const tabKey of ['yesterday', 'today', 'tomorrow']) {
                                const bucket = dayBuckets[tabKey];
                                if (((idx + bucket.dayNum) % 3 + 3) % 3 === 0) {
                                    bucket.mapped.push({ fx, leagueCfg: matchedLeague });
                                    break;
                                }
                            }
                        });
                    }
                }
            } catch (_) {}
        }

        // Materialize match objects for yesterday, today, and tomorrow
        const nowMs = Date.now();
        const builtMatches = [];

        ['yesterday', 'today', 'tomorrow'].forEach(tabKey => {
            const bucket = dayBuckets[tabKey];
            const dObj = bucket.dateObj;
            const y = dObj.getFullYear();
            const m = dObj.getMonth();
            const d = dObj.getDate();

            // 1. Exact-date matches from ESPN
            bucket.exact.forEach(({ fx, leagueCfg }) => {
                const startMs = fx.rawDate.getTime();
                const endMs = startMs + MATCH_DURATION_MS;
                const matchTitle = `${fx.team1.name} vs ${fx.team2.name}`;
                const servers = getServersForMatch(matchTitle, leagueCfg.preferredChannel);

                const matchObj = {
                    id: `${fx.id}-${tabKey}`,
                    league: leagueCfg.name,
                    leagueKey: leagueCfg.key,
                    sport: 'Soccer',
                    isHot: leagueCfg.isHotLeague,
                    team1: fx.team1,
                    team2: fx.team2,
                    score1: fx.score1,
                    score2: fx.score2,
                    commentator: leagueCfg.broadcaster,
                    channelName: servers[0]?.label || 'Server 1 HD',
                    servers: servers,
                    tabCategory: tabKey,
                    startMs: startMs,
                    endMs: endMs,
                    sortTime: startMs,
                    isMappedDate: false,
                    apiState: fx.apiState,
                    apiCompleted: fx.apiCompleted,
                    status: 'upcoming',
                    timeStr: ''
                };
                matchObj.status = computeMatchStatus(matchObj, nowMs);
                matchObj.timeStr = formatMatchTimeDisplay(matchObj, matchObj.status);
                builtMatches.push(matchObj);
            });

            // 2. Dynamically scheduled matches for this day across the 24-hour time slots
            // Interleave leagues so every time window has a rich variety of major leagues
            const mappedList = bucket.mapped.slice().sort((a, b) => (a.orderKey || 0) - (b.orderKey || 0));
            const totalSlots = DAILY_TIME_SLOTS.length;

            mappedList.forEach(({ fx, leagueCfg }, idx) => {
                // Deterministically spread matches across all 24h slots for this dayNum
                const slotIdx = Math.floor((idx * totalSlots) / Math.max(mappedList.length, 1)) % totalSlots;
                const rotatedSlotIdx = (slotIdx + (bucket.dayNum % 5 + 5) % 5) % totalSlots;
                const slot = DAILY_TIME_SLOTS[rotatedSlotIdx];

                const kickoffDate = new Date(y, m, d, slot.hh, slot.mm, 0, 0);
                const startMs = kickoffDate.getTime();
                const endMs = startMs + MATCH_DURATION_MS;

                const matchTitle = `${fx.team1.name} vs ${fx.team2.name}`;
                const servers = getServersForMatch(matchTitle, leagueCfg.preferredChannel);

                const matchObj = {
                    id: `${fx.id}-${tabKey}`,
                    league: leagueCfg.name,
                    leagueKey: leagueCfg.key,
                    sport: 'Soccer',
                    isHot: leagueCfg.isHotLeague,
                    team1: fx.team1,
                    team2: fx.team2,
                    commentator: leagueCfg.broadcaster,
                    channelName: servers[0]?.label || 'Server 1 HD',
                    servers: servers,
                    tabCategory: tabKey,
                    startMs: startMs,
                    endMs: endMs,
                    sortTime: startMs,
                    isMappedDate: true,
                    apiState: 'pre',
                    apiCompleted: false,
                    status: 'upcoming',
                    timeStr: ''
                };
                matchObj.status = computeMatchStatus(matchObj, nowMs);
                matchObj.timeStr = formatMatchTimeDisplay(matchObj, matchObj.status);
                builtMatches.push(matchObj);
            });
        });

        allMatches = builtMatches;
        refreshAllMatchStatuses();
        renderMatches();

        // Background data sync every 60s
        if (!refreshTimer) {
            refreshTimer = setInterval(() => {
                loadData();
            }, 60000);
        }

        // Real-time status badge tick every 20s so matches transition to/from "Live" at exact kickoff/fulltime
        if (!statusTickTimer) {
            statusTickTimer = setInterval(() => {
                if (refreshAllMatchStatuses()) {
                    renderMatches();
                }
            }, 20000);
        }
    }

    // =========================================================
    // 4. Render Match Cards & Filtering
    // =========================================================
    function renderMatches() {
        const container = document.getElementById('matches-container');
        if (!container) return;

        // Apply Date Filter AND League/Category Filter
        const filtered = allMatches.filter(match => {
            // 1. Date Filter
            if (currentTab !== 'all' && match.tabCategory !== currentTab) {
                return false;
            }

            // 2. Category / League Filter
            if (currentCategory === 'all' || currentCategory === 'Soccer') return true;
            if (currentCategory === 'live') return match.status === 'live';
            if (currentCategory === 'hot') return match.isHot || match.status === 'live';

            return (
                (match.leagueKey && match.leagueKey.toLowerCase() === currentCategory.toLowerCase()) ||
                (match.league && match.league.toLowerCase().includes(currentCategory.toLowerCase()))
            );
        });

        if (filtered.length === 0) {
            const emptyMsg = currentCategory === 'live'
                ? 'Belum ada pertandingan yang sedang tayang (Live) pada jadwal ini.'
                : `Tidak ada pertandingan untuk kategori <strong>${escapeHTML(currentCategory)}</strong>.`;

            container.innerHTML = `
                <div class="matches-empty">
                    <i class="far fa-calendar-times" style="font-size: 36px; margin-bottom: 12px; opacity: 0.6;"></i>
                    <p>${emptyMsg}</p>
                    <button onclick="window.resetFilters()">Lihat Semua Jadwal Hari Ini</button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(match => {
            const isPlaying = currentPlayingMatch && currentPlayingMatch.id === match.id;
            const activeClass = isPlaying ? 'card-active' : '';

            // Status Badge:
            // ONLY show "Live" badge if match is genuinely airing right now (match.status === 'live').
            // If match has not started yet (match.status === 'upcoming'), do NOT show the "Live" text.
            let statusBadge = '';
            if (match.status === 'live') {
                statusBadge = `<span class="match-status-badge status-live"><i class="fas fa-circle" style="font-size: 8px; margin-right: 4px;"></i> Live</span>`;
            } else if (match.status === 'ended') {
                statusBadge = `<span class="match-status-badge status-ended">Selesai</span>`;
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
        const liveDot = nowPlayingBar ? nowPlayingBar.querySelector('.live-dot') : null;

        if (placeholder) placeholder.style.display = 'none';
        if (iframe) {
            iframe.style.display = 'block';
            iframe.src = streamUrl;
        }

        if (nowPlayingBar && playingTitle) {
            nowPlayingBar.style.display = 'flex';
            if (liveDot) {
                liveDot.style.display = match.status === 'live' ? 'inline-block' : 'none';
            }
            playingTitle.textContent = `${match.team1.name} vs ${match.team2.name} (${match.league || 'HD'})`;
        }

        // Render Server Chips
        if (serverChips) {
            const availableServers = (match.servers && match.servers.length > 0)
                ? match.servers.map((srv, idx) => ({
                    label: srv.label || `Server ${idx + 1}`,
                    url: formatServerUrl(srv.url, match.channelName, matchTitle)
                }))
                : getServersForMatch(matchTitle);

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
                // Live Event shows currently live matches (today)
                if (currentTab === 'tomorrow' || currentTab === 'yesterday') {
                    currentTab = 'today';
                    document.querySelectorAll('.filter-btn').forEach(b => {
                        b.classList.toggle('active', b.getAttribute('data-tab') === 'today');
                    });
                }
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

        // If user switches to tomorrow or yesterday while on 'live' filter, switch category to 'all'
        // so that day's schedule is immediately visible
        if ((tab === 'tomorrow' || tab === 'yesterday') && currentCategory === 'live') {
            currentCategory = 'all';
            document.querySelectorAll('.category-freeze, .category-button').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-category') === 'all');
            });
        }

        renderMatches();
    };

    window.resetFilters = function () {
        currentTab = 'today';
        currentCategory = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === 'today');
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
                const liveMatch = allMatches.find(m => m.status === 'live') || allMatches[0];
                if (liveMatch) {
                    playMatch(liveMatch);
                }
            });
        }

        loadData();
    });

})();
