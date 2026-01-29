/**
 * Thor Endless Runner
 * Developed with HTML5 Canvas and Vanilla JavaScript.
 * 
 * Game Logic Overview:
 * - Game Loop: Controlled via requestAnimationFrame for smooth 60fps rendering.
 * - Entities: Player (Thor), Enemy, and Coin are classes managing their own state.
 * - LevelManager: Handles spawning of enemies and coins using patterns to allow modular difficulty.
 * - Audio: (Optional placeholders included if we add sound later).
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// Set canvas resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Assets
const thorImage = new Image();
thorImage.src = 'assets/thor.png';

// --- CLASSES ---

/**
 * Handles keyboard and touch input.
 * Maps keys (Space, ArrowUp, Z, X) to game actions.
 */
class InputHandler {
    constructor() {
        this.keys = {
            jump: false,
            attack: false
        };

        // Keyboard Events
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = true;
            if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Enter') this.keys.attack = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = false;
            if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Enter') this.keys.attack = false;
        });

        // Touch/Mouse support for mobile UI buttons
        const jumpBtn = document.getElementById('jump-btn');
        const attackBtn = document.getElementById('attack-btn');

        if (jumpBtn) {
            const setJump = (val) => { this.keys.jump = val; };
            // PreventDefault on touchstart prevents mouse emulation double-firing
            jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setJump(true); });
            jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); setJump(false); });
            jumpBtn.addEventListener('mousedown', () => setJump(true));
            jumpBtn.addEventListener('mouseup', () => setJump(false));
        }

        if (attackBtn) {
            const setAttack = (val) => { this.keys.attack = val; };
            attackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setAttack(true); });
            attackBtn.addEventListener('touchend', (e) => { e.preventDefault(); setAttack(false); });
            attackBtn.addEventListener('mousedown', () => setAttack(true));
            attackBtn.addEventListener('mouseup', () => setAttack(false));
        }
    }
}

/**
 * Main Player Class (Thor)
 * Handles physics (gravity, velocity) and state (running, jumping, attacking).
 */
class Thor {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 64;
        this.height = 64;
        this.x = 100;
        // Position on ground (canvas height - player height - floor height)
        this.y = this.gameHeight - this.height - 50;
        this.vy = 0;
        this.weight = 1.2; // Gravity strength
        this.jumpPower = -22;
        this.onGround = true;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.color = 'blue';
    }

    draw(context) {
        // Attack visual cue (Yellow aura effect)
        if (this.isAttacking) {
            context.save();
            context.fillStyle = 'rgba(255, 215, 0, 0.4)';
            context.beginPath();
            context.arc(this.x + this.width / 2 + 10, this.y + this.height / 2, 50, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        if (thorImage.complete && thorImage.naturalWidth > 0) {
            context.drawImage(thorImage, this.x, this.y, this.width, this.height);
        } else {
            // Fallback rectangle if image fails to load
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update(input) {
        const groundLevel = this.gameHeight - this.height - 50;

        // Attack Logic
        if (input.keys.attack && !this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 15; // Attack lasts for 15 frames
            this.color = 'yellow';
        }

        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.color = 'blue';
            }
        }

        // Jump Logic
        if (input.keys.jump && this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }

        // Physics: Apply Velocity and Gravity
        this.y += this.vy;

        if (!this.onGround) {
            this.vy += this.weight;
        } else {
            this.vy = 0;
        }

        // Boundary Check: Prevent falling through floor
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.onGround = true;
        }
    }
}

class Enemy {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 50;
        this.height = 50;
        this.x = this.gameWidth;
        this.y = this.gameHeight - this.height - 50;
        this.speed = 9;
        this.markedForDeletion = false;
        this.color = '#e74c3c'; // Red color
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);

        // Draw simple face
        context.fillStyle = 'black';
        context.fillRect(this.x + 10, this.y + 10, 10, 10);
        context.fillRect(this.x + 30, this.y + 10, 10, 10);

        // Angry Eyebrows for detail
        context.beginPath();
        context.moveTo(this.x + 5, this.y + 5);
        context.lineTo(this.x + 20, this.y + 15);
        context.moveTo(this.x + 45, this.y + 5);
        context.lineTo(this.x + 30, this.y + 15);
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();
    }

    update() {
        this.x -= this.speed;
        // Mark for deletion if off-screen to save memory
        if (this.x < 0 - this.width) this.markedForDeletion = true;
    }
}

class Coin {
    constructor(gameWidth, gameHeight, y) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 30;
        this.height = 30;
        this.x = this.gameWidth;
        this.y = y; // Y position varies (jumpable coins)
        this.speed = 9; // Must match enemy/ground speed
        this.markedForDeletion = false;
    }

    draw(context) {
        context.fillStyle = '#f1c40f'; // Gold
        context.beginPath();
        context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();

        // Dollar sign
        context.fillStyle = 'black';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('$', this.x + this.width / 2, this.y + this.height / 2 + 2);
    }

    update() {
        this.x -= this.speed;
        if (this.x < 0 - this.width) this.markedForDeletion = true;
    }
}

