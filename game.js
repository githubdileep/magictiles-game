// ============================================
// MAGIC TILES GAME - Complete Implementation
// ============================================

// Game Configuration
const CONFIG = {
    tileHeight: 100,
    columnWidth: 112.5,
    hitZone: 100,
    perfectZone: 45,
    perfectThreshold: 22.5, // perfectZone / 2
    hitThreshold: 50, // hitZone / 2
    speedIncreaseInterval: 60000, // 1 minute in milliseconds
    difficulties: {
        easy: { speed: 2, spawnInterval: 1200 },
        normal: { speed: 3.5, spawnInterval: 900 },
        hard: { speed: 5, spawnInterval: 700 }
    },
    scoring: {
        perfect: 100,
        good: 50,
        miss: -20,
        perfectBonus: 50
    }
};

// Game State
const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 0,
    multiplier: 1,
    highScore: 0,
    difficulty: 'normal',
    tiles: [],
    stats: {
        totalHits: 0,
        perfectHits: 0,
        goodHits: 0,
        missedTiles: 0,
        bestCombo: 0
    },
    settings: {
        musicVolume: 50,
        sfxVolume: 70,
        particlesEnabled: true,
        screenShakeEnabled: true
    },
    lastSpawnTime: 0,
    gameSpeed: 1,
    animationId: null
};

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),
    gameArea: document.getElementById('game-area'),
    tilesContainer: document.getElementById('tiles-container'),
    columns: document.querySelectorAll('.column'),
    
    // Scores and stats
    scoreDisplay: document.getElementById('score'),
    comboDisplay: document.getElementById('combo'),
    multiplierDisplay: document.getElementById('multiplier'),
    highScoreDisplay: document.getElementById('high-score'),
    accuracyDisplay: document.getElementById('accuracy'),
    perfectCountDisplay: document.getElementById('perfect-count'),
    speedLevelDisplay: document.getElementById('speed-level'),
    
    // Buttons
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resumeBtn: document.getElementById('resume-btn'),
    quitBtn: document.getElementById('quit-btn'),
    restartBtn: document.getElementById('restart-btn'),
    menuBtn: document.getElementById('menu-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    closeSettingsBtn: document.getElementById('close-settings'),
    muteBtn: document.getElementById('mute-btn'),
    
    // Difficulty buttons
    difficultyBtns: document.querySelectorAll('.difficulty-btn'),
    
    // Settings
    musicVolumeSlider: document.getElementById('music-volume'),
    sfxVolumeSlider: document.getElementById('sfx-volume'),
    musicVolumeValue: document.getElementById('music-volume-value'),
    sfxVolumeValue: document.getElementById('sfx-volume-value'),
    particlesToggle: document.getElementById('particles-toggle'),
    screenShakeToggle: document.getElementById('screen-shake-toggle'),
    
    // Other
    streakIndicator: document.getElementById('streak-indicator'),
    achievementNotification: document.getElementById('achievement-notification'),
    particlesCanvas: document.getElementById('particles-canvas'),
    gameContainer: document.getElementById('game-container')
};

// Particle System
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles(x, y, color, count = 20) {
        if (!gameState.settings.particlesEnabled) return;
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1,
                decay: 0.02,
                size: Math.random() * 4 + 2,
                color
            });
        }
    }
    
    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= p.decay;
            
            if (p.life > 0) {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                return true;
            }
            return false;
        });
        
        this.ctx.globalAlpha = 1;
    }
}

const particleSystem = new ParticleSystem(elements.particlesCanvas);

// Sound Functions
function playSound(frequency, type = 'sine', duration = 0.1) {
    if (gameState.settings.sfxVolume === 0) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(gameState.settings.sfxVolume / 100, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error('Audio error:', e);
    }
}

function playPerfectSound() {
    playSound(880, 'sine', 0.15);
    setTimeout(() => playSound(1100, 'sine', 0.1), 50);
}

function playGoodSound() {
    playSound(660, 'sine', 0.12);
}

function playMissSound() {
    playSound(200, 'sawtooth', 0.2);
}

function playComboSound(combo) {
    const frequency = 440 + (combo * 20);
    playSound(Math.min(frequency, 1200), 'triangle', 0.1);
}

// Tile Class
class Tile {
    constructor(column) {
        this.column = column;
        this.x = column * CONFIG.columnWidth;
        this.y = -CONFIG.tileHeight;
        this.element = document.createElement('div');
        this.element.className = 'tile';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.clicked = false;
        this.missed = false;
        
        // Add click handler
        this.element.addEventListener('click', () => this.handleClick());
        
        elements.tilesContainer.appendChild(this.element);
    }
    
