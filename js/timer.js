// Timer and Move Counter Management

let gameStarted = false;
let moveCount = 0;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let bestTime = null;
let bestMoves = null;
let bestSeed = null;
let bestScore = null;

// Format time as M:SS.CC (centiseconds)
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Show centiseconds (2 digits)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// Update the display of time, moves, and best scores
function updateDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    const movesDisplay = document.getElementById('movesDisplay');
    const timeBest = document.getElementById('timeBest');
    const movesBest = document.getElementById('movesBest');
    
    if (timeDisplay) {
        timeDisplay.textContent = formatTime(elapsedTime);
    }
    
    if (movesDisplay) {
        movesDisplay.textContent = moveCount;
    }
    
    if (timeBest) {
        if (bestTime !== null) {
            timeBest.textContent = `Best: ${formatTime(bestTime)}`;
        } else {
            timeBest.textContent = '';
        }
    }
    
    if (movesBest) {
        if (bestMoves !== null) {
            movesBest.textContent = `Best: ${bestMoves}`;
        } else {
            movesBest.textContent = '';
        }
    }
    
    const scoreBest = document.getElementById('scoreBest');
    if (scoreBest) {
        if (bestScore !== null) {
            scoreBest.textContent = `Best: ${formatScore(bestScore)}`;
        } else {
            scoreBest.textContent = '';
        }
    }
}

// Start the timer
function startTimer() {
    gameStarted = true;
    startTime = Date.now();
    timerInterval = setInterval(() => {
        if (gameStarted && !gameWon) {
            elapsedTime = Date.now() - startTime;
            updateDisplay();
        }
    }, 100);
}

// Stop the timer
function stopTimer() {
    gameStarted = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Reset timer and move counter
function resetTimerAndMoves() {
    gameStarted = false;
    moveCount = 0;
    elapsedTime = 0;
    stopTimer();
    
    // Load best scores for current configuration
    const scores = loadBestScores();
    bestTime = scores.bestTime;
    bestMoves = scores.bestMoves;
    bestSeed = scores.bestSeed;
    bestScore = scores.bestScore;
    
    updateDisplay();
}

// Update best scores if current game is better
function updateBestScores() {
    const finalTime = elapsedTime;
    const scoreData = calculateScore();
    const currentDifficultyScore = scoreData ? scoreData.totalScore : null;
    let updated = false;
    
    if (bestTime === null || finalTime < bestTime) {
        bestTime = finalTime;
        bestSeed = currentSeed;
        updated = true;
    }
    if (bestMoves === null || moveCount < bestMoves) {
        bestMoves = moveCount;
        if (!updated) { // Only update seed if not already updated by time
            bestSeed = currentSeed;
        }
        updated = true;
    }
    if (bestScore === null || (currentDifficultyScore !== null && currentDifficultyScore > bestScore)) {
        bestScore = currentDifficultyScore;
        if (!updated) {
            bestSeed = currentSeed;
        }
        updated = true;
    }
    
    if (updated) {
        saveBestScores(bestTime, bestMoves, bestSeed, currentDifficultyScore, bestScore);
    }
    
    updateDisplay();
}
