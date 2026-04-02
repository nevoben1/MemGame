// ================================
// CONFIGURATION — edit freely
// ================================
const CONFIG = {
  numPairs: 5,
  rows: 2,
  cols: 5,
  flipDelay: 800, // ms before non-matching cards flip back
  // Paths to card face images (must have exactly numPairs entries)
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
  }
}


// ================================
// Entry point
// ================================
new MemoryGame();
