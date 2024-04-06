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

let balls = [];
let stickyPaddle = false;
let multiBall = false;

let backgroundMusic;
let brickHitSound;
let paddleHitSound;
let powerUpSound;

let gameState = 'menu';
let mouseX = 0;
let ballTrailParticles = [];
let shakeDuration = 0;

function showMainMenu() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '40px Arial';
  ctx.fillText('Breakout Game', canvas.width / 2 - 100, canvas.height / 2 - 50);
  ctx.font = '20px Arial';
  ctx.fillText('Click to Start', canvas.width / 2 - 50, canvas.height / 2 + 50);
}

function updatePaddlePosition() {
  paddleX = mouseX - paddleWidth / 2;
  paddleX = Math.max(0, Math.min(paddleX, canvas.width - paddleWidth));
}

function updateBallSpeed() {
  const maxSpeed = 5;
  const speedIncrease = 0.001;
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
    const shakeIntensity = 5;
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
  ctx.fillStyle = '#0095dd';
  ctx.fill();
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
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Score: ${score}`, 8, 25);
}

function drawLives() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Lives: ${lives}`, canvas.width - 80, 25);
}

function drawLevel() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#0095dd';
  ctx.fillText(`Level: ${level}`, canvas.width / 2 - 30, 25);
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
      setTimeout(() => {
        paddleWidth -= 20;
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
    speedX: 2,
    speedY: -2
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
    
    canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    });
    
    canvas.addEventListener('click', function() {
    if (gameState === 'menu') {
    startGame();
    }
    });
    
    initSounds();
    gameLoop();