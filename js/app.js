/**
 * KusoTV - Modern Sports Portal Application Logic
 * Supports Light & Dark Themes, Sports Category Filtering, Date Filtering, Live API Sync & Streaming
 */

(function () {
    'use strict';

    // State
    let allMatches = [];
    let serverCatalog = {}; // r -> servers array
    let channelCatalog = [];
    let currentTab = 'today'; // 'today', 'tomorrow', 'yesterday', 'all'
    let currentCategory = 'all'; // 'all', 'live', 'hot', 'Soccer', 'Basketball', 'Badminton', 'Baseball', 'Tennis'
    let currentPlayingMatch = null;
    let currentPlayingServerUrl = null;

    // Indonesian commentators for enrichment (matching user screenshot)
    const COMMENTATORS = [
        'Jawad Badah',
        'Khalil Al Balushi',
        'Mohammed Al-Kawalini',
        'Abdullah Al-Ghamdi',
        'Hafid Derradji',
        'Ali Saeed Al Kaabi',
        'Faris Awad',
        'Issam Chaouali',
        'Rauf Khalif',
        'Ahmed Al-Tayeb'
    ];

    const CHANNELS = [
        'beIN SPORTS 1',
        'beIN SPORTS 2',
        'beIN SPORTS 3',
        'beIN Xtra 1',
        'ON Sport',
        'SPOTV 1',
        'SPOTV 2',
        'TNT Sports 1'
    ];

    // 24/7 Live Sports TV Channels with guaranteed high-availability streams
    const FEATURED_SPORTS_CHANNELS = [
        {
            id: 'tv-bein1',
            league: 'beIN SPORTS 1 HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'beIN SPORTS 1', logo: 'https://www.visionplus.id/images/repository/771/198771-LOGO-l.png' },
            team2: { name: 'Sepak Bola & Olahraga HD', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Sepak Bola Dunia & Liga Eropa',
            channelName: 'BEIN 1 AU',
            channelUrl: 'player.html?channel=BEIN%201%20AU',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-bein2',
            league: 'beIN SPORTS 2 HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'beIN SPORTS 2', logo: 'https://www.visionplus.id/images/repository/771/198771-LOGO-l.png' },
            team2: { name: 'Liga Spanyol & Liga Italia', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Sepak Bola Eropa & LaLiga',
            channelName: 'BEIN 2 AU',
            channelUrl: 'player.html?channel=BEIN%202%20AU',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-bein3',
            league: 'beIN SPORTS 3 HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'beIN SPORTS 3', logo: 'https://www.visionplus.id/images/repository/771/198771-LOGO-l.png' },
            team2: { name: 'Liga Champions & Formula 1', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'UCL & Motorsport Dunia',
            channelName: 'BEIN 3 AU',
            channelUrl: 'player.html?channel=BEIN%203%20AU',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-spotv1',
            league: 'SPOTV 1 HD',
            sport: 'Badminton',
            isHot: true,
            team1: { name: 'SPOTV 1', logo: 'https://www.visionplus.id/images/repository/771/198771-LOGO-l.png' },
            team2: { name: 'MotoGP & BWF Badminton', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'BWF Official & MotoGP HD',
            channelName: 'SPOTV 1 PH',
            channelUrl: 'player.html?channel=SPOTV%201%20PH',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-spotv2',
            league: 'SPOTV 2 HD',
            sport: 'Tennis',
            isHot: true,
            team1: { name: 'SPOTV 2', logo: 'https://www.visionplus.id/images/repository/771/198771-LOGO-l.png' },
            team2: { name: 'Tennis Grand Slam & Superbike', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'WTA / ATP & World Superbike',
            channelName: 'SPOTV 2 PH',
            channelUrl: 'player.html?channel=SPOTV%202%20PH',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-rcti',
            league: 'RCTI HD',
            sport: 'Soccer',
            isHot: true,
            team1: { name: 'RCTI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/RCTI_logo_2015.svg/300px-RCTI_logo_2015.svg.png' },
            team2: { name: 'Timnas Indonesia & Olahraga', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Siaran Nasional Indonesia',
            channelName: 'A RCTI',
            channelUrl: 'player.html?channel=A%20RCTI',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'tv-trans7',
            league: 'TRANS 7 HD',
            sport: 'Soccer',
            isHot: false,
            team1: { name: 'TRANS 7', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Trans7_2013.svg/300px-Trans7_2013.svg.png' },
            team2: { name: 'MotoGP & Ragam Olahraga', logo: 'images/sportsicon/Soccer.png' },
            timeStr: 'Live 24 Jam',
            commentator: 'Siaran Nasional Indonesia',
            channelName: 'A TRANS 7',
            channelUrl: 'player.html?channel=A%20TRANS%207',
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
    // 2. Data Decryption & Local/Remote API Fetching
    // =========================================================
    function decryptPayload(payload, key) {
        const str = String(payload || '').trim();
        if (!str) return null;
        if (str.startsWith('[') || str.startsWith('{')) {
            try { return JSON.parse(str); } catch (e) {}
        }
        try {
            const bin = atob(str);
            const keyBytes = new TextEncoder().encode(key);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
                out[i] = bin.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
            }
            return JSON.parse(new TextDecoder().decode(out));
        } catch (e) {
            console.warn('Decryption fallback error:', e);
            return null;
        }
    }

    async function loadJsonFile(primaryLocal, fallbackLocal, remoteEndpoint, key) {
        // 1. Try primary local file first (fastest, saved data)
        try {
            const res = await fetch(primaryLocal + '?v=' + Date.now());
            if (res.ok) {
                const text = await res.text();
                const data = decryptPayload(text, key);
                if (data) return data;
            }
        } catch (e) {
            console.warn(`Primary local fetch ${primaryLocal} failed:`, e);
        }

        // 2. Try fallback local file
        if (fallbackLocal) {
            try {
                const res = await fetch(fallbackLocal + '?v=' + Date.now());
                if (res.ok) {
                    const text = await res.text();
                    const data = decryptPayload(text, key);
                    if (data) return data;
                }
            } catch (e) {
                console.warn(`Fallback local fetch ${fallbackLocal} failed:`, e);
            }
        }

        // 3. Fallback to remote endpoint if local is missing
        if (remoteEndpoint) {
            const cfg = window.KLTRA_CONFIG || {};
            const origin = cfg.API_ORIGIN || 'https://kltratv-web.pages.dev';
            try {
                const res = await fetch(`${origin}${remoteEndpoint}?v=${Date.now()}`);
                if (res.ok) {
                    const text = await res.text();
                    const decrypted = decryptPayload(text, key);
                    if (decrypted) return decrypted;
                }
            } catch (e) {
                console.warn(`Remote fetch ${remoteEndpoint} failed:`, e);
            }
        }

        return null;
    }

    function formatServerUrl(srvUrl, fallbackChannel, matchTitle) {
        const titleParam = matchTitle ? `&name=${encodeURIComponent(matchTitle)}` : '';
        if (!srvUrl) {
            return `player.html?channel=${encodeURIComponent(fallbackChannel || 'BEIN 1 AU')}${titleParam}`;
        }
        // If srvUrl contains channel query parameter (e.g. kltratv playerhd/playernba)
        const channelMatch = srvUrl.match(/channel=([^&]+)/);
        if (channelMatch) {
            return `player.html?channel=${channelMatch[1]}${titleParam}`;
        }
        // If srvUrl already points to player.html
        if (srvUrl.startsWith('player.html')) {
            return srvUrl;
        }
        // For direct stream URLs (m3u8, mpd, or iframe embed like online878)
        return `player.html?url=${encodeURIComponent(srvUrl)}${titleParam}`;
    }

    // =========================================================
    // 3. Load & Enrich Matches
    // =========================================================
    async function loadData() {
        const cfg = window.KLTRA_CONFIG || {};
        const key = cfg.FEED_MATERIAL_V2 || '';

        // Fetch our saved data first, with remote fallbacks
        const [eventsData, serversData, channelsData] = await Promise.all([
            loadJsonFile('./data/events.json', './data/luffy.json', '/bro/f-82c6a419.json', key),
            loadJsonFile('./data/servers.json', './data/zoro.json', '/bro/f-b4d9037e.json', key),
            loadJsonFile('./data/channels.json', './data/sanji.json', '/bro/f-1e7a5c92.json', key)
        ]);

        if (channelsData && Array.isArray(channelsData)) {
            channelCatalog = channelsData;
        }

        if (serversData && Array.isArray(serversData)) {
            serversData.forEach(item => {
                if (item.r && Array.isArray(item.servers)) {
                    serverCatalog[item.r] = item.servers;
                }
            });
        }

        // Build unified matches
        allMatches = [];

        // 1. Add real matches from saved data
        if (eventsData && Array.isArray(eventsData)) {
            const todayStr = getLocalDateString(new Date());

            eventsData.forEach((item, idx) => {
                const servers = serverCatalog[item.r] || [];

                // Format time e.g. Pukul 06.00
                const rawTime = item.match_time || item.kickoff_time || '20:00';
                const timeParts = rawTime.split(':');
                const hour = timeParts[0] || '20';
                const minute = timeParts[1] || '00';
                const formattedTime = `Pukul ${hour}.${minute}`;

                // Extract Sport from icon, league, or team name
                let sport = 'Soccer';
                const iconStr = String(item.icon || '').toLowerCase();
                const leagueStr = String(item.league || '').toLowerCase();
                const t1 = String(item.team1?.name || '').toLowerCase();
                const t2 = String(item.team2?.name || '').toLowerCase();

                if (leagueStr.includes('motogp') || leagueStr.includes('racing') || iconStr.includes('racing')) {
                    sport = 'Racing';
                } else if (iconStr.includes('badminton') || leagueStr.includes('badminton') || t1.includes('badminton') || t2.includes('badminton')) {
                    sport = 'Badminton';
                } else if (iconStr.includes('baseball') || leagueStr.includes('baseball') || leagueStr.includes('kbo')) {
                    sport = 'Baseball';
                } else if (iconStr.includes('basketball') || leagueStr.includes('basketball') || leagueStr.includes('kbl') || leagueStr.includes('nba')) {
                    sport = 'Basketball';
                } else if (iconStr.includes('tennis') || leagueStr.includes('tennis') || leagueStr.includes('wta') || leagueStr.includes('atp') || leagueStr.includes('open')) {
                    sport = 'Tennis';
                }

                // Clean team names & match titles
                let team1Name = (item.team1?.name || '').trim();
                let team2Name = (item.team2?.name || '').trim();

                if (sport === 'Racing') {
                    if (!team1Name) team1Name = 'MotoGP Australia GP';
                    if (!team2Name) team2Name = item.league || 'Practice / Race';
                } else if (sport === 'Badminton') {
                    if (!team1Name) team1Name = 'French Open Badminton';
                    if (!team2Name || team2Name.toLowerCase() === 'badminton') team2Name = 'Court 1 - 4 HD';
                } else {
                    if (!team1Name) team1Name = 'Babak Penyisihan';
                    if (!team2Name) team2Name = 'Babak Utama';
                }

                // Logos
                const defaultLogo = (sport === 'Baseball' || sport === 'Basketball' || sport === 'Soccer')
                    ? `images/sportsicon/${sport}.png`
                    : 'images/sportsicon/Soccer.png';

                const team1Logo = item.team1?.logo || item.team2?.logo || defaultLogo;
                const team2Logo = item.team2?.logo || team1Logo || defaultLogo;

                // Date comparison for tabs:
                const matchDate = item.match_date || item.kickoff_date || todayStr;
                let tabCat = 'today';
                if (matchDate < todayStr) {
                    tabCat = 'yesterday';
                } else if (matchDate > todayStr) {
                    tabCat = 'tomorrow';
                } else {
                    tabCat = 'today';
                }

                // Status:
                let status = 'live';
                if (tabCat === 'yesterday') {
                    status = 'ended';
                } else if (tabCat === 'tomorrow') {
                    status = 'upcoming';
                } else {
                    status = (servers.length > 0) ? 'live' : 'upcoming';
                }

                const leagueLabel = item.league || `${sport} Tournament`;
                const channelLabel = servers.length > 0 ? (servers[0].label || 'Server HD 1') : 'Live HD Stream';

                allMatches.push({
                    id: item.id || `api-${idx}`,
                    league: leagueLabel,
                    sport: sport,
                    isHot: idx < 5 || status === 'live',
                    team1: {
                        name: team1Name,
                        logo: team1Logo
                    },
                    team2: {
                        name: team2Name,
                        logo: team2Logo
                    },
                    timeStr: formattedTime,
                    commentator: `${sport} Official Broadcast`,
                    channelName: channelLabel,
                    servers: servers,
                    status: status,
                    tabCategory: tabCat
                });
            });
        }

        // 2. Add real 24/7 Live Sports TV Channels
        FEATURED_SPORTS_CHANNELS.forEach(tv => {
            allMatches.push(tv);
            // Also make available in tomorrow tab as continuous 24/7 channel
            allMatches.push({
                ...tv,
                id: `${tv.id}-tmrw`,
                timeStr: 'Besok (Live 24 Jam)',
                tabCategory: 'tomorrow'
            });
        });

        renderMatches();
    }

    function getLocalDateString(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
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

        // Fallback if combination is too strict
        if (filtered.length === 0) {
            // Try matching only by category across all dates
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
                statusBadge = `<span class="match-status-badge status-upcoming">Ini belum dimulai.</span>`;
            }

            return `
                <div class="match-card ${activeClass}" data-id="${match.id}">
                    <!-- Upper: 3 Column Info -->
                    <div class="card-main">
                        <div class="team-left">
                            <img src="${match.team1.logo}" class="team-logo" alt="${escapeHTML(match.team1.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/sportsicon/Soccer.png'">
                            <span class="team-name">${escapeHTML(match.team1.name)}</span>
                        </div>
                        <div class="match-center">
                            <span class="match-time">${escapeHTML(match.timeStr)}</span>
                            ${statusBadge}
                        </div>
                        <div class="team-right">
                            <span class="team-name">${escapeHTML(match.team2.name)}</span>
                            <img src="${match.team2.logo}" class="team-logo" alt="${escapeHTML(match.team2.name)}" loading="lazy" onerror="this.onerror=null; this.src='images/sportsicon/Soccer.png'">
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
    // 5. Video Player Execution
    // =========================================================
    function playMatch(match, targetUrl = null) {
        currentPlayingMatch = match;
        const matchTitle = `${match.team1.name} vs ${match.team2.name}`;

        // Resolve direct stream URL to our internal engine
        let streamUrl = targetUrl;
        if (!streamUrl) {
            // 1. Direct servers from zoro/servers.json (TOP PRIORITY for real matches)
            if (match.servers && match.servers.length > 0) {
                const s = match.servers[0];
                if (s.url) {
                    streamUrl = formatServerUrl(s.url, match.channelName, matchTitle);
                } else if (s.key) {
                    streamUrl = `player.html?key=${encodeURIComponent(s.key)}&name=${encodeURIComponent(matchTitle)}`;
                }
            } 
            // 2. Direct player.html URL (e.g. for TV channels)
            else if (match.channelUrl && match.channelUrl.startsWith('player.html')) {
                streamUrl = match.channelUrl;
            } 
            // 3. Channel Name lookup (e.g. BEIN 1 AU, SPOTV 1 PH)
            else if (match.channelName) {
                streamUrl = formatServerUrl(null, match.channelName, matchTitle);
            } 
            // 4. Fallback default
            else {
                streamUrl = `player.html?channel=BEIN%201%20AU&name=${encodeURIComponent(matchTitle)}`;
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
            playingTitle.textContent = `${match.team1.name} vs ${match.team2.name} (${match.channelName || 'Live'})`;
        }

        // Render Server Chips
        if (serverChips) {
            const defaultChan = match.channelName || 'BEIN 1 AU';
            let availableServers = [];
            if (match.servers && match.servers.length > 0) {
                availableServers = match.servers.map((srv, idx) => {
                    let sUrl = '';
                    if (srv.url) {
                        sUrl = formatServerUrl(srv.url, defaultChan, matchTitle);
                    } else if (srv.key) {
                        sUrl = `player.html?key=${encodeURIComponent(srv.key)}&name=${encodeURIComponent(matchTitle)}`;
                    } else {
                        sUrl = formatServerUrl(null, defaultChan, matchTitle);
                    }
                    return { label: srv.label || `Server ${idx + 1}`, url: sUrl };
                });
            } else if (match.channelName) {
                availableServers = [
                    { label: 'Server 1 HD', url: streamUrl },
                    { label: 'Server 2 HD', url: 'player.html?channel=BEIN%202%20AU' },
                    { label: 'Server 3 SD', url: 'player.html?channel=BEIN%203%20AU' },
                    { label: 'Server 4 SPOTV', url: 'player.html?channel=SPOTV%201%20PH' }
                ];
            } else {
                availableServers = [
                    { label: 'Server 1 HD', url: streamUrl },
                    { label: 'Server 2 HD', url: 'player.html?channel=BEIN%202%20AU' },
                    { label: 'Server 3 SD', url: 'player.html?channel=BEIN%203%20AU' }
                ];
            }

            serverChips.innerHTML = availableServers.map((srv, i) => {
                const sUrl = srv.url || streamUrl;
                const active = (sUrl === streamUrl || (i === 0 && !targetUrl)) ? 'active' : '';
                return `<button class="server-chip-btn ${active}" data-url="${escapeHTML(sUrl)}">${escapeHTML(srv.label || `Server ${i+1}`)}</button>`;
            }).join('');

            // Chip click
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

        // Highlight card
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

        // Freeze Live Event Button
        if (liveBtn) {
            liveBtn.addEventListener('click', () => {
                setCategoryActive(liveBtn, 'live');
            });
        }

        // Category Buttons
        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                setCategoryActive(btn, cat);
            });
        });

        // Scroll Arrows
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
        // Uncheck all
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

    // Helper: Escape HTML
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

        // Placeholder play button click -> play first match
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
