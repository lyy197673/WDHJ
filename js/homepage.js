// ===== Homepage Module =====

const Homepage = {
    _getDefaultHero() {
        return {
            title: 'YY 导航',
            desc: '您的个人导航中心，快速搜索、查看天气和日历，一站直达常用网站',
            badges: [
                { icon: '🔍', text: '多引擎搜索' },
                { icon: '🌤️', text: '实时天气' },
                { icon: '📅', text: '智能日历' },
                { icon: '⚡', text: '快速导航' },
            ]
        };
    },

    _getDefaultTools() {
        return [
            { id: 'image', icon: '🖼️', iconClass: 'image', title: '图片工具', desc: '拼图 · 裁剪 · 压缩 · 转换 · 像素调整 · 水印添加', route: '#/image' },
            { id: 'pdf', icon: '📄', iconClass: 'pdf', title: 'PDF工具', desc: '转换 · 拆分 · 合并 · 压缩', route: '#/pdf' },
            { id: 'ppt', icon: '📊', iconClass: 'ppt', title: 'PPT工具', desc: '拆分 · 转换 · 压缩', route: '#/ppt' },
            { id: 'stamp', icon: '🔏', iconClass: 'stamp', title: '盖章工具', desc: '自定义印章 · 图片/PDF盖章 · 混合模式 · 批量导出', route: '#/stamp' },
            { id: 'beads', icon: '🧶', iconClass: 'beads', title: '拼豆图纸', desc: '图片转拼豆 · Artkal色板 · 自由绘制 · 高清导出', route: '#/beads' },
            { id: 'word', icon: '📝', iconClass: 'word', title: 'Word工具', desc: '图片转Word · Word转图片 · 转PDF', route: '#/word' },
            { id: 'fbx-viewer', icon: '🧊', iconClass: 'fbx', title: 'FBX查看器', desc: '3D模型预览 · 部件编辑 · 动画播放 · 截图导出', route: '#/fbx-viewer' },
        ];
    },

    _getDefaultSites() {
        return {
            title: '推荐网站',
            subtitle: '一些站长在用的宝藏网站，纯免费，放心使用',
            categories: (typeof SITE_LINKS !== 'undefined') ? SITE_LINKS : []
        };
    },

    _loadHero() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.hero) return HOMEPAGE_DATA.hero;
        try {
            const raw = localStorage.getItem('editor_hero');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultHero();
    },

    _loadTools() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.tools) return HOMEPAGE_DATA.tools;
        try {
            const raw = localStorage.getItem('editor_tools');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultTools();
    },

    _loadSites() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.hero) {
            const defaultSites = this._getDefaultSites();
            return {
                title: defaultSites.title,
                subtitle: defaultSites.subtitle,
                categories: (typeof SITE_LINKS !== 'undefined') ? SITE_LINKS : defaultSites.categories
            };
        }
        try {
            const raw = localStorage.getItem('editor_sites');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultSites();
    },

    _loadAnnounce() {
        return null;
    },

    // Search engine configurations
    _searchEngines: {
        baidu: { name: '百度', icon: '🔍', url: 'https://www.baidu.com/s?wd=', placeholder: '百度一下，你就知道' },
        bing: { name: '必应', icon: '🌐', url: 'https://www.bing.com/search?q=', placeholder: '必应搜索' },
        github: { name: 'GitHub', icon: '💻', url: 'https://github.com/search?q=', placeholder: '搜索GitHub仓库和用户' }
    },

    // Search history management
    _getSearchHistory() {
        try { return JSON.parse(localStorage.getItem('yy_search_history') || '[]'); } catch (e) { return []; }
    },

    _addSearchHistory(query, engine) {
        if (!query || !query.trim()) return;
        const history = this._getSearchHistory();
        const entry = { query: query.trim(), engine: engine, timestamp: Date.now() };
        const filtered = history.filter(h => !(h.query === entry.query && h.engine === entry.engine));
        filtered.unshift(entry);
        if (filtered.length > 20) filtered.length = 20;
        localStorage.setItem('yy_search_history', JSON.stringify(filtered));
    },

    _clearSearchHistory() {
        localStorage.removeItem('yy_search_history');
    },

    // Get current time info for greeting
    _getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return { text: '夜深了', icon: '🌙' };
        if (hour < 9) return { text: '早上好', icon: '🌅' };
        if (hour < 12) return { text: '上午好', icon: '☀️' };
        if (hour < 14) return { text: '中午好', icon: '🌞' };
        if (hour < 18) return { text: '下午好', icon: '🌤️' };
        if (hour < 22) return { text: '晚上好', icon: '🌆' };
        return { text: '夜深了', icon: '🌙' };
    },

    // ===== Lunar Calendar =====
    // Lunar calendar data tables (1900-2100)
    _lunarInfo: [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
        0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
        0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
        0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
        0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
        0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
        0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
        0x0d520
    ],

    _tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
    _diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
    _lunarMonthNames: ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'],
    _lunarDayNames: ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
                      '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
                      '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'],

    _lunarYearDays(y) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) { sum += (this._lunarInfo[y - 1900] & i) ? 1 : 0; }
        return sum + this._leapDays(y);
    },

    _leapMonth(y) { return this._lunarInfo[y - 1900] & 0xf; },

    _leapDays(y) {
        if (this._leapMonth(y)) { return (this._lunarInfo[y - 1900] & 0x10000) ? 30 : 29; }
        return 0;
    },

    _monthDays(y, m) {
        return (this._lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
    },

    _solarToLunar(sy, sm, sd) {
        const baseDate = new Date(1900, 0, 31);
        const objDate = new Date(sy, sm - 1, sd);
        let offset = Math.floor((objDate - baseDate) / 86400000);
        let lunarYear = 1900;
        let daysInYear;
        for (; lunarYear < 2101 && offset > 0; lunarYear++) {
            daysInYear = this._lunarYearDays(lunarYear);
            offset -= daysInYear;
        }
        if (offset < 0) { offset += daysInYear; lunarYear--; }
        let leap = this._leapMonth(lunarYear);
        let isLeap = false;
        let lunarMonth = 1;
        let daysInMonth;
        for (; lunarMonth < 13 && offset > 0; lunarMonth++) {
            if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) { --lunarMonth; isLeap = true; daysInMonth = this._leapDays(lunarYear); }
            else { daysInMonth = this._monthDays(lunarYear, lunarMonth); }
            if (isLeap && lunarMonth === (leap + 1)) { isLeap = false; }
            offset -= daysInMonth;
        }
        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
            if (isLeap) { isLeap = false; }
            else { isLeap = true; --lunarMonth; }
        }
        if (offset < 0) { offset += daysInMonth; --lunarMonth; }
        const lunarDay = offset + 1;
        return {
            year: lunarYear,
            month: lunarMonth,
            day: lunarDay,
            isLeap: isLeap,
            ganZhi: this._tianGan[(lunarYear - 4) % 10] + this._diZhi[(lunarYear - 4) % 12],
            monthStr: (isLeap ? '闰' : '') + this._lunarMonthNames[lunarMonth - 1],
            dayStr: this._lunarDayNames[lunarDay - 1]
        };
    },

    // Chinese festivals (solar date)
    _festivals: [
        { month: 1, day: 1, name: '元旦' },
        { month: 2, day: 14, name: '情人节' },
        { month: 3, day: 8, name: '妇女节' },
        { month: 3, day: 12, name: '植树节' },
        { month: 4, day: 1, name: '愚人节' },
        { month: 5, day: 1, name: '劳动节' },
        { month: 5, day: 4, name: '青年节' },
        { month: 6, day: 1, name: '儿童节' },
        { month: 7, day: 1, name: '建党节' },
        { month: 8, day: 1, name: '建军节' },
        { month: 9, day: 10, name: '教师节' },
        { month: 10, day: 1, name: '国庆节' },
        { month: 12, day: 25, name: '圣诞节' },
    ],

    _getLunarFestivals(lunar) {
        const festivals = [];
        if (lunar.month === 1 && lunar.day === 1) festivals.push('春节');
        if (lunar.month === 1 && lunar.day === 15) festivals.push('元宵节');
        if (lunar.month === 5 && lunar.day === 5) festivals.push('端午节');
        if (lunar.month === 7 && lunar.day === 7) festivals.push('七夕');
        if (lunar.month === 7 && lunar.day === 15) festivals.push('中元节');
        if (lunar.month === 8 && lunar.day === 15) festivals.push('中秋节');
        if (lunar.month === 9 && lunar.day === 9) festivals.push('重阳节');
        if (lunar.month === 12 && lunar.day === 30) festivals.push('除夕');
        return festivals;
    },

    _getNextFestival(now) {
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        let minDiff = Infinity;
        let nextFest = null;
        // Check solar festivals
        for (const f of this._festivals) {
            let festDate = new Date(year, f.month - 1, f.day);
            if (festDate < now) festDate = new Date(year + 1, f.month - 1, f.day);
            const diff = Math.ceil((festDate - now) / 86400000);
            if (diff >= 0 && diff < minDiff) { minDiff = diff; nextFest = f.name; }
        }
        // Check lunar festivals (approximate: check this year and next)
        const festivals = ['春节', '元宵节', '端午节', '七夕', '中元节', '中秋节', '重阳节', '除夕'];
        for (let y = year; y <= year + 1; y++) {
            for (let m = 1; m <= 12; m++) {
                for (let d = 1; d <= 30; d++) {
                    try {
                        const lunar = this._solarToLunar(y, m, d);
                        const lunarFests = this._getLunarFestivals(lunar);
                        for (const lf of lunarFests) {
                            const festDate = new Date(y, m - 1, d);
                            const diff = Math.ceil((festDate - now) / 86400000);
                            if (diff >= 0 && diff < minDiff) { minDiff = diff; nextFest = lf; }
                        }
                    } catch (e) { continue; }
                }
            }
        }
        return { name: nextFest || '无', days: minDiff === Infinity ? '--' : minDiff };
    },

    // Render the top info bar (weather + calendar)
    _renderTopBar() {
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];
        const lunar = this._solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const todayFestivals = this._getLunarFestivals(lunar);
        const solarFest = this._festivals.find(f => f.month === now.getMonth() + 1 && f.day === now.getDate());
        if (solarFest) todayFestivals.push(solarFest.name);
        const festivalStr = todayFestivals.length > 0 ? todayFestivals.join(' / ') : '';
        const nextFest = this._getNextFestival(now);

        let festivalHtml = festivalStr ? `<span class="topbar-festival">${festivalStr}</span>` : '';

        return `
            <div class="topbar-left">
                <span class="topbar-weekday">${weekday}</span>
                <span class="topbar-lunar">${lunar.ganZhi}年 ${lunar.monthStr}${lunar.dayStr}</span>
                ${festivalHtml}
                <span class="topbar-next-fest">距${nextFest.name}还有 <strong>${nextFest.days}</strong> 天</span>
            </div>
            <div class="topbar-right" id="weather-widget-topbar">
                <div class="weather-loading-inline"><div class="spinner"></div></div>
            </div>
        `;
    },

    // Fetch with timeout
    _fetchWithTimeout(url, ms = 5000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    },

    // Get user location via IP (multiple fallback APIs for China compatibility)
    async _getUserLocation() {
        // Fallback chain: try multiple APIs, each with timeout
        const apis = [
            {
                name: 'ipinfo',
                url: 'https://ipinfo.io/json',
                parse: (d) => ({ lat: parseFloat(d.loc?.split(',')[0]) || null, lon: parseFloat(d.loc?.split(',')[1]) || null, city: d.city || d.region || '' })
            },
            {
                name: 'ip-api',
                url: 'https://ip-api.com/json/?fields=status,country,regionName,city,lat,lon',
                parse: (d) => ({ lat: d.lat || null, lon: d.lon || null, city: d.city || d.regionName || '' })
            },
            {
                name: 'ipapi',
                url: 'https://ipapi.co/json/',
                parse: (d) => ({ lat: d.latitude || null, lon: d.longitude || null, city: d.city || d.region || '' })
            }
        ];

        for (const api of apis) {
            try {
                const res = await this._fetchWithTimeout(api.url, 4000);
                if (!res.ok) continue;
                const data = await res.json();
                const loc = api.parse(data);
                if (loc.lat && loc.lon) {
                    console.log(`[Weather] Location via ${api.name}: ${loc.city}`);
                    return loc;
                }
            } catch (e) {
                console.warn(`[Weather] ${api.name} failed:`, e.message);
                continue;
            }
        }

        // All APIs failed — use Beijing as default
        console.warn('[Weather] All geo APIs failed, using Beijing default');
        return { lat: 39.9042, lon: 116.4074, city: '北京' };
    },

    // Get weather code description
    _getWeatherInfo(code) {
        const map = {
            0: { icon: '☀️', text: '晴' }, 1: { icon: '🌤️', text: '多云' },
            2: { icon: '⛅', text: '阴' }, 3: { icon: '☁️', text: '阴天' },
            45: { icon: '🌫️', text: '雾' }, 48: { icon: '🌫️', text: '雾凇' },
            51: { icon: '🌦️', text: '小雨' }, 53: { icon: '🌧️', text: '中雨' },
            55: { icon: '🌧️', text: '大雨' }, 56: { icon: '🌧️', text: '冻雨' },
            57: { icon: '🌧️', text: '冻雨' }, 61: { icon: '🌧️', text: '小雨' },
            63: { icon: '🌧️', text: '中雨' }, 65: { icon: '🌧️', text: '大雨' },
            66: { icon: '🌧️', text: '冻雨' }, 67: { icon: '🌧️', text: '冻雨' },
            71: { icon: '🌨️', text: '小雪' }, 73: { icon: '🌨️', text: '中雪' },
            75: { icon: '🌨️', text: '大雪' }, 77: { icon: '🌨️', text: '雪粒' },
            80: { icon: '🌦️', text: '阵雨' }, 81: { icon: '🌧️', text: '中阵雨' },
            82: { icon: '🌧️', text: '暴阵雨' }, 85: { icon: '🌨️', text: '小阵雪' },
            86: { icon: '🌨️', text: '大阵雪' }, 95: { icon: '⛈️', text: '雷暴' },
            96: { icon: '⛈️', text: '雷暴冰雹' }, 99: { icon: '⛈️', text: '雷暴大冰雹' }
        };
        return map[code] || { icon: '🌡️', text: '未知' };
    },

    // Render weather into a container (auto-detect location via IP)
    async _renderWeather(container) {
        try {
            // Step 1: Get user location (with multiple fallbacks)
            const loc = await this._getUserLocation();
            const { lat, lon, city } = loc;

            // Step 2: Get weather from Open-Meteo (free, no key needed)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
            const weatherRes = await this._fetchWithTimeout(weatherUrl, 5000);
            const weatherData = await weatherRes.json();

            if (weatherData && weatherData.current_weather) {
                const temp = Math.round(weatherData.current_weather.temperature);
                const code = weatherData.current_weather.weathercode;
                const wi = this._getWeatherInfo(code);

                container.innerHTML = `
                    <span class="topbar-weather-icon">${wi.icon}</span>
                    <span class="topbar-weather-temp">${temp}°C</span>
                    <span class="topbar-weather-text">${wi.text}</span>
                    ${city ? `<span class="topbar-weather-city">${city}</span>` : ''}
                `;
                return;
            }
        } catch (e) {
            console.warn('[Weather] Failed:', e.message);
        }

        // All failed — show static fallback
        container.innerHTML = `<span class="topbar-weather-icon">🌤️</span><span class="topbar-weather-text">天气暂时不可用</span>`;
    },

    render(container) {
        const hero = this._loadHero();
        const tools = this._loadTools();
        const sites = this._loadSites();
        const greeting = this._getGreeting();
        const searchHistory = this._getSearchHistory();

        const badgesHtml = hero.badges.map(b =>
            `<span class="badge">${b.icon} ${b.text}</span>`
        ).join('');

        container.innerHTML = `
            <!-- Top Info Bar -->
            <div class="topbar" id="topbar">
                <div class="hero-greeting">
                    <span class="greeting-icon">${greeting.icon}</span>
                    <span class="greeting-text">${greeting.text}</span>
                </div>
                <div class="topbar-info" id="topbar-info">
                    ${this._renderTopBar()}
                </div>
            </div>

            <div class="homepage-hero">
                <h2>${hero.title}</h2>
                <p>${hero.desc}</p>
                <div class="homepage-badges">${badgesHtml}</div>
            </div>

            <!-- Search Section -->
            <div class="search-section">
                <div class="search-box">
                    <div class="search-engine-selector">
                        <button class="search-engine-btn active" data-engine="baidu" title="百度搜索">
                            <span class="engine-icon">🔍</span>
                            <span class="engine-name">百度</span>
                        </button>
                        <button class="search-engine-btn" data-engine="bing" title="必应搜索">
                            <span class="engine-icon">🌐</span>
                            <span class="engine-name">必应</span>
                        </button>
                        <button class="search-engine-btn" data-engine="github" title="GitHub搜索">
                            <span class="engine-icon">💻</span>
                            <span class="engine-name">GitHub</span>
                        </button>
                    </div>
                    <div class="search-input-wrapper">
                        <input type="text" id="search-input" class="search-input" placeholder="百度一下，你就知道" autocomplete="off">
                        <button id="search-btn" class="search-btn" title="搜索">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Search History Dropdown -->
                    <div id="search-history-dropdown" class="search-history-dropdown hidden">
                        <div class="search-history-header">
                            <span>搜索历史</span>
                            <button id="clear-history-btn" class="clear-history-btn">清除</button>
                        </div>
                        <div id="search-history-list" class="search-history-list">
                            ${searchHistory.length > 0 ?
                                searchHistory.slice(0, 10).map(item => `
                                    <div class="search-history-item" data-query="${item.query}" data-engine="${item.engine}">
                                        <span class="history-engine">${this._searchEngines[item.engine]?.icon || '🔍'}</span>
                                        <span class="history-query">${item.query}</span>
                                    </div>
                                `).join('') :
                                '<div class="search-history-empty">暂无搜索历史</div>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tools Section -->
            <div class="tools-section">
                <h3 class="section-title">
                    <span class="section-icon">🛠️</span>
                    实用工具
                </h3>
                <div class="tool-grid" id="tool-grid"></div>
            </div>

            <!-- Sites Section -->
            <div id="site-links-section"></div>
        `;

        // Render tool cards
        const grid = document.getElementById('tool-grid');
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.onclick = () => { window.location.hash = tool.route.slice(1); };
            card.innerHTML = `
                <div class="tool-card-icon ${tool.iconClass}">${tool.icon}</div>
                <h3>${tool.title}</h3>
                <p>${tool.desc}</p>
                <div class="tool-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            `;
            grid.appendChild(card);
        });

        // Render recommended sites
        if (sites.categories && sites.categories.length) {
            this._renderSiteLinks(document.getElementById('site-links-section'), sites);
        }

        // Render weather (async, auto-detect location)
        const weatherWidget = document.getElementById('weather-widget-topbar');
        if (weatherWidget) {
            this._renderWeather(weatherWidget);
        }

        // Initialize search functionality
        this._initSearch();
    },

    _initSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const engineButtons = document.querySelectorAll('.search-engine-btn');
        const historyDropdown = document.getElementById('search-history-dropdown');
        const clearHistoryBtn = document.getElementById('clear-history-btn');

        // Load saved engine from localStorage
        let currentEngine = localStorage.getItem('yy_search_engine') || 'baidu';

        // Apply saved engine state
        engineButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.engine === currentEngine);
        });
        searchInput.placeholder = this._searchEngines[currentEngine].placeholder;

        // Engine selector
        engineButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                engineButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentEngine = btn.dataset.engine;
                searchInput.placeholder = this._searchEngines[currentEngine].placeholder;
                localStorage.setItem('yy_search_engine', currentEngine);
            });
        });

        // Search function
        const doSearch = (query) => {
            const q = (query || searchInput.value).trim();
            if (!q) return;
            this._addSearchHistory(q, currentEngine);
            window.open(this._searchEngines[currentEngine].url + encodeURIComponent(q), '_blank');
            searchInput.blur();
        };

        searchBtn.addEventListener('click', () => doSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        searchInput.addEventListener('focus', () => {
            this._refreshHistory();
            historyDropdown.classList.remove('hidden');
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => { historyDropdown.classList.add('hidden'); }, 200);
        });

        clearHistoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this._clearSearchHistory();
            this._refreshHistory();
        });
    },

    _refreshHistory() {
        const historyList = document.getElementById('search-history-list');
        const searchHistory = this._getSearchHistory();

        if (searchHistory.length > 0) {
            historyList.innerHTML = searchHistory.slice(0, 10).map(item => `
                <div class="search-history-item" data-query="${item.query}" data-engine="${item.engine}">
                    <span class="history-engine">${this._searchEngines[item.engine]?.icon || '🔍'}</span>
                    <span class="history-query">${item.query}</span>
                </div>
            `).join('');

            document.querySelectorAll('.search-history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const query = item.dataset.query;
                    const engine = item.dataset.engine;
                    const searchInput = document.getElementById('search-input');
                    searchInput.value = query;
                    document.querySelectorAll('.search-engine-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.engine === engine);
                    });
                    searchInput.placeholder = this._searchEngines[engine].placeholder;
                });
            });
        } else {
            historyList.innerHTML = '<div class="search-history-empty">暂无搜索历史</div>';
        }
    },

    _renderSiteLinks(container, sites) {
        let html = `<div class="site-links-section"><h3 class="site-links-title">${sites.title}</h3><p class="site-links-subtitle">${sites.subtitle}</p>`;

        sites.categories.forEach(group => {
            html += `<div class="site-links-group"><h4 class="site-links-group-title">${group.icon} ${group.category}</h4><div class="site-links-grid">`;
            group.items.forEach(item => {
                html += `
                    <a class="site-link-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
                        <div class="site-link-tooltip">${item.desc}</div>
                        <span class="site-link-icon">${item.icon || '🔗'}</span>
                        <div class="site-link-info">
                            <span class="site-link-name">${item.name}</span>
                            <span class="site-link-desc">${item.desc}</span>
                        </div>
                        <svg class="site-link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                `;
            });
            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }
};