    update(deltaTime) {
        if (this.clicked || this.missed) return;
        
        const speed = CONFIG.difficulties[gameState.difficulty].speed * gameState.gameSpeed;
        this.y += speed;
        this.element.style.top = `${this.y}px`;
        
        // Check if missed (passed the hit zone)
        const gameAreaRect = elements.gameArea.getBoundingClientRect();
        const hitLineY = gameAreaRect.height - CONFIG.hitZone;
        
        if (this.y > hitLineY + 50 && !this.clicked) {
            this.missed = true;
            handleMiss();
            this.remove();
        }
    }
    
    handleClick() {
        if (this.clicked || this.missed || !gameState.isPlaying || gameState.isPaused) return;
        
        const gameAreaRect = elements.gameArea.getBoundingClientRect();
        const hitLineY = gameAreaRect.height - CONFIG.hitZone;
        const tileCenter = this.y + CONFIG.tileHeight / 2;
        const distance = Math.abs(tileCenter - hitLineY);
        
        this.clicked = true;
        
        // Check for perfect or good hit
        if (distance < CONFIG.perfectThreshold) {
            this.handlePerfectHit();
        } else if (distance < CONFIG.hitThreshold) {
            this.handleGoodHit();
        } else {
            this.handleMiss();
        }
        
        this.remove();
    }
    
    handlePerfectHit() {
        this.element.classList.add('perfect');
        gameState.stats.perfectHits++;
        gameState.stats.totalHits++;
        
        const points = (CONFIG.scoring.perfect + CONFIG.scoring.perfectBonus) * gameState.multiplier;
        gameState.score += points;
        gameState.combo++;
        
        updateCombo();
        updateScore();
        playPerfectSound();
        
        // Create golden particles
        const rect = this.element.getBoundingClientRect();
        particleSystem.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            '#ffd700',
            30
        );
        
        showFloatingText('+' + points, this.x + CONFIG.columnWidth / 2, this.y, '#ffd700');
    }
    
    handleGoodHit() {
        this.element.classList.add('success');
        gameState.stats.goodHits++;
        gameState.stats.totalHits++;
        
        const points = CONFIG.scoring.good * gameState.multiplier;
        gameState.score += points;
        gameState.combo++;
        
        updateCombo();
        updateScore();
        playGoodSound();
        
        // Create blue particles
        const rect = this.element.getBoundingClientRect();
        particleSystem.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            '#00d4ff',
            20
        );
        
        showFloatingText('+' + points, this.x + CONFIG.columnWidth / 2, this.y, '#00d4ff');
    }
    
    handleMiss() {
        gameState.score = Math.max(0, gameState.score + CONFIG.scoring.miss);
        gameState.combo = 0;
        gameState.multiplier = 1;
        
        updateScore();
        updateCombo();
        playMissSound();
        
        if (gameState.settings.screenShakeEnabled) {
            elements.gameContainer.classList.add('shake');
            setTimeout(() => elements.gameContainer.classList.remove('shake'), 500);
        }
    }
    
    remove() {
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.remove();
            }
        }, 300);
    }
}

// Floating Text
function showFloatingText(text, x, y, color) {
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.style.position = 'absolute';
    floatingText.style.left = `${x}px`;
    floatingText.style.top = `${y}px`;
    floatingText.style.color = color;
    floatingText.style.fontSize = '24px';
    floatingText.style.fontWeight = 'bold';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.zIndex = '100';
    floatingText.style.textShadow = `0 0 10px ${color}`;
    floatingText.style.animation = 'floatUp 1s ease-out forwards';
    
    elements.gameArea.appendChild(floatingText);
    
    setTimeout(() => floatingText.remove(), 1000);
}

