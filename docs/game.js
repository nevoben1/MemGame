// ================================
// CONFIGURATION — edit freely
// ================================
const CONFIG = {
  numPairs: 5,
  rows: 2,
  cols: 5,
  flipDelay: 800, // ms before non-matching cards flip back
  // Paths to card face images (must have exactly numPairs entries).
  // Any extension works: .jpg, .jpeg, .png, .gif, .bmp, .jfif
  imagePaths: [
    "images/1.jpg",
    "images/2.jpg",
    "images/3.jpg",
    "images/4.jpg",
    "images/5.jpg",
  ],
  cardBackPath: "images/back.png",
  victoryMessage: (steps, time) =>
    `happy birthday shachar i love you\n\nסיימת ב-${steps} צעדים ו-${time}!`,
};


// ================================
// MemoryGame class
// ================================
class MemoryGame {
  constructor() {
    this._cards = [];       // shuffled array of image paths (length = numPairs * 2)
    this._revealed = [];    // bool[]
    this._matched = [];     // bool[]
    this._first = null;     // index of first revealed card
    this._second = null;    // index of second revealed card
    this._lock = false;
    this._attempts = 0;
    this._startTime = 0;
    this._timerId = null;

    this._boardEl      = document.getElementById("board");
    this._attemptsEl   = document.getElementById("attempts-display");
    this._timerEl      = document.getElementById("timer-display");
    this._victoryEl    = document.getElementById("victory");
    this._victoryMsgEl = document.getElementById("victory-message");
    document.getElementById("play-again").addEventListener("click", () => this._newGame());

    this._newGame();
  }

  _newGame() {
    clearInterval(this._timerId);

    // Shuffle card images
    const base = CONFIG.imagePaths.slice(0, CONFIG.numPairs);
    this._cards = [...base, ...base];
    this._shuffle(this._cards);

    const total = CONFIG.numPairs * 2;
    this._revealed = Array(total).fill(false);
    this._matched  = Array(total).fill(false);
    this._first    = null;
    this._second   = null;
    this._lock     = false;
    this._attempts = 0;

    this._attemptsEl.textContent = "ניסיונות: 0";
    this._timerEl.textContent    = "זמן: 00:00";
    this._victoryEl.classList.add("hidden");

    // Clear any leftover fireworks
    const fw = document.getElementById("fireworks");
    fw.getContext("2d").clearRect(0, 0, fw.width, fw.height);

    this._renderBoard();

    this._startTime = Date.now();
    this._timerId = setInterval(() => this._tick(), 1000);
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  _renderBoard() {
    this._boardEl.innerHTML = "";
    this._boardEl.style.gridTemplateColumns = `repeat(${CONFIG.cols}, 1fr)`;

    this._cardEls = this._cards.map((imgPath, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <img src="${CONFIG.cardBackPath}" alt="back" onerror="this.style.display='none'">
          </div>
          <div class="card-back">
            <img src="${imgPath}" alt="card ${i}">
          </div>
        </div>
      `;
      card.addEventListener("click", () => this._onCardClick(i));
      this._boardEl.appendChild(card);
      return card;
    });
  }

  _tick() {
    const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    this._timerEl.textContent = `זמן: ${mm}:${ss}`;
  }

  _onCardClick(index) {
    if (this._lock || this._revealed[index] || this._matched[index]) return;

    this._cardEls[index].classList.add("flipped");
    this._revealed[index] = true;

    if (this._first === null) {
      this._first = index;
    } else {
      this._second = index;
      this._lock = true;
      this._attempts++;
      this._attemptsEl.textContent = `ניסיונות: ${this._attempts}`;
      setTimeout(() => this._checkMatch(), CONFIG.flipDelay);
    }
  }

  _checkMatch() {
    const a = this._first;
    const b = this._second;

    if (this._cards[a] === this._cards[b]) {
      this._matched[a] = true;
      this._matched[b] = true;
      this._cardEls[a].classList.add("matched");
      this._cardEls[b].classList.add("matched");
    } else {
      this._cardEls[a].classList.remove("flipped");
      this._cardEls[b].classList.remove("flipped");
      this._revealed[a] = false;
      this._revealed[b] = false;
    }

    this._first  = null;
    this._second = null;
    this._lock   = false;

    if (this._matched.every(Boolean)) {
      this._onWin();
    }
  }

  _onWin() {
    clearInterval(this._timerId);

    const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const timeStr = `${mm}:${ss}`;

    this._victoryMsgEl.textContent = CONFIG.victoryMessage(this._attempts, timeStr);
    this._victoryEl.classList.remove("hidden");
    launchFireworks();
  }
}


// ================================
// Fireworks
// ================================
function launchFireworks() {
  const canvas = document.getElementById("fireworks");
  const ctx    = canvas.getContext("2d");
  let particles = [];
  let rafId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function randomColor() {
    const colors = ["#FF6B6B","#FFD700","#7EFFF5","#FF85E1","#A8FF78","#FFA500","#FFFFFF"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function burst() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;
    const color = randomColor();
    const count = 80 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        radius: 2 + Math.random() * 2,
      });
    }
  }

  // Fire a burst every 600 ms
  burst();
  const burstId = setInterval(burst, 600);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += 0.08;   // gravity
      p.vx    *= 0.98;   // drag
      p.alpha -= 0.012;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.alpha > 0);
    rafId = requestAnimationFrame(animate);
  }
  animate();

  // Stop after 6 seconds
  setTimeout(() => {
    clearInterval(burstId);
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 6000);
}


// ================================
// Entry point
// ================================
new MemoryGame();
