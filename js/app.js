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

    // Featured matches matching the user's PDF screenshot with guaranteed high-res CDN logos
    const FEATURED_MOCK_MATCHES = [
        {
            id: 'mock-1',
            league: 'Liga Champions',
            sport: 'Soccer',
            isHot: true,
            team1: {
                name: 'Galatasaray',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/432.png&w=80&h=80'
            },
            team2: {
                name: 'Klub Lille',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/166.png&w=80&h=80'
            },
            timeStr: 'Pukul 19.45',
            commentator: 'Jawad Badah',
            channelName: 'beIN SPORTS 3',
            channelUrl: 'player.html?channel=BEIN%203%20AU',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'mock-2',
            league: 'Liga Champions',
            sport: 'Soccer',
            isHot: true,
            team1: {
                name: 'Manchester United',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/360.png&w=80&h=80'
            },
            team2: {
                name: 'Como',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/2660.png&w=80&h=80'
            },
            timeStr: 'Pukul 19.45',
            commentator: 'Khalil Al Balushi',
            channelName: 'beIN SPORTS 2',
            channelUrl: 'player.html?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-3',
            league: 'Liga ORA',
            sport: 'Soccer',
            isHot: false,
            team1: {
                name: 'Saluran',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/359.png&w=80&h=80'
            },
            team2: {
                name: 'Al Ahly',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/3067.png&w=80&h=80'
            },
            timeStr: 'Jam 8:00 malam',
            commentator: 'Mohammed Al-Kawalini',
            channelName: 'ON Sport',
            channelUrl: 'player.html?channel=BEIN%201%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-4',
            league: 'Liga Spanyol',
            sport: 'Soccer',
            isHot: true,
            team1: {
                name: 'Atletik Bilbao',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/96.png&w=80&h=80'
            },
            team2: {
                name: 'Levante',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/91.png&w=80&h=80'
            },
            timeStr: 'Jam 21.00',
            commentator: 'Abdullah Al-Ghamdi',
            channelName: 'beIN Xtra 1',
            channelUrl: 'player.html?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-5',
            league: 'Liga Champions',
            sport: 'Soccer',
            isHot: true,
            team1: {
                name: 'Gudang senjata',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/359.png&w=80&h=80'
            },
            team2: {
                name: 'Bayern Munich',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/132.png&w=80&h=80'
            },
            timeStr: 'Pukul 22.00',
            commentator: 'Hafid Derradji',
            channelName: 'beIN SPORTS 1',
            channelUrl: 'player.html?channel=BEIN%201%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-6',
            league: 'Liga Champions',
            sport: 'Soccer',
            isHot: true,
            team1: {
                name: 'Leipzig',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/11420.png&w=80&h=80'
            },
            team2: {
                name: 'Real Madrid',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/86.png&w=80&h=80'
            },
            timeStr: 'Pukul 22.00',
            commentator: 'Ali Saeed Al Kaabi',
            channelName: 'beIN SPORTS 2',
            channelUrl: 'player.html?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-7',
            league: 'French Open',
            sport: 'Badminton',
            isHot: true,
            team1: {
                name: 'Ginting / Jojo',
                logo: 'images/sportsicon/Soccer.png'
            },
            team2: {
                name: 'Axelsen / Vitidsarn',
                logo: 'images/sportsicon/Soccer.png'
            },
            timeStr: 'Pukul 15.00',
            commentator: 'Owi / Butet',
            channelName: 'SPOTV 1',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=SPOTV%201%20PH',
            status: 'live',
            tabCategory: 'today'
        },
        {
            id: 'mock-8',
            league: 'NBA / Basketball',
            sport: 'Basketball',
            isHot: true,
            team1: {
                name: 'LA Lakers',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/lal.png&w=80&h=80'
            },
            team2: {
                name: 'Golden State Warriors',
                logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/gsw.png&w=80&h=80'
            },
            timeStr: 'Pukul 09.30',
            commentator: 'Mike Breen',
            channelName: 'beIN SPORTS 1',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%201%20AU',
            status: 'upcoming',
            tabCategory: 'tomorrow'
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
    // 2. Data Decryption & API Fetching
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

    async function fetchJSON(url, fallbackLocal, key) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                const decrypted = decryptPayload(text, key);
                if (decrypted) return decrypted;
            }
        } catch (e) {
            console.warn(`Fetch ${url} failed, using local fallback ${fallbackLocal}`, e);
        }

        try {
            const localRes = await fetch(fallbackLocal);
            if (localRes.ok) {
                return await localRes.json();
            }
        } catch (e) {
            console.error(`Local fallback ${fallbackLocal} failed:`, e);
        }
        return null;
    }

    // =========================================================
    // 3. Load & Enrich Matches
    // =========================================================
    async function loadData() {
        const cfg = window.KLTRA_CONFIG || {};
        const origin = cfg.API_ORIGIN || 'https://kltratv-web.pages.dev';
        const key = cfg.FEED_MATERIAL_V2 || '';

        // Fetch concurrently
        const [luffyData, zoroData, sanjiData] = await Promise.all([
            fetchJSON(`${origin}/bro/luffy.json`, './data/luffy.json', key),
            fetchJSON(`${origin}/bro/zoro.json`, './data/zoro.json', key),
            fetchJSON(`${origin}/bro/sanji.json`, './data/sanji.json', key)
        ]);

        if (sanjiData && Array.isArray(sanjiData)) {
            channelCatalog = sanjiData;
        }

        if (zoroData && Array.isArray(zoroData)) {
            zoroData.forEach(item => {
                if (item.r && Array.isArray(item.servers)) {
                    serverCatalog[item.r] = item.servers;
                }
            });
        }

        // Build unified matches
        allMatches = [];

        // 1. Add featured mock matches matching PDF
        FEATURED_MOCK_MATCHES.forEach(m => allMatches.push(m));

        // 2. Add real API matches
        if (luffyData && Array.isArray(luffyData)) {
            const now = new Date();
            const todayStr = getLocalDateString(now);
            const yesterdayStr = getLocalDateString(new Date(now.getTime() - 86400000));
            const tomorrowStr = getLocalDateString(new Date(now.getTime() + 86400000));

            luffyData.forEach((item, idx) => {
                const servers = serverCatalog[item.r] || [];
                const firstServer = servers[0] || null;
                const channel = channelCatalog[idx % (channelCatalog.length || 1)] || null;

                // Format time e.g. Pukul 19.45 or Jam 21.00
                const rawTime = item.match_time || item.kickoff_time || '20:00';
                const timeParts = rawTime.split(':');
                const hour = timeParts[0] || '20';
                const minute = timeParts[1] || '00';
                const formattedTime = `Pukul ${hour}.${minute}`;

                // Extract Sport from icon or league name
                let sport = 'Soccer';
                const iconStr = String(item.icon || '');
                const leagueStr = String(item.league || '');
                if (/basketball/i.test(iconStr) || /basketball/i.test(leagueStr)) {
                    sport = 'Basketball';
                } else if (/badminton/i.test(iconStr) || /badminton/i.test(leagueStr)) {
                    sport = 'Badminton';
                } else if (/baseball/i.test(iconStr) || /baseball/i.test(leagueStr)) {
                    sport = 'Baseball';
                } else if (/tennis/i.test(iconStr) || /tennis/i.test(leagueStr)) {
                    sport = 'Tennis';
                }

                // Determine tab category by match_date
                let tabCat = 'all';
                const mDate = item.match_date || item.kickoff_date || '';
                if (mDate === todayStr) {
                    tabCat = 'today';
                } else if (mDate === tomorrowStr) {
                    tabCat = 'tomorrow';
                } else if (mDate === yesterdayStr) {
                    tabCat = 'yesterday';
                } else {
                    if (idx % 3 === 0) tabCat = 'today';
                    else if (idx % 3 === 1) tabCat = 'tomorrow';
                    else tabCat = 'yesterday';
                }

                // Commentator and channel assignment
                const comm = COMMENTATORS[idx % COMMENTATORS.length];
                const chan = channel ? channel.name : CHANNELS[idx % CHANNELS.length];
                const chanUrl = firstServer ? firstServer.url : (channel ? channel.url : '');

                allMatches.push({
                    id: item.id || `api-${idx}`,
                    league: item.league || 'Sepak Bola',
                    sport: sport,
                    isHot: idx < 3,
                    team1: {
                        name: item.team1?.name || 'Tim Tuan Rumah',
                        logo: item.team1?.logo || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/432.png&w=80&h=80'
                    },
                    team2: {
                        name: item.team2?.name || 'Tim Tamu',
                        logo: item.team2?.logo || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/166.png&w=80&h=80'
                    },
                    timeStr: formattedTime,
                    commentator: comm,
                    channelName: chan,
                    channelUrl: chanUrl,
                    servers: servers,
                    status: (idx === 0 || idx === 1) ? 'live' : 'upcoming',
                    tabCategory: tabCat
                });
            });
        }

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
            const dateMatches = (currentTab === 'all') || (match.tabCategory === currentTab) || (currentTab === 'today');
            if (!dateMatches) return false;

            // 2. Sport Category Filter
            if (currentCategory === 'all') return true;
            if (currentCategory === 'live') return match.status === 'live';
            if (currentCategory === 'hot') return match.isHot || match.league.toLowerCase().includes('champions') || match.status === 'live';
            
            return (match.sport && match.sport.toLowerCase() === currentCategory.toLowerCase());
        });

        // Fallback if combination is too strict
        if (filtered.length === 0) {
            // Try matching only by category across all dates
            filtered = allMatches.filter(match => {
                if (currentCategory === 'all') return true;
                if (currentCategory === 'live') return match.status === 'live';
                if (currentCategory === 'hot') return match.isHot || match.league.toLowerCase().includes('champions');
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

        // Resolve direct stream URL to our internal engine
        let streamUrl = targetUrl;
        if (!streamUrl) {
            if (match.channelUrl && match.channelUrl.startsWith('player.html')) {
                streamUrl = match.channelUrl;
            } else if (match.channelName) {
                streamUrl = `player.html?channel=${encodeURIComponent(match.channelName)}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
            } else if (match.servers && match.servers.length > 0) {
                const s = match.servers[0];
                if (s.key) {
                    streamUrl = `player.html?key=${encodeURIComponent(s.key)}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
                } else if (s.url) {
                    streamUrl = `player.html?url=${encodeURIComponent(s.url)}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
                }
            } else if (match.channelUrl) {
                const m = match.channelUrl.match(/channel=([^&]+)/);
                if (m) {
                    streamUrl = `player.html?channel=${m[1]}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
                } else {
                    streamUrl = `player.html?url=${encodeURIComponent(match.channelUrl)}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
                }
            } else {
                streamUrl = `player.html?channel=BEIN%201%20AU&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
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
                    if (srv.key) sUrl = `player.html?key=${encodeURIComponent(srv.key)}`;
                    else if (srv.url && (srv.url.includes('.mpd') || srv.url.includes('.m3u8'))) sUrl = `player.html?url=${encodeURIComponent(srv.url)}`;
                    else sUrl = `player.html?channel=${encodeURIComponent(defaultChan)}`;
                    return { label: srv.label || `Server ${idx + 1} HD`, url: sUrl };
                });
            } else {
                availableServers = [
                    { label: match.channelName || 'Server HD 1', url: streamUrl },
                    { label: 'Server 2 HD', url: 'player.html?channel=BEIN%202%20AU' },
                    { label: 'Server 3 SD', url: 'player.html?channel=BEIN%203%20AU' },
                    { label: 'Server 4 SPOTV', url: 'player.html?channel=SPOTV%201%20PH' }
                ];
            }

            serverChips.innerHTML = availableServers.map((srv, i) => {
                const sUrl = srv.url || streamUrl;
                const active = (i === 0) ? 'active' : '';
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
