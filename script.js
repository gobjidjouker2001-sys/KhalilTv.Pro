const IPTV_URL = '/.netlify/functions/getM3U'; 
const video = document.getElementById('main-video');
let hls = new Hls();
let allChans = [];

window.onload = () => {
    // إخفاء الـ Splash
    setTimeout(() => {
        const sp = document.getElementById('splash-screen');
        if (sp) { sp.style.opacity = '0'; setTimeout(() => sp.style.display = 'none', 600); }
    }, 3500);

    // تحميل البيانات
    fetch(IPTV_URL)
        .then(r => r.text())
        .then(data => {
            allChans = parseM3U(data);
            // عرض عينة في البداية
            renderGrid(allChans.slice(0, 50), 'channels-grid');
        })
        .catch(e => console.error("Error:", e));
};

function navigate(event, pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function parseM3U(data) {
    const lines = data.split('\n');
    let list = [], item = {};
    lines.forEach(l => {
        if (l.startsWith('#EXTINF:')) {
            item.name = l.split(',').pop().trim();
            item.logo = (l.match(/tvg-logo="(.*?)"/) || [])[1] || "logo.png";
            item.group = (l.match(/group-title="(.*?)"/) || [])[1] || "";
        } else if (l.startsWith('http')) {
            item.url = l.trim();
            if (item.name) list.push({...item});
            item = {};
        }
    });
    return list;
}

function renderGrid(items, gridId) {
    const grid = document.getElementById(gridId);
    if(!grid) return;
    grid.innerHTML = items.map(i =>
        `<div class="card" onclick="openPlayer('${i.url}', '${i.name}')">
            <img src="${i.logo}" onerror="this.src='logo.png'">
            <div style="padding:5px; font-size:11px; white-space: nowrap; overflow: hidden;">${i.name}</div>
        </div>`).join('');
}

function filterByCategory(cat) {
    const filtered = allChans.filter(c => 
        c.group.includes(cat) || c.name.toLowerCase().includes(cat.toLowerCase())
    );
    renderGrid(filtered, 'channels-grid');
}

function searchHandler() {
    const txt = document.getElementById('search-input').value.toLowerCase();
    const res = allChans.filter(c => c.name.toLowerCase().includes(txt));
    renderGrid(res, 'search-grid');
}

function openPlayer(url, title) {
    document.getElementById('video-title').innerText = title;
    document.getElementById('player-overlay').style.display = 'flex';

    if (Hls.isSupported() && (url.includes('m3u8') || url.includes('stream'))) {
        hls.destroy(); hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else {
        video.src = url;
        video.play();
    }
}

function closeVideo() {
    document.getElementById('player-overlay').style.display = 'none';
    video.pause();
    if(hls) hls.destroy();
}

function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    document.querySelector('.setting-btn').innerHTML = isLight ? 
        '<i class="fa-solid fa-sun"></i> الوضع الفاتح' : '<i class="fa-solid fa-moon"></i> الوضع الداكن';
}

function changeLanguage() {
    const lang = document.getElementById('langSelect').value;
    // هنا يمكنك إضافة منطق تغيير النصوص بناءً على اللغة المختار
    alert("اللغة المختارة: " + lang);
}
