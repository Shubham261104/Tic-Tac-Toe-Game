// Welcome page functions
function startGame() {
  const welcomePage = document.getElementById('welcome-page');
  const gamePage = document.getElementById('game-page');
  
  if (welcomePage && gamePage) {
    welcomePage.style.display = 'none';
    gamePage.style.display = 'block';
  }
}

// Slideshow functionality
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');

function showSlide(index) {
  // Remove active class from all slides and indicators
  slides.forEach(slide => slide.classList.remove('active', 'prev'));
  indicators.forEach(indicator => indicator.classList.remove('active'));
  
  // Add prev class to current slide
  if (slides[currentSlideIndex]) {
    slides[currentSlideIndex].classList.add('prev');
  }
  
  // Set new current slide
  currentSlideIndex = index;
  
  // Add active class to new slide and indicator
  if (slides[currentSlideIndex]) {
    slides[currentSlideIndex].classList.add('active');
  }
  if (indicators[currentSlideIndex]) {
    indicators[currentSlideIndex].classList.add('active');
  }
}

function currentSlide(index) {
  showSlide(index - 1);
}

function nextSlide() {
  const nextIndex = (currentSlideIndex + 1) % slides.length;
  showSlide(nextIndex);
}

// Auto-advance slideshow
function startSlideshow() {
  setInterval(nextSlide, 3000); // Change slide every 3 seconds
}

// Initialize slideshow when page loads
document.addEventListener('DOMContentLoaded', function() {
  if (slides.length > 0) {
    startSlideshow();
  }
});

const board = document.getElementById("board");
const statusDiv = document.getElementById("status");
const scoreDiv = document.getElementById("score");
const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");

let cells = Array(9).fill("");
let currentPlayer = "X";
let gameActive = false;
let scoreX = 0, scoreO = 0;
let gameMode = ""; // 'AI' or 'FRIEND'
let aiDifficulty = "HARD"; // 'EASY', 'MEDIUM', 'HARD'
let currentFocusIndex = 0; // For keyboard navigation
let gameHistory = []; // Store game results
let totalGames = 0;
let winsX = 0, winsO = 0, draws = 0;

const winPatterns = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function setMode(mode) {
  gameMode = mode;
  if (mode === 'AI') {
    document.getElementById('difficulty-buttons').style.display = 'block';
    statusDiv.textContent = "Choose difficulty level";
    gameActive = false;
    updatePlayerIndicator('');
  } else {
    document.getElementById('difficulty-buttons').style.display = 'none';
    restartGame();
    statusDiv.textContent = `Player X's turn (2 Player Mode)`;
    gameActive = true;
    updatePlayerIndicator('X');
  }
}

function setDifficulty(difficulty) {
  aiDifficulty = difficulty;
  document.getElementById('difficulty-buttons').style.display = 'none';
  restartGame();
  statusDiv.textContent = `Player X's turn (vs AI - ${difficulty})`;
  gameActive = true;
  updatePlayerIndicator('X');
}

function renderBoard() {
  board.innerHTML = "";
  cells.forEach((val, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.textContent = val;
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `Cell ${i + 1}, ${val || 'empty'}`);
    cell.setAttribute('aria-rowindex', Math.floor(i / 3) + 1);
    cell.setAttribute('aria-colindex', (i % 3) + 1);
    cell.addEventListener("click", handleClick);
    cell.addEventListener("keydown", handleKeyDown);
    board.appendChild(cell);
  });
  
  // Set focus to current cell
  if (board.children[currentFocusIndex]) {
    board.children[currentFocusIndex].focus();
  }
}

function addMoveAnimation(index, player) {
  const cell = board.children[index];
  if (cell) {
    cell.classList.add(player === 'X' ? 'x-move' : 'o-move');
    setTimeout(() => {
      cell.classList.remove('x-move', 'o-move');
    }, 400);
  }
}

function handleClick(e) {
  const index = parseInt(e.target.dataset.index);
  makeMove(index);
}

