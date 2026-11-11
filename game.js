// --- ESTADO GLOBAL DEL JUEGO ---
let game = {
    money: 500,
    level: 1,
    maxChickens: 5,
    time: 480, // 08:00 AM
    day: 1,
    seasonIndex: 0,
    seasons: [
        { name: '🌸 Primavera', icon: '🌸', color: '#6a994e' },
        { name: '☀️ Verano', icon: '☀️', color: '#386641' },
        { name: '🍁 Otoño', icon: '🍁', color: '#bc6c25' },
        { name: '❄️ Invierno', icon: '❄️', color: '#4a5759' }
    ],
    weather: 'Soleado',
    eggs: { standard: 0, calcium: 0, exotic: 0 },
    prices: { standard: 10, calcium: 22, exotic: 45 },
    diet: 'Estándar',
    medicines: 2,
    structures: { shelter: false, feeder: false, drinker: false },
    upgrades: { fence: false, dog: false },
    trophies: { gold: 0, silver: 0, bronze: 0 },
    chickens: [],
    panelOpen: true
};

const namesList = ['Clara', 'Pepa', 'Coco', 'Blanca', 'Manchitas', 'Roco', 'Tito', 'Grisilda', 'Cenicienta', 'Nugget', 'Pepita', 'Fósforo'];
const breedsList = [
    { name: 'Leghorn', minLay: 40, maxLay: 80, price: 50 },
    { name: 'Rhode Island Red', minLay: 30, maxLay: 60, price: 80 }
];

// --- AUDIO PROCEDURAL ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'coin') {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'click') {
            osc.frequency.setValueAtTime(300, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'cluck') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        }
    } catch (e) {}
}

// --- CANVAS & ENTIDADES ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];
let canvasEggs = [];
let foxes = [];

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);

class ChickenEntity {
    constructor(chickenObj) {
        this.data = chickenObj;
        this.x = Math.random() * (width - 100) + 50;
        this.y = Math.random() * (height - 180) + 120;
        this.targetX = this.x;
        this.targetY = this.y;
        this.speed = 0.6 + Math.random() * 0.4;
        this.animTimer = Math.random() * 100;
        this.state = 'walking';
        this.peckTimer = 0;
    }

