/**
 * KusoTV - Modern Sports Portal Application Logic
 * Supports Light & Dark Themes, Date Filtering, Live API Sync & Streaming
 */

(function () {
    'use strict';

    // State
    let allMatches = [];
    let serverCatalog = {}; // r -> servers array
    let channelCatalog = [];
    let currentTab = 'today'; // 'today', 'tomorrow', 'yesterday', 'all'
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

    // Featured matches matching the user's PDF screenshot
    const FEATURED_MOCK_MATCHES = [
        {
            id: 'mock-1',
            league: 'Liga Champions',
            team1: {
                name: 'Galatasaray',
                logo: 'https://s.q5qo.com/data/c181518f9c1b3f9bb8b83921ba89fc28.png'
            },
            team2: {
                name: 'Klub Lille',
                logo: 'https://s.q5qo.com/data/d2f6fb39f6cb00fbfefaa9ff81f1489e.png'
            },
            timeStr: 'Pukul 19.45',
            commentator: 'Jawad Badah',
            channelName: 'beIN SPORTS 3',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%203%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-2',
            league: 'Liga Champions',
            team1: {
                name: 'Manchester United',
                logo: 'https://s.q5qo.com/data/0d8e20295eb1388dc823daeb8b8ef4d3.png'
            },
            team2: {
                name: 'Como',
                logo: 'https://s.q5qo.com/data/b9dfd82fb1f19d08e4ba4f5062c93836.png'
            },
            timeStr: 'Pukul 19.45',
            commentator: 'Khalil Al Balushi',
            channelName: 'beIN SPORTS 2',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-3',
            league: 'Liga ORA',
            team1: {
                name: 'Saluran',
                logo: 'https://s.q5qo.com/data/a51ff6bcaa9033d24b57343771c3f1b7.png'
            },
            team2: {
                name: 'Al Ahly',
                logo: 'https://s.q5qo.com/data/b2245bcf567fa75f11fb613301e81e4c.png'
            },
            timeStr: 'Jam 8:00 malam',
            commentator: 'Mohammed Al-Kawalini',
            channelName: 'ON Sport',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%201%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-4',
            league: 'Liga Spanyol',
            team1: {
                name: 'Atletik Bilbao',
                logo: 'https://s.q5qo.com/data/88983a621b0102d8da25b7b4efa4042d.png'
            },
            team2: {
                name: 'Levante',
                logo: 'https://s.q5qo.com/data/484adf9a6eb1570a9f124b5ea29888c7.png'
            },
            timeStr: 'Jam 21.00',
            commentator: 'Abdullah Al-Ghamdi',
            channelName: 'beIN Xtra 1',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-5',
            league: 'Liga Champions',
            team1: {
                name: 'Gudang senjata',
                logo: 'https://s.q5qo.com/data/7e16250dc775c6366f01b73fe87e59b4.png'
            },
            team2: {
                name: 'Bayern Munich',
                logo: 'https://s.q5qo.com/data/e3515711be29e752b2de714fe4747937.png'
            },
            timeStr: 'Pukul 22.00',
            commentator: 'Hafid Derradji',
            channelName: 'beIN SPORTS 1',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%201%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        },
        {
            id: 'mock-6',
            league: 'Liga Champions',
            team1: {
                name: 'Leipzig',
                logo: 'https://s.q5qo.com/data/3cb5880dc3c1fa816f1c4ee00b8e9063.png'
            },
            team2: {
                name: 'Real Madrid',
                logo: 'https://s.q5qo.com/data/209c13b29c9bb437b0d740eb7a371c6e.png'
            },
            timeStr: 'Pukul 22.00',
            commentator: 'Ali Saeed Al Kaabi',
            channelName: 'beIN SPORTS 2',
            channelUrl: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%202%20AU',
            status: 'upcoming',
            tabCategory: 'today'
        }
    ];

    // =========================================================
    // 1. Theme Management (Light / Dark)
    // =========================================================
    function initTheme() {
        const savedTheme = localStorage.getItem('kusotv_theme');
        const themeToggle = document.getElementById('theme-toggle');
        
        // Default to light theme as in PDF mockup, unless dark was saved
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
                    // Spread across tabs so every tab has rich live matches
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
                    team1: {
                        name: item.team1?.name || 'Tim Tuan Rumah',
                        logo: item.team1?.logo || 'https://s.q5qo.com/data/c181518f9c1b3f9bb8b83921ba89fc28.png'
                    },
                    team2: {
                        name: item.team2?.name || 'Tim Tamu',
                        logo: item.team2?.logo || 'https://s.q5qo.com/data/d2f6fb39f6cb00fbfefaa9ff81f1489e.png'
                    },
                    timeStr: formattedTime,
                    commentator: comm,
                    channelName: chan,
                    channelUrl: chanUrl,
                    servers: servers,
                    status: idx < 2 ? 'live' : 'upcoming', // first two live demo
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

        // Filter based on active tab
        let filtered = [];
        if (currentTab === 'all') {
            filtered = allMatches;
        } else {
            filtered = allMatches.filter(m => m.tabCategory === currentTab || m.tabCategory === 'today');
            // If tab has fewer items, include more to keep view rich
            if (filtered.length === 0) {
                filtered = allMatches;
            }
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="matches-empty">
                    <i class="far fa-calendar-times" style="font-size: 36px; margin-bottom: 12px; opacity: 0.6;"></i>
                    <p>Tidak ada pertandingan yang terjadwal untuk kategori ini.</p>
                    <button onclick="window.switchTab('all')">Lihat Semua Jadwal</button>
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
                            <img src="${match.team1.logo}" class="team-logo" alt="${escapeHTML(match.team1.name)}" loading="lazy" onerror="this.src='https://s.q5qo.com/data/c181518f9c1b3f9bb8b83921ba89fc28.png'">
                            <span class="team-name">${escapeHTML(match.team1.name)}</span>
                        </div>
                        <div class="match-center">
                            <span class="match-time">${escapeHTML(match.timeStr)}</span>
                            ${statusBadge}
                        </div>
                        <div class="team-right">
                            <span class="team-name">${escapeHTML(match.team2.name)}</span>
                            <img src="${match.team2.logo}" class="team-logo" alt="${escapeHTML(match.team2.name)}" loading="lazy" onerror="this.src='https://s.q5qo.com/data/d2f6fb39f6cb00fbfefaa9ff81f1489e.png'">
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

        // Pick URL
        let streamUrl = targetUrl || match.channelUrl;
        if (!streamUrl && match.servers && match.servers.length > 0) {
            streamUrl = match.servers[0].url;
        }

        if (!streamUrl) {
            streamUrl = `player.html?name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
        } else if (!streamUrl.includes('player.html')) {
            streamUrl = `player.html?source=${encodeURIComponent(streamUrl)}&name=${encodeURIComponent(match.team1.name + ' vs ' + match.team2.name)}`;
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
            playingTitle.textContent = `${match.team1.name} vs ${match.team2.name} (${match.channelName})`;
        }

        // Render Server Chips
        if (serverChips) {
            const availableServers = match.servers && match.servers.length > 0 ? match.servers : [
                { label: match.channelName || 'Server HD 1', url: match.channelUrl },
                { label: 'Server 2 HD', url: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%202%20AU' },
                { label: 'Server 3 SD', url: 'https://playerkltra.pages.dev/playerhd?channel=BEIN%203%20AU' }
            ];

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
    // 6. Filter Tabs Click Handlers
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
    // 7. Initialization
    // =========================================================
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
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
