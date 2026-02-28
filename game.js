// ============================================
// CONSTANTS AND CONFIGURATION
// ============================================

const CONFIG = {
    COLUMNS: 4,
    TILE_WIDTH: 100,
    TILE_HEIGHT: 100,
    SPAWN_INTERVAL: 0.6, // seconds
    INITIAL_SPEED: 300, // pixels per second
    SPEED_INCREASE: 10, // pixels per second increase over time
    HIT_ZONE_TOLERANCE: 50, // pixels from hit line
    PERFECT_TOLERANCE: 20, // pixels for perfect hit
    COMBO_MULTIPLIER_INCREASE: 5, // combo needed for multiplier increase
};

const GAME_STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
};

// ============================================
// TILE ENTITY CLASS
// ============================================

class Tile {
    constructor(column, speed, container) {
        this.column = column; // 0-3
        this.y = -CONFIG.TILE_HEIGHT; // Start above screen
        this.speed = speed; // pixels per second
        this.active = true;
        this.clicked = false;
        
        // Create DOM element
        this.element = document.createElement('div');
        this.element.className = 'tile';
        this.element.style.left = `${column * CONFIG.TILE_WIDTH}px`;
        this.element.style.width = `${CONFIG.TILE_WIDTH}px`;
        this.element.style.height = `${CONFIG.TILE_HEIGHT}px`;
        this.element.style.transform = `translateY(${this.y}px)`;
        
        container.appendChild(this.element);
        
        // Bind click handler
        this.element.addEventListener('click', () => this.onClick());
    }
    
    /**
     * Update tile position based on delta time
     */
    update(delta) {
        if (!this.active) return;
        
        // Time-based movement (NOT frame-based)
        this.y += this.speed * delta;
        this.element.style.transform = `translateY(${this.y}px)`;
    }
    