// Add CSS for floating text animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        from {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        to {
            transform: translateY(-50px) scale(1.2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Game Functions
function initGame() {
    // Load high score with error handling
    try {
        gameState.highScore = parseInt(localStorage.getItem('magicTilesHighScore')) || 0;
        elements.highScoreDisplay.textContent = gameState.highScore;
        
        // Load settings
        const savedSettings = localStorage.getItem('magicTilesSettings');
        if (savedSettings) {
            gameState.settings = { ...gameState.settings, ...JSON.parse(savedSettings) };
            applySettings();
        }
    } catch (e) {
        console.warn('localStorage not available:', e);
        // Continue with default values
    }
}

function startGame() {
    // Hide start screen
    elements.startScreen.classList.add('hidden');
    
    // Reset game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.multiplier = 1;
    gameState.gameSpeed = 1.0;
    gameState.tiles = [];
    gameState.lastSpawnTime = 0;
    gameState.stats = {
        totalHits: 0,
        perfectHits: 0,
        goodHits: 0,
        missedTiles: 0,
        bestCombo: 0
    };
    
    // Clear tiles
    elements.tilesContainer.innerHTML = '';
    
    // Update displays
    updateScore();
    updateCombo();
    updateStats();
    
    // Start game loop
    gameLoop();
}

function gameLoop(timestamp = 0) {
    if (!gameState.isPlaying) return;
    
    if (gameState.isPaused) {
        gameState.animationId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // Spawn tiles
    if (timestamp - gameState.lastSpawnTime > CONFIG.difficulties[gameState.difficulty].spawnInterval) {
        spawnTile();
        gameState.lastSpawnTime = timestamp;
    }
    
    // Update tiles
    gameState.tiles.forEach(tile => tile.update());
    gameState.tiles = gameState.tiles.filter(tile => !tile.missed && !tile.clicked);
    
    // Update particles
    particleSystem.update();
    
    // Increase speed over time (1.0x to 2.0x over 1 minute)
    gameState.gameSpeed = Math.min(2.0, 1.0 + (timestamp / CONFIG.speedIncreaseInterval));
    elements.speedLevelDisplay.textContent = gameState.gameSpeed.toFixed(1) + 'x';
    
    // Update stats
    updateStats();
    
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function spawnTile() {
    const column = Math.floor(Math.random() * 4);
    const tile = new Tile(column);
    gameState.tiles.push(tile);
}

function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    gameState.isPaused = true;
    elements.pauseScreen.classList.remove('hidden');
    document.getElementById('pause-score').textContent = gameState.score;
}

function resumeGame() {
    gameState.isPaused = false;
    elements.pauseScreen.classList.add('hidden');
}

function quitToMenu() {
    endGame();
    elements.gameoverScreen.classList.add('hidden');
    elements.pauseScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
}

function endGame() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
    
    // Update high score with error handling
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        try {
            localStorage.setItem('magicTilesHighScore', gameState.highScore);
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
        elements.highScoreDisplay.textContent = gameState.highScore;
        document.getElementById('new-high-score').classList.remove('hidden');
    } else {
        document.getElementById('new-high-score').classList.add('hidden');
    }
    
    // Show game over screen
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('best-combo').textContent = gameState.stats.bestCombo;
    document.getElementById('final-accuracy').textContent = calculateAccuracy() + '%';
    document.getElementById('final-perfect').textContent = gameState.stats.perfectHits;
    
    elements.gameoverScreen.classList.remove('hidden');
}

function updateScore() {
    elements.scoreDisplay.textContent = gameState.score;
}

function updateCombo() {
    elements.comboDisplay.textContent = gameState.combo;
    
    // Update multiplier based on combo
    if (gameState.combo >= 50) {
        gameState.multiplier = 4;
    } else if (gameState.combo >= 30) {
        gameState.multiplier = 3;
    } else if (gameState.combo >= 10) {
        gameState.multiplier = 2;
    } else {
        gameState.multiplier = 1;
    }
    
    elements.multiplierDisplay.textContent = 'x' + gameState.multiplier;
    
    // Update best combo
    if (gameState.combo > gameState.stats.bestCombo) {
        gameState.stats.bestCombo = gameState.combo;
    }
    
    // Show streak indicator
    if (gameState.combo > 0 && gameState.combo % 10 === 0) {
        showStreakIndicator();
        playComboSound(gameState.combo);
    }
}

function updateStats() {
    elements.accuracyDisplay.textContent = calculateAccuracy() + '%';
    elements.perfectCountDisplay.textContent = gameState.stats.perfectHits;
}

function calculateAccuracy() {
    const total = gameState.stats.totalHits + gameState.stats.missedTiles;
    if (total === 0) return 100;
    return Math.round((gameState.stats.totalHits / total) * 100);
}

function showStreakIndicator() {
    elements.streakIndicator.classList.remove('hidden');
    document.getElementById('streak-text').textContent = `🔥 ${gameState.combo} STREAK!`;
    
    setTimeout(() => {
        elements.streakIndicator.classList.add('hidden');
    }, 1000);
}

function handleMiss() {
    gameState.stats.missedTiles++;
    gameState.combo = 0;
    gameState.multiplier = 1;
    updateCombo();
}

// Column Click Handlers
elements.columns.forEach((column, index) => {
    column.addEventListener('click', () => {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        // Find if there's a tile in this column near the hit zone
        const gameAreaRect = elements.gameArea.getBoundingClientRect();
        const hitLineY = gameAreaRect.height - CONFIG.hitZone;
        
        const clickedTile = gameState.tiles.find(tile => 
            tile.column === index && 
            !tile.clicked && 
            !tile.missed &&
            Math.abs(tile.y + CONFIG.tileHeight / 2 - hitLineY) < CONFIG.hitZone
        );
        
        if (clickedTile) {
            clickedTile.handleClick();
        } else {
            // Clicked empty space - penalty
            handleMiss();
            playMissSound();
        }
    });
});

// Event Listeners
elements.startBtn.addEventListener('click', startGame);
elements.pauseBtn.addEventListener('click', pauseGame);
elements.resumeBtn.addEventListener('click', resumeGame);
elements.quitBtn.addEventListener('click', quitToMenu);
elements.restartBtn.addEventListener('click', () => {
    elements.gameoverScreen.classList.add('hidden');
    startGame();
});
elements.menuBtn.addEventListener('click', quitToMenu);

// Difficulty Selection
elements.difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.difficulty = btn.dataset.difficulty;
    });
});