function handleKeyDown(e) {
  const index = parseInt(e.target.dataset.index);
  
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    makeMove(index);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    currentFocusIndex = Math.min(currentFocusIndex + 1, 8);
    board.children[currentFocusIndex]?.focus();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    currentFocusIndex = Math.max(currentFocusIndex - 1, 0);
    board.children[currentFocusIndex]?.focus();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentFocusIndex = Math.min(currentFocusIndex + 3, 8);
    board.children[currentFocusIndex]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentFocusIndex = Math.max(currentFocusIndex - 3, 0);
    board.children[currentFocusIndex]?.focus();
  }
}

function makeMove(index) {
  if (!gameActive || cells[index]) return;

  cells[index] = currentPlayer;
  moveSound.play();
  renderBoard();
  addMoveAnimation(index, currentPlayer);

  if (checkWinner(currentPlayer)) {
    showWin(currentPlayer);
    return;
  }

  if (isDraw()) {
    statusDiv.textContent = "It's a draw!";
    gameActive = false;
    recordGameResult('draw');
    return;
  }

  if (gameMode === "AI" && currentPlayer === "X") {
    currentPlayer = "O";
    statusDiv.textContent = "AI thinking...";
    updatePlayerIndicator('');
    setTimeout(() => {
      const bestMove = getBestMove();
      cells[bestMove] = "O";
      renderBoard();
      addMoveAnimation(bestMove, "O");
      moveSound.play();

      if (checkWinner("O")) {
        showWin("O");
      } else if (isDraw()) {
        statusDiv.textContent = "It's a draw!";
        gameActive = false;
        updatePlayerIndicator('');
        recordGameResult('draw');
      } else {
        currentPlayer = "X";
        statusDiv.textContent = "Player X's turn";
        updatePlayerIndicator('X');
      }
    }, 400);
  } else if (gameMode === "FRIEND") {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDiv.textContent = `Player ${currentPlayer}'s turn`;
    updatePlayerIndicator(currentPlayer);
  }
}

function getBestMove() {
  if (aiDifficulty === "EASY") {
    return getRandomMove();
  } else if (aiDifficulty === "MEDIUM") {
    return Math.random() < 0.7 ? getOptimalMove() : getRandomMove();
  } else {
    return getOptimalMove();
  }
}

function getRandomMove() {
  const emptyCells = cells.map((cell, i) => cell === "" ? i : null).filter(i => i !== null);
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getOptimalMove() {
  let bestScore = -Infinity;
  let move;

  cells.forEach((cell, i) => {
    if (cell === "") {
      cells[i] = "O";
      let score = minimax(cells, 0, false);
      cells[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  });

  return move;
}

function minimax(boardState, depth, isMaximizing) {
  if (checkWinnerFrom(boardState, "O")) return 10 - depth;
  if (checkWinnerFrom(boardState, "X")) return depth - 10;
  if (boardState.every(c => c !== "")) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === "") {
        boardState[i] = "O";
        let eval = minimax(boardState, depth + 1, false);
        boardState[i] = "";
        maxEval = Math.max(maxEval, eval);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === "") {
        boardState[i] = "X";
        let eval = minimax(boardState, depth + 1, true);
        boardState[i] = "";
        minEval = Math.min(minEval, eval);
      }
    }
    return minEval;
  }
}

function checkWinner(player) {
  return winPatterns.some(pattern =>
    pattern.every(i => cells[i] === player)
  );
}

function checkWinnerFrom(boardState, player) {
  return winPatterns.some(pattern =>
    pattern.every(i => boardState[i] === player)
  );
}

function getWinningPattern(player) {
  return winPatterns.find(pattern =>
    pattern.every(i => cells[i] === player)
  );
}