    /**
     * Handle tile click
     */
    onClick() {
        if (!this.active || this.clicked) return;
        this.clicked = true;
        
        // Dispatch custom event with hit data
        const event = new CustomEvent('tileClicked', {
            detail: { tile: this, y: this.y }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Mark tile as success (visual feedback)
     */
    markSuccess(isPerfect = false) {
        this.element.classList.add(isPerfect ? 'perfect' : 'success');
    }
    
    /**
     * Remove tile from DOM
     */
    destroy() {
        this.active = false;
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// ============================================
// TILE SYSTEM CLASS
// ============================================

class TileSystem {
    constructor(container, gameAreaHeight, hitLineY) {
        this.container = container;
        this.gameAreaHeight = gameAreaHeight;
        this.hitLineY = hitLineY; // Y position of hit line
        this.tiles = [];
        this.spawnTimer = 0;
        this.currentSpeed = CONFIG.INITIAL_SPEED;
        this.difficulty = 1.0;
    }
    
    /**
     * Spawn a new tile in random column
     */
    spawnTile() {
        const randomColumn = Math.floor(Math.random() * CONFIG.COLUMNS);
        const tile = new Tile(randomColumn, this.currentSpeed, this.container);
        this.tiles.push(tile);
    }
    
    /**
     * Update all tiles and spawn logic
     */
    update(delta) {
        // Update spawn timer
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= CONFIG.SPAWN_INTERVAL) {
            this.spawnTile();
            this.spawnTimer = 0;
        }
        
        // Update all active tiles
        for (let i = this.tiles.length - 1; i >= 0; i--) {
            const tile = this.tiles[i];
            
            if (!tile.active) {
                this.tiles.splice(i, 1);
                continue;
            }
            
            tile.update(delta);
            
            // Check if tile missed (went past bottom)
            if (tile.y > this.gameAreaHeight && !tile.clicked) {
                // Dispatch miss event
                const event = new CustomEvent('tileMissed', {
                    detail: { tile }
                });
                document.dispatchEvent(event);
                
                tile.destroy();
                this.tiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Check if tile is in hit zone
     */
    isInHitZone(tileY) {
        const tileCenter = tileY + CONFIG.TILE_HEIGHT / 2;
        const distance = Math.abs(tileCenter - this.hitLineY);
        return distance <= CONFIG.HIT_ZONE_TOLERANCE;
    }
    
    /**
     * Check if hit is perfect timing
     */
    isPerfectHit(tileY) {
        const tileCenter = tileY + CONFIG.TILE_HEIGHT / 2;
        const distance = Math.abs(tileCenter - this.hitLineY);
        return distance <= CONFIG.PERFECT_TOLERANCE;
    }
    
    /**
     * Increase difficulty over time
     */
    increaseDifficulty(delta) {
        this.difficulty += delta * 0.05; // Gradual increase
        this.currentSpeed = CONFIG.INITIAL_SPEED + (this.difficulty * CONFIG.SPEED_INCREASE);
    }
    
    /**
     * Reset system
     */
    reset() {
        // Destroy all tiles
        this.tiles.forEach(tile => tile.destroy());
        this.tiles = [];
        this.spawnTimer = 0;
        this.currentSpeed = CONFIG.INITIAL_SPEED;
        this.difficulty = 1.0;
    }
}

// ============================================
// GAME STATE MANAGER
// ============================================

class GameStateManager {
    constructor() {
        this.currentState = GAME_STATES.MENU;
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.multiplier = 1;
        
        // UI Elements
        this.scoreElement = document.getElementById('score');
        this.comboElement = document.getElementById('combo');
        this.multiplierElement = document.getElementById('multiplier');
        this.startScreen = document.getElementById('start-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.finalScoreElement = document.getElementById('final-score');
        this.bestComboElement = document.getElementById('best-combo');
    }
    
    /**
     * Change game state
     */
    setState(newState) {
        this.currentState = newState;
        
        switch (newState) {
            case GAME_STATES.MENU:
                this.startScreen.classList.remove('hidden');
                this.gameoverScreen.classList.add('hidden');
                break;
                
            case GAME_STATES.PLAYING:
                this.startScreen.classList.add('hidden');
                this.gameoverScreen.classList.add('hidden');
                this.resetScore();
                break;
                
            case GAME_STATES.GAMEOVER:
                this.gameoverScreen.classList.remove('hidden');
                this.finalScoreElement.textContent = this.score;
                this.bestComboElement.textContent = this.bestCombo;
                break;
        }
    }
    
    /**
     * Add score with combo multiplier
     */
    addScore(isPerfect = false) {
        const basePoints = isPerfect ? 150 : 100;
        this.score += basePoints * this.multiplier;
        this.combo++;
        
        // Update best combo
        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }
        
        // Update multiplier based on combo
        this.multiplier = Math.floor(this.combo / CONFIG.COMBO_MULTIPLIER_INCREASE) + 1;
        
        this.updateUI();
    }
    
    /**
     * Reset combo on miss or bad click
     */
    resetCombo() {
        this.combo = 0;
        this.multiplier = 1;
        this.updateUI();
    }
    
    /**
     * Reset all score values
     */
    resetScore() {
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.multiplier = 1;
        this.updateUI();
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.comboElement.textContent = this.combo;
        this.multiplierElement.textContent = `x${this.multiplier}`;
    }
}

// ============================================
// GAME ENGINE CLASS
// ============================================

class GameEngine {
    constructor() {
        this.lastTime = 0;
        this.running = false;
        this.stateManager = new GameStateManager();
        
        // Get game area dimensions
        this.gameArea = document.getElementById('game-area');
        this.gameAreaHeight = this.gameArea.clientHeight;
        
        // Calculate hit line Y position (from top)
        const hitLine = document.getElementById('hit-line');
        const hitLineRect = hitLine.getBoundingClientRect();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        this.hitLineY = hitLineRect.top - gameAreaRect.top;
        
        // Initialize tile system
        this.tilesContainer = document.getElementById('tiles-container');
        this.tileSystem = new TileSystem(
            this.tilesContainer,
            this.gameAreaHeight,
            this.hitLineY
        );
        
        this.setupEventListeners();
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Tile clicked event
        document.addEventListener('tileClicked', (e) => {
            this.handleTileClick(e.detail);
        });
        
        // Tile missed event
        document.addEventListener('tileMissed', (e) => {
            this.handleTileMiss(e.detail);
        });
    }
    
    /**
     * Start the game
     */
    startGame() {
        this.tileSystem.reset();
        this.stateManager.setState(GAME_STATES.PLAYING);
        
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        }
    }
    
    /**
     * Handle tile click
     */
    handleTileClick(detail) {
        if (this.stateManager.currentState !== GAME_STATES.PLAYING) return;
        
        const { tile, y } = detail;
        
        // Check if click is in hit zone
        if (this.tileSystem.isInHitZone(y)) {
            const isPerfect = this.tileSystem.isPerfectHit(y);
            tile.markSuccess(isPerfect);
            this.stateManager.addScore(isPerfect);
            
            // Remove tile after short delay
            setTimeout(() => tile.destroy(), 100);
        } else {
            // Bad timing - game over
            this.gameOver();
        }
    }
    
    /**
     * Handle tile miss
     */
    handleTileMiss(detail) {
        if (this.stateManager.currentState !== GAME_STATES.PLAYING) return;
        
        // Missed tile - game over
        this.gameOver();
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.stateManager.setState(GAME_STATES.GAMEOVER);
    }
    
    /**
     * Main game loop using requestAnimationFrame
     */
    loop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaMs = currentTime - this.lastTime;
        const delta = deltaMs / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update and render
        this.update(delta);
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.loop());
    }
    
    /**
     * Update game logic (only in PLAYING state)
     */
    update(delta) {
        if (this.stateManager.currentState === GAME_STATES.PLAYING) {
            this.tileSystem.update(delta);
            this.tileSystem.increaseDifficulty(delta);
        }
    }
    
    /**
     * Render (visual updates already handled by Tile class transforms)
     */
    render() {
        // All rendering is handled via CSS transforms in Tile.update()
        // This method exists for potential future rendering needs
    }
}

// ============================================
// INITIALIZE GAME
// ============================================

// Start game engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine();
});