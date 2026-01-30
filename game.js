/**
 * Thor Endless Runner V3
 * Features: Slower speed, Platforms, New Enemy Art, Win Condition, Birds, Speed Scaling.
 */

// Game Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const INITIAL_GAME_SPEED = 4.5;

let gameSpeed = INITIAL_GAME_SPEED;

// Assets
const thorImage = new Image();
thorImage.src = 'assets/thor.png';

const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';

const lokiImage = new Image();
lokiImage.src = 'assets/loki.png';

const birdBlueImage = new Image();
birdBlueImage.src = 'assets/bird_blue.png';

const birdWhiteImage = new Image();
birdWhiteImage.src = 'assets/bird_white.png';

// --- CLASSES ---

class InputHandler {
    constructor() {
        this.keys = {
            jump: false,
            attack: false
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = true;
            if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Enter') this.keys.attack = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') this.keys.jump = false;
            if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Enter') this.keys.attack = false;
        });

        // Mobile Controls
        const jumpBtn = document.getElementById('jump-btn');
        const attackBtn = document.getElementById('attack-btn');

        if (jumpBtn) {
            const setJump = (val) => { this.keys.jump = val; };
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

class Thor {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 96;
        this.height = 96;
        this.x = 100;
        this.y = this.gameHeight - this.height - 50;
        this.vy = 0;
        this.weight = 0.8;
        this.jumpPower = -17;
        this.onGround = true;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.color = 'blue';
    }

    draw(context) {
        if (this.isAttacking) {
            context.save();
            context.fillStyle = 'rgba(255, 215, 0, 0.4)';
            context.beginPath();
            context.arc(this.x + this.width / 2 + 10, this.y + this.height / 2, 65, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        if (thorImage.complete && thorImage.naturalWidth > 0) {
            context.drawImage(thorImage, this.x, this.y, this.width, this.height);
        } else {
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update(input, platforms) {
        const groundLevel = this.gameHeight - this.height - 50;

        // Attack
        if (input.keys.attack && !this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 20;
            this.color = 'yellow';
        }

        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.color = 'blue';
            }
        }

        // Jump
        if (input.keys.jump && this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }

        // Physics
        this.y += this.vy;

        if (!this.onGround) {
            this.vy += this.weight;
        } else {
            this.vy = 0;
        }

        // Platform Collisions
        this.onGround = false;

        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.onGround = true;
        } else {
            platforms.forEach(platform => {
                if (this.vy >= 0 &&
                    this.y + this.height <= platform.y + platform.height &&
                    this.y + this.height + this.vy >= platform.y &&
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            });
        }
    }
}

class Enemy {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 120;
        this.height = 120;
        this.x = this.gameWidth;
        this.y = this.gameHeight - this.height - 50;
        this.markedForDeletion = false;
    }

    draw(context) {
        if (enemyImage.complete && enemyImage.naturalWidth > 0) {
            context.drawImage(enemyImage, this.x, this.y, this.width, this.height);
        } else {
            context.fillStyle = 'purple';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        this.x -= gameSpeed; // Use global variable directly
        if (this.x < 0 - this.width) this.markedForDeletion = true;
    }
}

class Platform {
    constructor(gameWidth, gameHeight, x, y, width) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 20;
        this.markedForDeletion = false;
    }

    draw(context) {
        context.fillStyle = '#5D4037';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.fillStyle = '#8D6E63';
        context.fillRect(this.x, this.y, this.width, 5);
    }

    update() {
        this.x -= gameSpeed;
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
        this.y = y;
        this.markedForDeletion = false;
    }

    draw(context) {
        context.fillStyle = '#f1c40f';
        context.beginPath();
        context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();

        context.fillStyle = 'black';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('$', this.x + this.width / 2, this.y + this.height / 2 + 2);
    }

    update() {
        this.x -= gameSpeed;
        if (this.x < 0 - this.width) this.markedForDeletion = true;
    }
}

class Bird {
    constructor(gameWidth, gameHeight, direction) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 50;
        this.height = 50;
        this.direction = direction; // 'right' (blue) or 'left' (white)
        this.y = Math.random() * (this.gameHeight - 200); // Random height in sky
        this.flySpeed = Math.random() * 2 + 3; // Independent fly speed
        this.markedForDeletion = false;

        if (this.direction === 'right') {
            this.x = 0 - this.width;
            this.image = birdBlueImage;
        } else {
            this.x = this.gameWidth;
            this.image = birdWhiteImage;
        }
    }

    draw(context) {
        if (this.image.complete && this.image.naturalWidth > 0) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback
            context.fillStyle = (this.direction === 'right') ? 'blue' : 'white';
            context.beginPath();
            context.arc(this.x + this.width / 2, this.y + this.height / 2, 20, 0, Math.PI * 2);
            context.fill();
        }
    }

    update() {
        if (this.direction === 'right') {
            this.x += this.flySpeed;
            if (this.x > this.gameWidth) this.markedForDeletion = true;
        } else {
            this.x -= (this.flySpeed + gameSpeed * 0.5); // Move left faster (relative to train/ground speed illusion)
            if (this.x < 0 - this.width) this.markedForDeletion = true;
        }
    }
}

class LevelManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.enemies = [];
        this.coins = [];
        this.platforms = [];
        this.birds = [];
        this.timer = 0;
        this.birdTimer = 0;
        this.interval = 1500;
        this.randomInterval = Math.random() * 1000 + 500;
        this.birdInterval = 4000;
    }

    update(deltaTime) {
        // Spawn Enemies/Platforms
        if (this.timer > this.interval + this.randomInterval) {
            this.spawnPattern();
            this.timer = 0;
            this.randomInterval = Math.random() * 1000 + 500;
            // Adjust interval slightly based on gameSpeed to keep density consistent
            // As speed increases, spawn faster? Or same distance?
            // Current time based means effectively sparser as speed increases. 
            // Let's keep it time based for now to increase difficulty via speed.
        } else {
            this.timer += deltaTime;
        }

        // Spawn Birds
        if (this.birdTimer > this.birdInterval) {
            const dir = Math.random() < 0.5 ? 'right' : 'left';
            this.birds.push(new Bird(this.gameWidth, this.gameHeight, dir));
            this.birdTimer = 0;
            this.birdInterval = Math.random() * 5000 + 3000;
        } else {
            this.birdTimer += deltaTime;
        }

        this.enemies.forEach(e => e.update());
        this.coins.forEach(c => c.update());
        this.platforms.forEach(p => p.update());
        this.birds.forEach(b => b.update());

        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.coins = this.coins.filter(c => !c.markedForDeletion);
        this.platforms = this.platforms.filter(p => !p.markedForDeletion);
        this.birds = this.birds.filter(b => !b.markedForDeletion);
    }

    draw(context) {
        this.birds.forEach(b => b.draw(context)); // Birds in background (behind potential foreground?) or sky
        this.platforms.forEach(p => p.draw(context));
        this.enemies.forEach(e => e.draw(context));
        this.coins.forEach(c => c.draw(context));
    }

    spawnPattern() {
        const rand = Math.random();

        if (rand < 0.3) {
            this.enemies.push(new Enemy(this.gameWidth, this.gameHeight));
        } else if (rand < 0.6) {
            const pWidth = 150;
            const pHeight = this.gameHeight - 150;
            const platform = new Platform(this.gameWidth, this.gameHeight, this.gameWidth, pHeight, pWidth);
            this.platforms.push(platform);
            this.coins.push(new Coin(this.gameWidth, this.gameHeight, pHeight - 50));
            if (Math.random() > 0.5) this.coins.push(new Coin(this.gameWidth + 50, this.gameHeight, this.gameHeight - 100));
        } else if (rand < 0.8) {
            const enemy = new Enemy(this.gameWidth, this.gameHeight);
            enemy.x += 100;
            this.enemies.push(enemy);
            const pWidth = 120;
            const pHeight = this.gameHeight - 200;
            this.platforms.push(new Platform(this.gameWidth, this.gameHeight, this.gameWidth, pHeight, pWidth));
            this.coins.push(new Coin(this.gameWidth + 30, this.gameHeight, pHeight - 40));
        } else {
            this.coins.push(new Coin(this.gameWidth, this.gameHeight, this.gameHeight - 120));
            this.coins.push(new Coin(this.gameWidth + 50, this.gameHeight, this.gameHeight - 170));
            this.coins.push(new Coin(this.gameWidth + 100, this.gameHeight, this.gameHeight - 120));
        }
    }

    reset() {
        this.enemies = [];
        this.coins = [];
        this.platforms = [];
        this.birds = [];
        this.timer = 0;
        this.birdTimer = 0;
    }
}

