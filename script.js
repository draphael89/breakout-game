const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

let paddleWidth, paddleHeight, paddleX;
const paddleSpeed = 5;

let ballRadius;
let ballX = canvas.width / 2;
let ballY = canvas.height - paddleHeight - ballRadius;
let ballSpeedX = 2;
let ballSpeedY = -2;

const brickRowCount = 5;
const brickColumnCount = 9;
let brickWidth, brickHeight;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

const bricks = [];

let score = 0;
let lives = 3;
let level = 1;

let rightPressed = false;
let leftPressed = false;

const paddleImage = new Image();
paddleImage.src = 'images/paddle.png';
paddleImage.onload = function() {
  paddleWidth = paddleImage.width;
  paddleHeight = paddleImage.height;
  paddleX = (canvas.width - paddleWidth) / 2;
};

const ballImage = new Image();
ballImage.src = 'images/ball.png';
ballImage.onload = function() {
  ballRadius = ballImage.width / 2;
};

const brickImage = new Image();
brickImage.src = 'images/brick.png';
brickImage.onload = function() {
  brickWidth = brickImage.width;
  brickHeight = brickImage.height;
  initializeBricks();
};

const backgroundImage = new Image();
backgroundImage.src = 'images/background.jpg';

const particles = [];

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
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background image
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

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

  // Render game elements
  drawPaddle();
  drawBall();
  drawBricks();
  drawScore();
  drawLives();
  drawLevel();

  updateParticles();
  drawParticles();

  // Request next frame
  requestAnimationFrame(gameLoop);
}

function drawPaddle() {
  ctx.drawImage(paddleImage, paddleX, canvas.height - paddleHeight);
}

function drawBall() {
  ctx.drawImage(ballImage, ballX - ballRadius, ballY - ballRadius);
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.drawImage(brickImage, brickX, brickY);
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

gameLoop();