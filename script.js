const App = {
    state: { allChannels: [], currentLang: 'ar', isDark: true },
    translations: {
        ar: { explore: "اكتشف القنوات", news: "أخبار", sports: "رياضة", movies: "أفلام", dz: "جزائري", series: "مسلسلات", kids: "أطفال", app_info: "حول التطبيق", version: "الإصدار", developer: "المطور", prefs: "الإعدادات", dark_mode: "الوضع الداكن", language: "اللغة", cats: "الفئات", favs: "المفضلة", settings: "الإعدادات", fav_list: "قنواتي المفضلة", movie_lib: "مكتبة الأفلام" },
        fr: { explore: "Explorer", news: "Infos", sports: "Sports", movies: "Films", dz: "Algérie", series: "Séries", kids: "Enfants", app_info: "Infos App", version: "Version", developer: "Développeur", prefs: "Réglages", dark_mode: "Mode Sombre", language: "Langue", cats: "Catégories", favs: "Favoris", settings: "Paramètres", fav_list: "Mes Favoris", movie_lib: "Bibliothèque" },
        en: { explore: "Explore", news: "News", sports: "Sports", movies: "Movies", dz: "Algerian", series: "Series", kids: "Kids", app_info: "App Info", version: "Version", developer: "Developer", prefs: "Settings", dark_mode: "Dark Mode", language: "Language", cats: "Categories", favs: "Favorites", settings: "Settings", fav_list: "My Favorites", movie_lib: "Library" }
    },

    init() {
        this.loadData();
        this.applySavedSettings();
        setTimeout(() => {
            const s = document.getElementById('splash-screen');
            if(s) {
                s.style.opacity = '0';
                setTimeout(() => s.style.display = 'none', 800);
            }
        }, 3000);
    },

    loadData() {
        fetch('channels.m3u').then(r => r.text()).then(data => {
            this.state.allChannels = this.parseM3U(data);
            this.render('grid-main', this.state.allChannels.slice(0, 30));
        }).catch(() => console.log("Please create channels.m3u file"));
    },

    parseM3U(data) {
        const lines = data.split('\n');
        let list = [], item = {};
        lines.forEach(l => {
            if (l.startsWith('#EXTINF:')) {
                item.name = l.split(',').pop().trim();
                item.logo = (l.match(/tvg-logo="(.*?)"/) || [])[1] || 'logo.png';
                item.group = (l.match(/group-title="(.*?)"/) || [])[1] || '';
            } else if (l.startsWith('http')) {
                item.url = l.trim();
                if (item.name) list.push({...item});
                item = {};
            }
        });
        return list;
    },

    render(id, list) {
        const container = document.getElementById(id);
        if(!container) return;
        container.innerHTML = list.map(ch => `
            <div class="card" onclick="App.openPlayer('${ch.url}', '${ch.name.replace(/'/g, "\\'")}')">
                <img src="${ch.logo}" onerror="this.src='logo.png'">
                <div class="card-title">${ch.name}</div>
            </div>
        `).join('');
    },

    navigate(event, pageId) {
        document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        event.currentTarget.classList.add('active');
    },

    toggleTheme() {
        this.state.isDark = !this.state.isDark;
        document.body.classList.toggle('light-theme', !this.state.isDark);
        localStorage.setItem('khalil_theme', this.state.isDark ? 'dark' : 'light');
    },

    setLanguage(lang) {
        this.state.currentLang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(this.translations[lang][key]) {
                el.innerText = this.translations[lang][key];
            }
        });
        localStorage.setItem('khalil_lang', lang);
    },

    applySavedSettings() {
        if(localStorage.getItem('khalil_theme') === 'light') this.toggleTheme();
        const lang = localStorage.getItem('khalil_lang') || 'ar';
        this.setLanguage(lang);
        const langSelect = document.getElementById('lang-select');
        if(langSelect) langSelect.value = lang;
    },

    // --- بداية تعديل المشغل الاحترافي الجديد ---
    openPlayer(url, name) {
        document.getElementById('playing-now').innerText = name;
        document.getElementById('player-modal').style.display = 'flex';
        const v = document.getElementById('video-element');
        const loader = document.getElementById('v-loader');
        
        if(loader) loader.style.display = 'block';
        
        if (Hls.isSupported() && url.includes('m3u8')) {
            if(this.hls) this.hls.destroy();
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(v);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => { 
                v.play(); 
                if(loader) loader.style.display = 'none'; 
            });
        } else {
            v.src = url;
            v.oncanplay = () => { 
                v.play(); 
                if(loader) loader.style.display = 'none'; 
            };
        }
    },

    closePlayer() {
        document.getElementById('player-modal').style.display = 'none';
        const v = document.getElementById('video-element');
        v.pause();
        if(this.hls) this.hls.destroy();
    },

    togglePlay() {
        const v = document.getElementById('video-element');
        const icon = document.getElementById('btn-play');
        const mainIcon = document.getElementById('main-icon');
        if(v.paused) { 
            v.play(); 
            if(icon) icon.className = "fa-solid fa-pause";
            if(mainIcon) mainIcon.className = "fa-solid fa-pause";
        } else { 
            v.pause(); 
            if(icon) icon.className = "fa-solid fa-play";
            if(mainIcon) mainIcon.className = "fa-solid fa-play";
        }
    },

    toggleMute() {
        const v = document.getElementById('video-element');
        const icon = document.getElementById('btn-vol');
        v.muted = !v.muted;
        if(icon) icon.className = v.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
    },

    toggleFullscreen() {
        const container = document.getElementById('video-parent');
        if (!document.fullscreenElement) {
            if(container.requestFullscreen) container.requestFullscreen();
        } else {
            if(document.exitFullscreen) document.exitFullscreen();
        }
    },
    // --- نهاية تعديل المشغل الاحترافي الجديد ---

    filter(cat) {
        const filtered = this.state.allChannels.filter(c => 
            (c.group && c.group.includes(cat)) || (c.name && c.name.includes(cat))
        );
        this.render('grid-main', filtered);
    },

    search(query) {
        const res = this.state.allChannels.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase())
        );
        this.render('grid-search', res);
    }
};

App.init();
