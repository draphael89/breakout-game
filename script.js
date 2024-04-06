const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions based on the device's screen size
function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.9;
  const aspectRatio = 800 / 600;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const paddleWidth = canvas.width * 0.15;
const paddleHeight = canvas.height * 0.02;
const paddleSpeed = canvas.width * 0.01;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = canvas.width * 0.01;
let ballX = canvas.width / 2;
let ballY = canvas.height - paddleHeight - ballRadius;
let ballSpeedX = canvas.width * 0.005;
let ballSpeedY = -canvas.height * 0.005;

const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = canvas.width * 0.08;
const brickHeight = canvas.height * 0.03;
const brickPadding = canvas.width * 0.01;
const brickOffsetTop = canvas.height * 0.05;
const brickOffsetLeft = canvas.width * 0.03;

let bricks = [];
let score = 0;
let lives = 3;
let level = 1;

let rightPressed = false;
let leftPressed = false;

const particles = [];

const powerUpWidth = canvas.width * 0.05;
const powerUpHeight = canvas.height * 0.02;
const powerUpColors = ['#ff0000', '#00ff00', '#0000ff'];
let powerUps = [];

let balls = [];
let stickyPaddle = false;
let multiBall = false;

let backgroundMusic;
let brickHitSound;
let paddleHitSound;
let powerUpSound;

let gameState = 'menu';
let touchX = 0;
let ballTrailParticles = [];
let shakeDuration = 0;

