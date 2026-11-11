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
    if (!container) return;
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
        this.speed = 0.06;
        this.animTimer = Math.random() * 100;
        this.state = 'walking';
        this.peckTimer = 0;
    }

    update(dt) {
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
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }
        this.animTimer += dt * 0.005;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const bob = Math.sin(this.animTimer * 3) * 2;
        const walkLegAnim = Math.sin(this.animTimer * 6) * 3;

        // Sombra en el suelo
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); 
        ctx.arc(0, 16, 10, 0, Math.PI * 2); 
        ctx.fill();

        const isRooster = this.data.gender === 'Macho';

        // --- PATITAS DETALLADAS ---
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Pata izquierda
        ctx.beginPath();
        ctx.moveTo(-4, 12);
        ctx.lineTo(-4 + walkLegAnim, 18);
        ctx.lineTo(-7 + walkLegAnim, 20); // Deditos
        ctx.stroke();

        // Pata derecha
        ctx.beginPath();
        ctx.moveTo(4, 12);
        ctx.lineTo(4 - walkLegAnim, 18);
        ctx.lineTo(2 - walkLegAnim, 20); // Deditos
        ctx.stroke();

        if (isRooster) {
            // --- DISEÑO DEL GALLO (Inspirado en el icono) ---
            // Cuerpo cobrizo / marrón rojizo
            ctx.fillStyle = this.data.sick ? '#94a3b8' : '#b45309';
            ctx.strokeStyle = '#2c1810'; 
            ctx.lineWidth = 2;

            ctx.beginPath(); 
            ctx.ellipse(0, bob, 15, 12, 0, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.stroke();

            // Cola elegante y oscura con plumas verdes/negras hacia arriba
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(-12, bob - 2);
            ctx.quadraticCurveTo(-22, bob - 12, -18, bob - 18);
            ctx.quadraticCurveTo(-14, bob - 8, -8, bob - 4);
            ctx.fill();
            ctx.stroke();

            // Ala con detalles
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.ellipse(-2, bob + 2, 8, 5, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Cabeza del gallo
            ctx.fillStyle = '#b45309';
            ctx.beginPath(); 
            ctx.arc(10, -10 + bob, 7, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.stroke();

            // Cresta grande y roja
            ctx.fillStyle = '#e63946';
            ctx.beginPath(); 
            ctx.arc(12, -18 + bob, 5, 0, Math.PI * 2);
            ctx.arc(8, -17 + bob, 4, 0, Math.PI * 2);
            ctx.fill();

            // Barbilla roja debajo del pico
            ctx.beginPath();
            ctx.ellipse(14, -6 + bob, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // --- DISEÑO DE GALLINA (Clásico y limpio) ---
            ctx.fillStyle = this.data.sick ? '#94a3b8' : '#fffdf9';
            ctx.strokeStyle = '#2c1810'; 
            ctx.lineWidth = 2;

            ctx.beginPath(); 
            ctx.ellipse(0, bob, 14, 11, 0, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.stroke();

            // Cabeza de gallina
            ctx.beginPath(); 
            ctx.arc(8, -8 + bob, 7, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.stroke();

            // Cresta pequeña
            ctx.fillStyle = '#e63946';
            ctx.beginPath(); 
            ctx.arc(10, -15 + bob, 3, 0, Math.PI * 2); 
            ctx.fill();
        }

        // Pico común para ambos
        ctx.fillStyle = '#ffb703';
        ctx.beginPath(); 
        ctx.moveTo(14, -8 + bob); 
        ctx.lineTo(19, -6 + bob); 
        ctx.lineTo(14, -4 + bob); 
        ctx.fill();

        // Ojo
        ctx.fillStyle = '#2c1810'; 
        ctx.fillRect(10, -10 + bob, 2, 2);

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

// --- FUNCIÓN DE INICIO DESDE EL MENÚ ---
function startGameSession() {
    playSound('click');
    loadGame();
    
    // Ocultar menú de inicio y mostrar la interfaz de juego
    document.getElementById('main-menu').style.display = 'none';
    const app = document.getElementById('app');
    app.classList.remove('opacity-0');

    // Forzar cálculo de medidas exactas de pantalla
    resizeCanvas();

    if (game.chickens.length === 0) {
        game.chickens.push({
            id: Date.now(), name: 'Clara', breed: 'Leghorn', gender: 'Hembra',
            health: 100, happiness: 100, sick: false, genLay: 55, genRes: 50, layProgress: 0
        });
    }
    syncChickenEntities();
    updateUI();

    // Arrancar bucles
    requestAnimationFrame(gameLoop);
    setInterval(gameTick, 1000);
}

// --- BUCLE DE JUEGO ---
let lastFrameTime = performance.now();
let tickAccumulator = 0;

function gameLoop(now) {
    let dt = now - lastFrameTime;
    if (dt > 100) dt = 16;
    lastFrameTime = now;

    tickAccumulator += dt;
    while (tickAccumulator >= 1000) {
        gameTick();
        tickAccumulator -= 1000;
    }

    updateCanvas(dt);
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
    }

    game.chickens.forEach(c => {
        if (c.health > 0) {
            c.layProgress += (c.genLay / 50);
            if (c.layProgress >= 100) {
                c.layProgress = 0;
                game.eggs.standard++;
                playSound('cluck');
                let ent = chickenEntities.find(e => e.data.id === c.id);
                if (ent) canvasEggs.push({ x: ent.x, y: ent.y + 10, type: 'standard' });
            }
        }
    });

    saveGame();
    updateUI();
}

function updateCanvas(dt) {
    chickenEntities.forEach(e => e.update(dt));
}

function renderCanvas() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);

    // Altura fija segura para el cielo (ej. 150px o 30% de la altura)
    let skyHeight = Math.min(150, height * 0.35);

    // 1. Cielo
    const hour = game.time / 60;
    let skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
    if (hour >= 6 && hour < 18) {
        skyGradient.addColorStop(0, '#8ecae6'); skyGradient.addColorStop(1, '#d8f3dc');
    } else {
        skyGradient.addColorStop(0, '#0d1b2a'); skyGradient.addColorStop(1, '#1b263b');
    }
    ctx.fillStyle = skyGradient; 
    ctx.fillRect(0, 0, width, skyHeight);

    // 2. Pasto (ocupa el resto de la pantalla)
    ctx.fillStyle = '#386641'; 
    ctx.fillRect(0, skyHeight, width, height - skyHeight);

    // 3. Gallinero
    let coopX = width / 2 - 80;
    let coopY = skyHeight - 20;
    ctx.fillStyle = '#4e342e'; 
    ctx.fillRect(coopX, coopY, 160, 90);
    ctx.fillStyle = '#bc6c25';
    ctx.beginPath(); 
    ctx.moveTo(coopX - 15, coopY); 
    ctx.lineTo(width / 2, coopY - 45); 
    ctx.lineTo(coopX + 175, coopY); 
    ctx.fill();
    ctx.fillStyle = '#2c1810'; 
    ctx.fillRect(width / 2 - 18, coopY + 40, 36, 50);

    // 4. Huevos y Gallinas
    canvasEggs.forEach(egg => {
        ctx.fillStyle = '#fffdf9';
        ctx.beginPath(); ctx.ellipse(egg.x, egg.y, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2c1810'; ctx.lineWidth = 1; ctx.stroke();
    });

    chickenEntities.forEach(e => e.draw());
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

    document.getElementById('stock-std').textContent = game.eggs.standard;
    renderChickensList();
    renderSelects();
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
        panel.style.height = '260px';
        btn.textContent = '▲ Ocultar';
    } else {
        panel.style.height = '36px';
        btn.textContent = '▼ Mostrar';
    }
    setTimeout(resizeCanvas, 250);
}

function buyChicken(breedName) {
    if (game.chickens.length >= game.maxChickens) return;
    const p = breedName === 'Leghorn' ? 50 : 80;
    if (game.money < p) return;
    game.money -= p;
    game.chickens.push({
        id: Date.now() + Math.random(),
        name: namesList[Math.floor(Math.random() * namesList.length)],
        breed: breedName,
        gender: Math.random() < 0.3 ? 'Macho' : 'Hembra',
        health: 100, happiness: 100, sick: false,
        genLay: 50, genRes: 50, layProgress: 0
    });
    syncChickenEntities(); playSound('coin'); updateUI();
}

function sellAllEggsMarket() {
    let earned = game.eggs.standard * 10;
    if (earned === 0) return;
    game.money += earned; game.eggs.standard = 0;
    playSound('coin'); updateUI();
}

function renderChickensList() {
    document.getElementById('chickens-list').innerHTML = game.chickens.map(c => `
        <div onclick="inspectChicken(${c.id})" class="bg-white p-2 rounded-xl border shadow-sm cursor-pointer">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-wood-900">${c.name}</span>
                <span class="text-[10px] px-1 py-0.5 rounded ${c.gender === 'Macho' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}">${c.gender === 'Macho' ? '♂️' : '♀️'}</span>
            </div>
            <div class="text-[10px] text-stone-500">${c.breed}</div>
        </div>
    `).join('');
}

let inspectedId = null;
function inspectChicken(id) {
    const c = game.chickens.find(x => x.id === id); if (!c) return;
    inspectedId = id;
    document.getElementById('inspect-name').textContent = c.name;
    document.getElementById('inspect-breed').textContent = `Raza: ${c.breed}`;
    document.getElementById('inspect-inspector-modal')?.classList.remove('hidden');
}
function closeInspector() { document.getElementById('inspector-modal').classList.add('hidden'); }
function sellInspectedChicken() {
    game.chickens = game.chickens.filter(c => c.id !== inspectedId);
    syncChickenEntities(); closeInspector(); playSound('coin'); game.money += 40; updateUI();
}

function renderSelects() {
    document.getElementById('select-mother').innerHTML = '<option value="">Madre...</option>' + game.chickens.filter(c => c.gender === 'Hembra').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('select-father').innerHTML = '<option value="">Padre...</option>' + game.chickens.filter(c => c.gender === 'Macho').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function breedChickens() {
    const mId = document.getElementById('select-mother').value;
    const fId = document.getElementById('select-father').value;
    if (!mId || !fId || game.money < 30 || game.chickens.length >= game.maxChickens) return;
    game.money -= 30;
    game.chickens.push({
        id: Date.now(), name: namesList[Math.floor(Math.random() * namesList.length)],
        breed: 'Híbrida', gender: Math.random() < 0.5 ? 'Hembra' : 'Macho',
        health: 100, happiness: 100, sick: false, genLay: 60, genRes: 60, layProgress: 0
    });
    syncChickenEntities(); playSound('coin'); updateUI();
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