function showWin(player) {
  const pattern = getWinningPattern(player);
  pattern.forEach(i => {
    board.children[i].classList.add("win");
  });
  winSound.play();
  let winnerLabel = '';
  if (player === "X") winnerLabel = "Player X";
  else if (gameMode === 'AI') winnerLabel = "AI (O)";
  else winnerLabel = "Player O";
  statusDiv.textContent = `${winnerLabel} wins!`;
  gameActive = false;
  updatePlayerIndicator('');

  if (player === "X") scoreX++;
  else scoreO++;

  updateScore();
  recordGameResult(player);

  // Create confetti effect
  createConfetti();

  // Show sticker and play game over sound
  const sticker = document.getElementById('gameover-sticker');
  const winnerText = document.getElementById('winner-text');
  const gameOverSound = document.getElementById('gameOverSound');
  if (sticker && winnerText) {
    winnerText.textContent = `${winnerLabel} wins!`;
    sticker.style.display = 'flex';
    setTimeout(() => {
      sticker.style.display = 'none';
      winnerText.textContent = '';
    }, 2200);
  }
  if (gameOverSound) {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
  }
}

function isDraw() {
  return cells.every(cell => cell !== "");
}

function restartGame() {
  cells = Array(9).fill("");
  currentPlayer = "X";
  gameActive = gameMode !== "";
  renderBoard();
  if (gameMode === 'AI') {
    statusDiv.textContent = `Player X's turn (vs AI - ${aiDifficulty})`;
    updatePlayerIndicator('X');
  } else if (gameMode === 'FRIEND') {
    statusDiv.textContent = "Player X's turn (2 Player Mode)";
    updatePlayerIndicator('X');
  }
}

function newGame() {
  scoreX = 0;
  scoreO = 0;
  gameMode = "";
  aiDifficulty = "HARD";
  gameActive = false;
  document.getElementById('difficulty-buttons').style.display = 'none';
  updatePlayerIndicator('');
  restartGame();
  updateScore();
  statusDiv.textContent = "Choose a mode to start";
}

function updateScore() {
  scoreDiv.textContent = `Score - X: ${scoreX} | O: ${scoreO}`;
}

function updatePlayerIndicator(player) {
  const indicator = document.getElementById('current-player-indicator');
  if (indicator) {
    if (player === 'X') {
      indicator.textContent = 'X';
      indicator.className = 'current-player-indicator x-turn';
    } else if (player === 'O') {
      indicator.textContent = 'O';
      indicator.className = 'current-player-indicator o-turn';
    } else {
      indicator.textContent = '';
      indicator.className = 'current-player-indicator';
    }
  }
}

function recordGameResult(result) {
  totalGames++;
  const gameResult = {
    result: result,
    mode: gameMode,
    difficulty: aiDifficulty,
    timestamp: new Date().toLocaleString(),
    moves: [...cells]
  };
  
  gameHistory.push(gameResult);
  
  if (result === 'X') winsX++;
  else if (result === 'O') winsO++;
  else draws++;
  
  // Keep only last 10 games
  if (gameHistory.length > 10) {
    gameHistory.shift();
  }
  
  updateStatistics();
}

function updateStatistics() {
  const statsDiv = document.getElementById('statistics');
  if (statsDiv) {
    const winRateX = totalGames > 0 ? ((winsX / totalGames) * 100).toFixed(1) : 0;
    const winRateO = totalGames > 0 ? ((winsO / totalGames) * 100).toFixed(1) : 0;
    const drawRate = totalGames > 0 ? ((draws / totalGames) * 100).toFixed(1) : 0;
    
    statsDiv.innerHTML = `
      <div class="stats-title">Game Statistics</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${totalGames}</div>
          <div class="stat-label">Total Games</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${winRateX}%</div>
          <div class="stat-label">X Win Rate</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${winRateO}%</div>
          <div class="stat-label">O Win Rate</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${drawRate}%</div>
          <div class="stat-label">Draw Rate</div>
        </div>
      </div>
    `;
  }
}

function createConfetti() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

// Initial render
renderBoard();