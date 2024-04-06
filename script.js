const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const paddleWidth = 100;
const paddleHeight = 10;
const paddleSpeed = 5;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 5;
let ballX = canvas.width / 2;
let ballY = canvas.height - paddleHeight - ballRadius;
let ballSpeedX = 2;
let ballSpeedY = -2;

const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 70;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];
let score = 0;
let lives = 3;
let level = 1;

let rightPressed = false;
let leftPressed = false;

const particles = [];

const powerUpWidth = 40;
const powerUpHeight = 10;
const powerUpColors = ['#ff0000', '#00ff00', '#0000ff'];
let powerUps = [];

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = false;
  }
}

function initializeBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1, powerUp: Math.random() < 0.1 ? Math.floor(Math.random() * 3) : -1 };
    }
  }
}

function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update game state
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY + ballSpeedY < ballRadius) {
    ballSpeedY = -ballSpeedY;
  }

  if (ballY + ballSpeedY > canvas.height - ballRadius - paddleHeight) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballSpeedY = -ballSpeedY;
    } else {
      lives--;
      if (lives === 0) {
        // Game over condition
        alert('Game Over');
        document.location.reload();
        clearInterval(interval);
      } else {
        // Reset ball position
        ballX = canvas.width / 2;
        ballY = canvas.height - paddleHeight - ballRadius;
        ballSpeedX = 2;
        ballSpeedY = -2;
        paddleX = (canvas.width - paddleWidth) / 2;
      }
    }
  }

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      if (brick.status === 1) {
        if (
          ballX > brick.x &&
          ballX < brick.x + brickWidth &&
          ballY > brick.y &&
          ballY < brick.y + brickHeight
        ) {
          ballSpeedY = -ballSpeedY;
          brick.status = 0;
          score++;
          createParticles(brick.x + brickWidth / 2, brick.y + brickHeight / 2);

          if (brick.powerUp !== -1) {
            powerUps.push({
              x: brick.x + brickWidth / 2 - powerUpWidth / 2,
              y: brick.y + brickHeight / 2 - powerUpHeight / 2,
              type: brick.powerUp
            });
          }
        }
      }
    }
  }

  if (score === brickRowCount * brickColumnCount) {
    level++;
    score = 0;
    // Reset ball position
    ballX = canvas.width / 2;
    ballY = canvas.height - paddleHeight - ballRadius;
    ballSpeedX = 2;
    ballSpeedY = -2;
    paddleX = (canvas.width - paddleWidth) / 2;
    // Reset bricks
    initializeBricks();
  }

  updatePowerUps();

  // Render game elements
  drawPaddle();
  drawBall();
  drawBricks();
  drawScore();
  drawLives();
  drawLevel();
  drawPowerUps();

  updateParticles();
  drawParticles();

  // Request next frame
  requestAnimationFrame(gameLoop);
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = '#0095dd';
  ctx.fill();
  ctx.closePath();
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0095dd';
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = '#0095dd';
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Score: ${score}`, 8, 20);
}

function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function drawLevel() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Level: ${level}`, canvas.width / 2 - 20, 20);
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 5 + 1;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.color = 'rgba(255, 0, 0, 0.5)';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.radius -= 0.05;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

function createParticles(x, y) {
  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].radius <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (let i = 0; i < particles.length; i++) {
    particles[i].draw();
  }
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.y += 2;

    if (
      powerUp.y > canvas.height - paddleHeight &&
      powerUp.x > paddleX &&
      powerUp.x < paddleX + paddleWidth
    ) {
      activatePowerUp(powerUp.type);
      powerUps.splice(i, 1);
    } else if (powerUp.y > canvas.height) {
      powerUps.splice(i, 1);
    }
  }
}

function activatePowerUp(type) {
  switch (type) {
    case 0: // Expand Paddle
      paddleWidth += 20;
      break;
    case 1: // Sticky Paddle
      // Implement sticky paddle logic
      break;
    case 2: // Multi-Ball
      // Implement multi-ball logic
      break;
  }
}

function drawPowerUps() {
  for (let i = 0; i < powerUps.length; i++) {
    const powerUp = powerUps[i];
    ctx.beginPath();
    ctx.rect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
    ctx.fillStyle = powerUpColors[powerUp.type];
    ctx.fill();
    ctx.closePath();
  }
}

initializeBricks();
gameLoop();