function showMainMenu() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `${canvas.width * 0.05}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Breakout Game', canvas.width / 2, canvas.height / 2 - canvas.height * 0.1);
  ctx.font = `${canvas.width * 0.03}px Arial`;
  ctx.fillText('Tap to Start', canvas.width / 2, canvas.height / 2 + canvas.height * 0.1);
}

function updatePaddlePosition() {
  paddleX = touchX - paddleWidth / 2;
  paddleX = Math.max(0, Math.min(paddleX, canvas.width - paddleWidth));
}

function updateBallSpeed() {
  const maxSpeed = canvas.width * 0.01;
  const speedIncrease = canvas.width * 0.0002;
  ballSpeedX += speedIncrease * Math.sign(ballSpeedX);
  ballSpeedY += speedIncrease * Math.sign(ballSpeedY);
  ballSpeedX = Math.min(maxSpeed, Math.max(-maxSpeed, ballSpeedX));
  ballSpeedY = Math.min(maxSpeed, Math.max(-maxSpeed, ballSpeedY));
}

function createBallTrailParticles(x, y) {
  const particle = {
    x: x,
    y: y,
    radius: ballRadius / 2,
    alpha: 1,
    color: '#0095dd'
  };
  ballTrailParticles.push(particle);
}

function updateBallTrailParticles() {
  for (let i = ballTrailParticles.length - 1; i >= 0; i--) {
    const particle = ballTrailParticles[i];
    particle.alpha -= 0.02;
    particle.radius -= 0.05;
    if (particle.alpha <= 0 || particle.radius <= 0) {
      ballTrailParticles.splice(i, 1);
    }
  }
}

function drawBallTrailParticles() {
  for (let i = 0; i < ballTrailParticles.length; i++) {
    const particle = ballTrailParticles[i];
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.closePath();
  }
}

function shakeScreen() {
  shakeDuration = 0.5;
}

function updateShake() {
  if (shakeDuration > 0) {
    shakeDuration -= 1 / 60;
    const shakeIntensity = canvas.width * 0.005;
    const shakeX = Math.random() * shakeIntensity * 2 - shakeIntensity;
    const shakeY = Math.random() * shakeIntensity * 2 - shakeIntensity;
    canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
  } else {
    canvas.style.transform = 'none';
  }
}

function initializeBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      const brickType = Math.floor(Math.random() * 3) + 1;
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: brickType,
        powerUp: Math.random() < 0.1 ? Math.floor(Math.random() * 3) : -1
      };
    }
  }
}

function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'menu') {
    showMainMenu();
    requestAnimationFrame(gameLoop);
    return;
  }

  // Update game state
  updatePaddlePosition();
  updateBallSpeed();

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    if (ball.x + ball.speedX > canvas.width - ballRadius || ball.x + ball.speedX < ballRadius) {
      ball.speedX = -ball.speedX;
    }
    if (ball.y + ball.speedY < ballRadius) {
      ball.speedY = -ball.speedY;
    }

    if (ball.y + ball.speedY > canvas.height - ballRadius - paddleHeight) {
      if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
        ball.speedY = -ball.speedY;
        playSound(paddleHitSound);
        if (stickyPaddle) {
          ball.speedX = 0;
          ball.speedY = 0;
        }
      } else {
        balls.splice(i, 1);
        i--;
        if (balls.length === 0) {
          lives--;
          if (lives === 0) {
            // Game over condition
            alert('Game Over');
            document.location.reload();
            clearInterval(interval);
          } else {
            // Reset ball position
            createBall();
          }
        }
      }
    }

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const brick = bricks[c][r];
        if (brick.status > 0) {
          if (
            ball.x > brick.x &&
            ball.x < brick.x + brickWidth &&
            ball.y > brick.y &&
            ball.y < brick.y + brickHeight
          ) {
            ball.speedY = -ball.speedY;
            brick.status--;
            if (brick.status === 0) {
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
            playSound(brickHitSound);
            shakeScreen();
          }
        }
      }
    }
  }

  if (score === brickRowCount * brickColumnCount) {
    level++;
    score = 0;
    // Reset ball position
    balls = [];
    createBall();
    // Reset bricks
    initializeBricks();
  }

  updatePowerUps();

  // Create ball trail particles
  if (balls.length > 0) {
    createBallTrailParticles(balls[0].x, balls[0].y);
  }

  // Update and draw ball trail particles
  updateBallTrailParticles();
  drawBallTrailParticles();

  // Update screen shake
  updateShake();

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
  ctx.roundRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight, 5);
  const gradient = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
  gradient.addColorStop(0, '#0095dd');
  gradient.addColorStop(1, '#00ffff');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#005588';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawBall() {
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ballRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#0095dd');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#005588';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status > 0) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 3);
        if (bricks[c][r].status === 1) {
          ctx.fillStyle = '#0095dd';
        } else if (bricks[c][r].status === 2) {
          ctx.fillStyle = '#ff0000';
        } else if (bricks[c][r].status === 3) {
          ctx.fillStyle = '#00ff00';
        }
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = `${canvas.width * 0.03}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Score: ${score}`, canvas.width * 0.02, canvas.height * 0.05);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeText(`Score: ${score}`, canvas.width * 0.02, canvas.height * 0.05);
}

function drawLives() {
  ctx.font = `${canvas.width * 0.03}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Lives: ${lives}`, canvas.width - canvas.width * 0.1, canvas.height * 0.05);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeText(`Lives: ${lives}`, canvas.width - canvas.width * 0.1, canvas.height * 0.05);
}

function drawLevel() {
  ctx.font = `${canvas.width * 0.03}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Level: ${level}`, canvas.width / 2 - canvas.width * 0.05, canvas.height * 0.05);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeText(`Level: ${level}`, canvas.width / 2 - canvas.width * 0.05, canvas.height * 0.05);
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * canvas.width * 0.005 + canvas.width * 0.002;
    this.speedX = Math.random() * canvas.width * 0.003 - canvas.width * 0.0015;
    this.speedY = Math.random() * canvas.width * 0.003 - canvas.width * 0.0015;
    this.color = 'rgba(255, 0, 0, 0.5)';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.radius -= canvas.width * 0.0001;
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
    powerUp.y += canvas.height * 0.003;

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
      paddleWidth += canvas.width * 0.03;
      setTimeout(() => {
        paddleWidth -= canvas.width * 0.03;
      }, 10000);
      break;
    case 1: // Sticky Paddle
      stickyPaddle = true;
      setTimeout(() => {
        stickyPaddle = false;
      }, 10000);
      break;
    case 2: // Multi-Ball
      if (balls.length === 1) {
        createBall();
        createBall();
      }
      break;
  }
  playSound(powerUpSound);
}

function drawPowerUps() {
  for (let i = 0; i < powerUps.length; i++) {
    const powerUp = powerUps[i];
    ctx.beginPath();
    ctx.roundRect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight, 3);
    ctx.fillStyle = powerUpColors[powerUp.type];
    ctx.fill();
    ctx.closePath();
  }
}

function createBall() {
  const ball = {
    x: canvas.width / 2,
    y: canvas.height - paddleHeight - ballRadius,
    speedX: canvas.width * 0.005,
    speedY: -canvas.height * 0.005
  };
  balls.push(ball);
  ballX = ball.x;
  ballY = ball.y;
}

function playSound(sound) {
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

function generateSound(duration, frequency) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'square';
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);

  return {
    play: function() {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  };
}

function initSounds() {
  backgroundMusic = generateSound(2, 200);
  brickHitSound = generateSound(0.1, 500);
  paddleHitSound = generateSound(0.1, 300);
  powerUpSound = generateSound(0.5, 1000);

  // Loop the background music
  backgroundMusic.onended = function() {
    this.currentTime = 0;
    this.play();
  };
}

function startGame() {
  gameState = 'play';
  initializeBricks();
  createBall();
  playSound(backgroundMusic);
}

canvas.addEventListener('touchstart', function(event) {
  event.preventDefault();
  touchX = event.touches[0].clientX - canvas.getBoundingClientRect().left;
  if (gameState === 'menu') {
    startGame();
  }
});

canvas.addEventListener('touchmove', function(event) {
  event.preventDefault();
  touchX = event.touches[0].clientX - canvas.getBoundingClientRect().left;
});

canvas.addEventListener('mousemove', function(event) {
  const rect = canvas.getBoundingClientRect();
  touchX = event.clientX - rect.left;
});

canvas.addEventListener('click', function() {
  if (gameState === 'menu') {
    startGame();
  }
});

initSounds();
gameLoop();