    update() {
        const hour = Math.floor(game.time / 60);
        const isNight = hour >= 21 || hour < 6;

        if (isNight) {
            this.targetX = width / 2 + (Math.random() * 80 - 40);
            this.targetY = 130 + (Math.random() * 40 - 20);
            this.state = 'sleeping';
        } else {
            if (Math.random() < 0.01) {
                this.targetX = Math.random() * (width - 120) + 60;
                this.targetY = Math.random() * (height - 200) + 140;
                this.state = Math.random() < 0.4 ? 'pecking' : 'walking';
                if (this.state === 'pecking') this.peckTimer = 60;
            }
        }

        if (this.state === 'pecking') {
            this.peckTimer--;
            if (this.peckTimer <= 0) this.state = 'walking';
        } else {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 2) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        this.animTimer += 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const bob = Math.sin(this.animTimer * 2) * 2;
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.arc(0, 14, 12, 0, Math.PI * 2); ctx.fill();

        const isRooster = this.data.gender === 'Macho';
        ctx.fillStyle = this.data.sick ? '#94a3b8' : (isRooster ? '#d97706' : '#fffdf9');
        ctx.strokeStyle = '#2c1810'; ctx.lineWidth = 2;

        ctx.beginPath(); ctx.ellipse(0, bob, 14, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(8, -8 + bob, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.arc(10, -15 + bob, isRooster ? 5 : 3, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffb703';
        ctx.beginPath(); ctx.moveTo(14, -8 + bob); ctx.lineTo(18, -6 + bob); ctx.lineTo(14, -4 + bob); ctx.fill();

        ctx.fillStyle = '#2c1810'; ctx.fillRect(10, -10 + bob, 2, 2);
        ctx.restore();
    }
}

class FoxEntity {
    constructor() {
        this.x = width + 50;
        this.y = Math.random() * (height - 200) + 120;
        this.speed = game.upgrades.fence ? 0.4 : 0.9;
        this.active = true;
    }
    update() {
        this.x -= this.speed;
        if (game.upgrades.dog && this.x < width / 2 + 100) {
            this.active = false;
            showToast('🐕 ¡Bobby ahuyentó al zorro!', 'success');
        }
        if (this.x < -50) this.active = false;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#c85a17'; ctx.strokeStyle = '#2c1810'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-14, -6, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}

let chickenEntities = [];
function syncChickenEntities() {
    chickenEntities = game.chickens.map(c => {
        let existing = chickenEntities.find(e => e.data.id === c.id);
        return existing ? (existing.data = c, existing) : new ChickenEntity(c);
    });
}

// --- BUCLE DE JUEGO ---
function initGame() {
    loadGame();
    resizeCanvas();
    if (game.chickens.length === 0) {
        game.chickens.push({
            id: Date.now(), name: 'Clara', breed: 'Leghorn', gender: 'Hembra',
            health: 100, happiness: 100, sick: false, genLay: 55, genRes: 50, layProgress: 0
        });
    }
    syncChickenEntities();
    updateUI();
    requestAnimationFrame(gameLoop);
    setInterval(gameTick, 1000);
}

function gameLoop() {
    updateCanvas();
    renderCanvas();
    requestAnimationFrame(gameLoop);
}

function gameTick() {
    game.time += 2;
    if (game.time >= 1440) {
        game.time = 0;
        game.day++;
        if (game.day > 7) {
            game.day = 1;
            game.seasonIndex = (game.seasonIndex + 1) % 4;
        }
        if (game.diet === 'Rica en Calcio' && game.money >= 15) game.money -= 15;
    }

    if (Math.random() < 0.05) {
        const seasonWeather = ['Soleado', 'Soleado', 'Lluvia', 'Nublado'];
        if (game.seasonIndex === 3) seasonWeather.push('Nieve');
        game.weather = seasonWeather[Math.floor(Math.random() * seasonWeather.length)];
    }

    game.chickens.forEach(c => {
        if (c.health > 0) {
            c.layProgress += (c.genLay / 50);
            if (c.layProgress >= 100) {
                c.layProgress = 0;
                let eggType = (game.diet === 'Rica en Calcio' && Math.random() < 0.6) ? 'calcium' : 'standard';
                game.eggs[eggType]++;
                playSound('cluck');
                let ent = chickenEntities.find(e => e.data.id === c.id);
                if (ent) canvasEggs.push({ x: ent.x, y: ent.y + 10, type: eggType });
            }
        }
    });

    if (Math.random() < 0.03 && foxes.length === 0) {
        foxes.push(new FoxEntity());
        playSound('cluck');
    }

    saveGame();
    updateUI();
}

function updateCanvas() {
    if (Math.random() < 0.3) {
        particles.push({
            x: Math.random() * width, y: -10,
            vx: game.weather === 'Lluvia' ? 2 : (Math.random() * 2 - 1),
            vy: game.weather === 'Lluvia' ? 12 : (game.weather === 'Nieve' ? 2 : 1),
            type: game.weather
        });
    }
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; });
    particles = particles.filter(p => p.y < height + 20 && p.x < width + 20);

    chickenEntities.forEach(e => e.update());
    foxes.forEach(f => f.update());
    foxes = foxes.filter(f => f.active);
}

function renderCanvas() {
    ctx.clearRect(0, 0, width, height);

    const hour = game.time / 60;
    let skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (hour >= 6 && hour < 8) {
        skyGradient.addColorStop(0, '#ffb703'); skyGradient.addColorStop(1, '#fb8500');
    } else if (hour >= 8 && hour < 18) {
        skyGradient.addColorStop(0, game.seasonIndex === 3 ? '#90e0ef' : '#8ecae6');
        skyGradient.addColorStop(1, game.seasonIndex === 0 ? '#b7e4c7' : '#d8f3dc');
    } else if (hour >= 18 && hour < 20) {
        skyGradient.addColorStop(0, '#e07a5f'); skyGradient.addColorStop(1, '#f4a261');
    } else {
        skyGradient.addColorStop(0, '#0d1b2a'); skyGradient.addColorStop(1, '#1b263b');
    }
    ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, width, height);

    // Gallinero
    ctx.fillStyle = '#4e342e'; ctx.fillRect(width / 2 - 80, 80, 160, 90);
    ctx.fillStyle = '#bc6c25';
    ctx.beginPath(); ctx.moveTo(width / 2 - 95, 80); ctx.lineTo(width / 2, 35); ctx.lineTo(width / 2 + 95, 80); ctx.fill();
    ctx.fillStyle = '#2c1810'; ctx.fillRect(width / 2 - 18, 120, 36, 50);

    canvasEggs.forEach(egg => {
        ctx.fillStyle = egg.type === 'calcium' ? '#f4a261' : '#fffdf9';
        ctx.beginPath(); ctx.ellipse(egg.x, egg.y, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2c1810'; ctx.lineWidth = 1; ctx.stroke();
    });

    chickenEntities.forEach(e => e.draw());
    foxes.forEach(f => f.draw());
}

// --- UI Y ACCIONES ---
function updateUI() {
    document.getElementById('money-display').textContent = game.money;
    document.getElementById('chickens-count').textContent = game.chickens.length;
    document.getElementById('max-chickens').textContent = game.maxChickens;
    document.getElementById('level-display').textContent = game.level;
    document.getElementById('season-display').textContent = game.seasons[game.seasonIndex].name;

    const h = Math.floor(game.time / 60); const m = game.time % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    const formattedTime = `${formattedH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    document.getElementById('time-display').textContent = formattedTime;
    document.getElementById('time-display-mobile').textContent = formattedTime;
    document.getElementById('time-icon').textContent = (h >= 6 && h < 19) ? '☀️' : '🌙';
    document.getElementById('time-icon-mobile').textContent = (h >= 6 && h < 19) ? '☀️' : '🌙';

    document.getElementById('weather-badge').textContent = (game.weather === 'Soleado' ? '☀️ ' : '🌧️ ') + game.weather;

    document.getElementById('stock-std').textContent = game.eggs.standard;
    document.getElementById('stock-cal').textContent = game.eggs.calcium;
    document.getElementById('stock-exo').textContent = game.eggs.exotic;
    document.getElementById('current-diet').textContent = game.diet;

    renderChickensList();
    renderSelects();
    renderSickList();
}

function switchTab(tabId, event) {
    playSound('click');
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('tab-active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('tab-active');
}

function togglePanel() {
    playSound('click');
    game.panelOpen = !game.panelOpen;
    const panel = document.getElementById('controls-panel');
    const btn = document.getElementById('toggle-btn-text');
    if (game.panelOpen) {
        panel.style.height = '320px';
        btn.textContent = '▲ Ocultar Panel';
    } else {
        panel.style.height = '42px';
        btn.textContent = '▼ Mostrar Panel';
    }
}

function showToast(msg, type = 'success') {
    const logPanel = document.getElementById('log-panel');
    const toast = document.createElement('div');
    toast.className = `toast-animate px-3 py-2 rounded-xl text-xs font-bold shadow-lg border text-white ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'}`;
    toast.textContent = msg;
    logPanel.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function buyChicken(breedName) {
    if (game.chickens.length >= game.maxChickens) return showToast('❌ Gallinero lleno', 'error');
    const p = breedName === 'Leghorn' ? 50 : 80;
    if (game.money < p) return showToast('❌ Dinero insuficiente', 'error');
    game.money -= p;
    game.chickens.push({
        id: Date.now() + Math.random(),
        name: namesList[Math.floor(Math.random() * namesList.length)],
        breed: breedName,
        gender: Math.random() < 0.3 ? 'Macho' : 'Hembra',
        health: 100, happiness: 100, sick: false,
        genLay: Math.floor(Math.random() * 40) + 40,
        genRes: Math.floor(Math.random() * 40) + 40,
        layProgress: 0
    });
    syncChickenEntities(); playSound('coin'); showToast('🐣 ¡Ave adquirida!'); updateUI();
}

function sellAllEggsMarket() {
    let earned = (game.eggs.standard * 10) + (game.eggs.calcium * 22);
    if (earned === 0) return showToast('❌ No hay huevos', 'error');
    game.money += earned; game.eggs = { standard: 0, calcium: 0, exotic: 0 };
    playSound('coin'); showToast(`💰 Vendidos por $${earned}`); updateUI();
}

function renderChickensList() {
    document.getElementById('chickens-list').innerHTML = game.chickens.map(c => `
        <div onclick="inspectChicken(${c.id})" class="bg-white p-2.5 rounded-xl border border-cozy-border shadow-sm cursor-pointer hover:border-cozy-accent transition">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-wood-900">${c.name}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded ${c.gender === 'Macho' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}">${c.gender === 'Macho' ? '♂️' : '♀️'}</span>
            </div>
            <div class="text-[10px] text-stone-500 mb-1">${c.breed}</div>
            <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden"><div class="bg-emerald-500 h-full" style="width: ${c.health}%"></div></div>
        </div>
    `).join('');
}

let inspectedId = null;
function inspectChicken(id) {
    const c = game.chickens.find(x => x.id === id); if (!c) return;
    inspectedId = id;
    document.getElementById('inspect-name').textContent = c.name;
    document.getElementById('inspect-breed').textContent = `Raza: ${c.breed}`;
    document.getElementById('inspect-gender-badge').textContent = c.gender === 'Macho' ? '♂️ Macho' : '♀️ Hembra';
    document.getElementById('inspect-sick').textContent = c.sick ? 'Enferma ❌' : 'Sana ✅';
    document.getElementById('inspect-health-val').textContent = `${c.health}%`;
    document.getElementById('inspect-health-bar').style.width = `${c.health}%`;
    document.getElementById('inspect-gen-lay').textContent = c.genLay;
    document.getElementById('inspect-gen-res').textContent = c.genRes;
    document.getElementById('inspector-modal').classList.remove('hidden');
}
function closeInspector() { document.getElementById('inspector-modal').classList.add('hidden'); }
function sellInspectedChicken() {
    game.chickens = game.chickens.filter(c => c.id !== inspectedId);
    syncChickenEntities(); closeInspector(); playSound('coin'); game.money += 40; updateUI();
}

function renderSelects() {
    document.getElementById('select-mother').innerHTML = '<option value="">Madre...</option>' + game.chickens.filter(c => c.gender === 'Hembra').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('select-father').innerHTML = '<option value="">Padre...</option>' + game.chickens.filter(c => c.gender === 'Macho').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('select-contestant').innerHTML = '<option value="">Ave...</option>' + game.chickens.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function breedChickens() {
    const mId = document.getElementById('select-mother').value;
    const fId = document.getElementById('select-father').value;
    if (!mId || !fId) return showToast('❌ Selecciona padres', 'error');
    if (game.money < 30) return showToast('❌ Necesitas $30', 'error');
    if (game.chickens.length >= game.maxChickens) return showToast('❌ Gallinero lleno', 'error');
    game.money -= 30;
    game.chickens.push({
        id: Date.now(), name: namesList[Math.floor(Math.random() * namesList.length)],
        breed: 'Híbrida', gender: Math.random() < 0.5 ? 'Hembra' : 'Macho',
        health: 100, happiness: 100, sick: false, genLay: 60, genRes: 60, layProgress: 0
    });
    syncChickenEntities(); playSound('coin'); showToast('🐣 ¡Cría incubada!'); updateUI();
}

function enterContest() {
    const cId = document.getElementById('select-contestant').value;
    if (!cId) return showToast('❌ Selecciona ave', 'error');
    if (game.money < 50) return showToast('❌ Necesitas $50', 'error');
    game.money -= 50;
    const c = game.chickens.find(x => x.id == cId);
    document.getElementById('contest-chicken-name').textContent = `${c.name} (${c.breed})`;
    document.getElementById('contest-modal').classList.remove('hidden');
    document.getElementById('contest-close-btn').classList.add('hidden');
    setTimeout(() => {
        game.trophies.gold++; game.money += 150;
        document.getElementById('contest-status').textContent = `¡Medalla de ORO!`;
        document.getElementById('contest-rewards').textContent = `Ganaste $150`;
        document.getElementById('contest-rewards').classList.remove('hidden');
        document.getElementById('contest-close-btn').classList.remove('hidden');
        playSound('coin'); updateUI();
    }, 1500);
}
function closeContestModal() { document.getElementById('contest-modal').classList.add('hidden'); }

function buyStructure(type) {
    if (game.money < 100) return showToast('❌ Dinero insuficiente', 'error');
    game.money -= 100; game.structures[type] = true; playSound('coin'); updateUI();
}
function buyUpgrade(type) {
    if (game.money < 300) return showToast('❌ Dinero insuficiente', 'error');
    game.money -= 300; game.upgrades[type] = true; playSound('coin'); updateUI();
}
function upgradeFarm() {
    if (game.money < 200) return showToast('❌ Dinero insuficiente', 'error');
    game.money -= 200; game.maxChickens += 5; game.level++; playSound('coin'); updateUI();
}
function setDiet(d) { game.diet = d; playSound('click'); updateUI(); }
function buyMedicineBatch() {
    if (game.money < 35) return showToast('❌ Dinero insuficiente', 'error');
    game.money -= 35; game.medicines++; playSound('coin'); updateUI();
}
function renderSickList() {
    let sick = game.chickens.filter(c => c.sick);
    document.getElementById('sick-chickens-list').innerHTML = sick.length === 0 ? `<div class="text-xs text-stone-500 italic text-center p-3">Todo en orden.</div>` : sick.map(c => `
        <div class="bg-white p-2.5 rounded-xl border flex justify-between items-center text-xs">
            <b>${c.name}</b> <button onclick="cureChicken(${c.id})" class="bg-emerald-600 text-white px-2 py-1 rounded">Curar</button>
        </div>
    `).join('');
}
function cureChicken(id) {
    if (game.medicines <= 0) return showToast('❌ Sin medicinas', 'error');
    game.medicines--; const c = game.chickens.find(x => x.id === id); if(c) c.sick = false;
    playSound('coin'); updateUI();
}
function fulfillContract(t) {
    if (game.eggs.standard >= 5) { game.eggs.standard -= 5; game.money += 80; showToast('🍞 Panadería entregada! +$80'); }
    else showToast('❌ Faltan huevos', 'error');
    playSound('coin'); updateUI();
}

// Persistencia
function saveGame() { localStorage.setItem('granja_modular_save', JSON.stringify(game)); }
function loadGame() {
    let s = localStorage.getItem('granja_modular_save');
    if (s) { try { Object.assign(game, JSON.parse(s)); } catch (e) {} }
}
function resetGame() {
    if (confirm('¿Reiniciar partida?')) { localStorage.removeItem('granja_modular_save'); location.reload(); }
}

window.onload = initGame;