// --- INIT ---

// Setup immediately since script is at end of body
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverTitle = document.querySelector('#game-over-screen h1');

const input = new InputHandler();
const player = new Thor(GAME_WIDTH, GAME_HEIGHT);
const levelManager = new LevelManager(GAME_WIDTH, GAME_HEIGHT);

let gameRunning = false;
let score = 0;
let frameCount = 0;
let lastTime = 0;
let gameWon = false;
let nextSpeedThreshold = 100;

// Event Listeners
if (startBtn) startBtn.addEventListener('click', startGame);
if (restartBtn) restartBtn.addEventListener('click', startGame);

function startGame() {
    console.log("Starting Game...");
    if (gameRunning) return;

    gameRunning = true;
    gameWon = false;
    score = 0;
    frameCount = 0;
    gameSpeed = INITIAL_GAME_SPEED;
    nextSpeedThreshold = 100;
    if (scoreElement) scoreElement.innerText = score;

    player.y = GAME_HEIGHT - player.height - 50;
    player.vy = 0;
    player.onGround = true;
    player.isAttacking = false;

    levelManager.reset();

    if (startScreen) {
        startScreen.classList.add('hidden');
        startScreen.classList.remove('active');
    }
    if (gameOverScreen) {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.classList.remove('active');
    }

    if (gameOverTitle) gameOverTitle.innerText = "FIN DEL JUEGO";

    lastTime = performance.now();
    requestAnimationFrame(animate);
}

function gameOver() {
    gameRunning = false;
    if (finalScoreElement) finalScoreElement.innerText = score;
    if (gameOverTitle) gameOverTitle.innerText = "FIN DEL JUEGO";
    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('active');
    }
}

function winGame() {
    gameRunning = false;
    gameWon = true;

    if (finalScoreElement) finalScoreElement.innerText = score;
    if (gameOverTitle) gameOverTitle.innerText = "¡Te pillé Loki, devuélveme mis cabras!";

    let lokiImg = document.getElementById('loki-win-img');
    if (!lokiImg && gameOverScreen) {
        lokiImg = document.createElement('img');
        lokiImg.id = 'loki-win-img';
        lokiImg.src = 'assets/loki.png';
        lokiImg.style.maxWidth = '200px';
        lokiImg.style.marginTop = '20px';
        gameOverScreen.insertBefore(lokiImg, restartBtn);
    }

    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('active');
    }
}

function checkCollisions() {
    levelManager.enemies.forEach(enemy => {
        const dx = (enemy.x + enemy.width / 2) - (player.x + player.width / 2);
        const dy = (enemy.y + enemy.height / 2) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.width / 2 + player.width / 2 - 15) {
            if (player.isAttacking) {
                enemy.markedForDeletion = true;
                score += 10;
                scoreElement.innerText = score;
            } else {
                gameOver();
            }
        }
    });

    levelManager.coins.forEach(coin => {
        const dx = (coin.x + coin.width / 2) - (player.x + player.width / 2);
        const dy = (coin.y + coin.height / 2) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < coin.width / 2 + player.width / 2) {
            coin.markedForDeletion = true;
            score += 5;
            scoreElement.innerText = score;
        }
    });
}

function update(deltaTime) {
    if (!gameRunning) return;
    frameCount++;

    player.update(input, levelManager.platforms);
    levelManager.update(deltaTime);
    checkCollisions();

    if (frameCount % 60 === 0) {
        score++;
        scoreElement.innerText = score;
    }

    // Speed Scaling
    if (score >= nextSpeedThreshold) {
        gameSpeed = gameSpeed * 1.1; // Increase by 10%
        nextSpeedThreshold += 100;
        console.log("Speed Up! New Speed:", gameSpeed);
    }

    if (score >= 300 && !gameWon) {
        winGame();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = '#FDB813';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 10);

    // Speed Lines
    ctx.strokeStyle = '#558B2F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let offset = (frameCount * gameSpeed) % 100;
    for (let i = 0; i < GAME_WIDTH + 100; i += 100) {
        ctx.moveTo(i - offset, GAME_HEIGHT - 40);
        ctx.lineTo(i - offset - 30, GAME_HEIGHT);
    }
    ctx.stroke();

    levelManager.draw(ctx);
    player.draw(ctx);
}

function animate(currentTime) {
    if (!gameRunning) return;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(animate);
}

// Initial Draw
draw();