// Settings
elements.settingsBtn.addEventListener('click', () => {
    if (gameState.isPlaying && !gameState.isPaused) {
        pauseGame();
    }
    elements.settingsScreen.classList.remove('hidden');
});

elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsScreen.classList.add('hidden');
    saveSettings();
});

elements.musicVolumeSlider.addEventListener('input', (e) => {
    gameState.settings.musicVolume = parseInt(e.target.value);
    elements.musicVolumeValue.textContent = gameState.settings.musicVolume + '%';
});

elements.sfxVolumeSlider.addEventListener('input', (e) => {
    gameState.settings.sfxVolume = parseInt(e.target.value);
    elements.sfxVolumeValue.textContent = gameState.settings.sfxVolume + '%';
    playGoodSound(); // Preview sound
});

elements.particlesToggle.addEventListener('change', (e) => {
    gameState.settings.particlesEnabled = e.target.checked;
});

elements.screenShakeToggle.addEventListener('change', (e) => {
    gameState.settings.screenShakeEnabled = e.target.checked;
});

elements.muteBtn.addEventListener('click', () => {
    if (gameState.settings.sfxVolume > 0) {
        gameState.settings.sfxVolume = 0;
        elements.muteBtn.textContent = '🔇';
    } else {
        gameState.settings.sfxVolume = 70;
        elements.muteBtn.textContent = '🔊';
    }
    elements.sfxVolumeSlider.value = gameState.settings.sfxVolume;
    elements.sfxVolumeValue.textContent = gameState.settings.sfxVolume + '%';
});

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (gameState.isPlaying && !gameState.isPaused) {
            pauseGame();
        } else if (gameState.isPaused) {
            resumeGame();
        }
    }
    
    if (e.key === 'Escape') {
        if (elements.settingsScreen.classList.contains('hidden') === false) {
            elements.settingsScreen.classList.add('hidden');
        } else if (gameState.isPlaying) {
            pauseGame();
        }
    }
    
    // Column keyboard controls (1, 2, 3, 4 or D, F, J, K)
    const keyMap = {
        '1': 0, 'd': 0, 'D': 0,
        '2': 1, 'f': 1, 'F': 1,
        '3': 2, 'j': 2, 'J': 2,
        '4': 3, 'k': 3, 'K': 3
    };
    
    if (keyMap[e.key] !== undefined && gameState.isPlaying && !gameState.isPaused) {
        const column = keyMap[e.key];
        elements.columns[column].click();
    }
});

function saveSettings() {
    try {
        localStorage.setItem('magicTilesSettings', JSON.stringify(gameState.settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

function applySettings() {
    elements.musicVolumeSlider.value = gameState.settings.musicVolume;
    elements.sfxVolumeSlider.value = gameState.settings.sfxVolume;
    elements.musicVolumeValue.textContent = gameState.settings.musicVolume + '%';
    elements.sfxVolumeValue.textContent = gameState.settings.sfxVolume + '%';
    elements.particlesToggle.checked = gameState.settings.particlesEnabled;
    elements.screenShakeToggle.checked = gameState.settings.screenShakeEnabled;
}

// Initialize game on load
initGame();