/**
 * Manages Level Generation (Spawning Enemies & Coins).
 * Modular design: easy to add new spawn patterns in `spawnEntity`.
 */
class LevelManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.enemies = [];
        this.coins = [];
        this.timer = 0;
        this.interval = 1200; // Base Spawn Rate (ms)
        this.randomInterval = Math.random() * 800 + 400;
        this.difficultyMultiplier = 1;
    }

    update(deltaTime) {
        if (this.timer > this.interval + this.randomInterval) {
            this.spawnEntity();
            this.timer = 0;
            this.randomInterval = Math.random() * 800 + 400;
            // Slowly increase difficulty (speed)
            this.difficultyMultiplier = Math.min(2, this.difficultyMultiplier + 0.01);
        } else {
            this.timer += deltaTime;
        }

        // Update entities
        this.enemies.forEach(e => e.update());
        this.coins.forEach(c => c.update());

        // Cleanup
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.coins = this.coins.filter(c => !c.markedForDeletion);
    }

    draw(context) {
        this.enemies.forEach(e => e.draw(context));
        this.coins.forEach(c => c.draw(context));
    }

    spawnEntity() {
        // Randomly decide spawn pattern
        const rand = Math.random();

        if (rand < 0.6) {
            // Pattern 1: Ground Enemy
            const enemy = new Enemy(this.gameWidth, this.gameHeight);
            enemy.speed *= this.difficultyMultiplier;
            this.enemies.push(enemy);

            // Chance for high coin
            if (Math.random() > 0.5) {
                this.coins.push(new Coin(this.gameWidth, this.gameHeight, this.gameHeight - 220));
            }
        } else {
            // Pattern 2: Floating Coins (Safe path)
            this.coins.push(new Coin(this.gameWidth, this.gameHeight, this.gameHeight - 150));
            this.coins.push(new Coin(this.gameWidth + 60, this.gameHeight, this.gameHeight - 150));
        }
    }

    reset() {
        this.enemies = [];
        this.coins = [];
        this.timer = 0;
        this.difficultyMultiplier = 1;
    }
}

// --- INITIALIZATION ---

const input = new InputHandler();
const player = new Thor(GAME_WIDTH, GAME_HEIGHT);
const levelManager = new LevelManager(GAME_WIDTH, GAME_HEIGHT);

// Game State
let gameRunning = false;
let score = 0;
let frameCount = 0;
let lastTime = 0;

// UI Elements
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// --- MAIN GAME FUNCTIONS ---

function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    score = 0;
    frameCount = 0;
    scoreElement.innerText = score;

    // Reset Entities
    player.y = GAME_HEIGHT - player.height - 50;
    player.vy = 0;
    player.onGround = true;
    player.isAttacking = false;

    levelManager.reset();

    // UI Updates
    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');

    lastTime = performance.now();
    requestAnimationFrame(animate);
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
}

function checkCollisions() {
    // Enemy Collisions
    levelManager.enemies.forEach(enemy => {
        // Hitbox Calculation (Simple Radius/Distance based)
        const dx = (enemy.x + enemy.width / 2) - (player.x + player.width / 2);
        const dy = (enemy.y + enemy.height / 2) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Sum of radiuses minus some overlap forgiveness
        if (distance < enemy.width / 2 + player.width / 2 - 10) {
            if (player.isAttacking) {
                // Enemy Defeated
                enemy.markedForDeletion = true;
                score += 10;
                scoreElement.innerText = score;
            } else {
                // Game Over
                gameOver();
            }
        }
    });

    // Coin Collisions
    levelManager.coins.forEach(coin => {
        const dx = (coin.x + coin.width / 2) - (player.x + player.width / 2);
        const dy = (coin.y + coin.height / 2) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < coin.width / 2 + player.width / 2) {
            coin.markedForDeletion = true;
            score++;
            scoreElement.innerText = score;
        }
    });
}

function update(deltaTime) {
    if (!gameRunning) return;
    frameCount++;

    player.update(input);
    levelManager.update(deltaTime);
    checkCollisions();

    // Survival points (approx every 1 sec at 60fps)
    if (frameCount % 60 === 0) {
        score++;
        scoreElement.innerText = score;
    }
}

function draw() {
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Sun
    ctx.fillStyle = '#FDB813';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw Ground
    ctx.fillStyle = '#6D4C41'; // Dirt
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    ctx.fillStyle = '#7CB342'; // Grass top
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 10);

    // Draw Moving "Speed Lines" on Ground
    ctx.strokeStyle = '#558B2F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const speed = 9;
    let offset = (frameCount * speed) % 100;
    for (let i = 0; i < GAME_WIDTH + 100; i += 100) {
        ctx.moveTo(i - offset, GAME_HEIGHT - 40);
        ctx.lineTo(i - offset - 30, GAME_HEIGHT);
    }
    ctx.stroke();

    // Draw Game Objects
    levelManager.draw(ctx);
    player.draw(ctx);
}

function animate(currentTime) {
    if (!gameRunning) return;

    // Calculate time difference between frames
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(animate);
}

// Initial Draw (Static Scene)
draw();
