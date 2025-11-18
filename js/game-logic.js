// Game Logic

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
context.font = '36px Monospace';
context.textAlign = 'center';

let matrix;
let scrambleSequence = [];
let gameWon = false;

// Generate colors based on the current COLORS value
function generateColors() {
    if (COLORS == 2) {
        rainbowColors = ['#000000', '#FFFFFF'];
    } else {
        rainbowColors = Array.from({ length: COLORS }, (_, i) => {
            const hue = Math.floor((i / COLORS) * 360);
            return `hsl(${hue}, 100%, 50%)`;
        });
    }
}

// Generate an empty matrix
function generateMatrix() {
    return Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill(0));
}

// Reset the game matrix with random scrambling
function resetMatrix(seed = null) {
    generateColors(); // Ensure colors are generated based on the current COLORS value
    matrix = generateMatrix();
    scrambleSequence = [];
    gameWon = false; // Reset win state
    resetTimerAndMoves(); // Reset timer and move counter
    stopSolver(); // Stop solver if active
    hideGiveUpButton(); // Hide give up button
    hideAutoClickButton(); // Hide auto-click button
    autoSolveCompleted = false; // Reset auto-solve flag
    
    // In set seed mode, use the stored seed; otherwise generate new seed
    if (isSetSeedMode && seed === null) {
        seed = setSeedValue;
    } else if (seed === null) {
        seed = Math.floor(Math.random() * 1000000000);
    }
    
    currentSeed = generateSeedString(seed);
    
    // Use seeded random for reproducible scrambles
    const rng = seededRandom(seed);
    let steps = SIZE_X * SIZE_Y * Math.pow(COLORS, 2);
    
    for (let i = 0; i < steps; i++) {
        const x = Math.floor(rng() * SIZE_X);
        const y = Math.floor(rng() * SIZE_Y);
        action(x, y);
        scrambleSequence.push({ x, y });
    }

    drawMatrix();
    updateNewScrambleButton();
}

// Flip a cell's color forward or backward
function flip(num, reverse = false) {
    if (reverse) {
        return (num - 1 + COLORS) % COLORS; // Cycle backwards
    } else {
        return (num + 1) % COLORS; // Cycle forwards
    }
}

// Perform a flip action at position (x, y) based on the flip pattern
function action(x, y, reverse = false) {
    if (x < 0 || x >= SIZE_X || y < 0 || y >= SIZE_Y) {
        return -1;
    } else {
        // Apply flip pattern
        flipPattern.forEach(({ dx, dy }) => {
            const targetX = x + dx;
            const targetY = y + dy;
            
            // Check bounds
            if (targetX >= 0 && targetX < SIZE_X && targetY >= 0 && targetY < SIZE_Y) {
                matrix[targetX][targetY] = flip(matrix[targetX][targetY], reverse);
            }
        });
    }
}

// Draw the current matrix on the canvas
function drawMatrix() {
    for (let i = 0; i < SIZE_X; i++) {
        for (let j = 0; j < SIZE_Y; j++) {
            const rectX = i * CELL_SIZE;
            const rectY = j * CELL_SIZE;
            const color = rainbowColors[matrix[i][j]];
            context.fillStyle = color;
            context.fillRect(rectX, rectY, CELL_SIZE, CELL_SIZE);
        }
    }
}

// Check if the game is won (all cells same color)
function checkWin() {
    const targetColor = matrix[0][0];
    return matrix.every(col => col.every(row => row === targetColor));
}

// Resize canvas to fit the available space
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const availableWidth = wrapper.clientWidth - 20; // Account for padding (10px each side)
    const availableHeight = wrapper.clientHeight - 20; // Account for padding (10px each side)
    const cellSizeX = Math.floor(availableWidth / SIZE_X);
    const cellSizeY = Math.floor(availableHeight / SIZE_Y);
    CELL_SIZE = Math.min(cellSizeX, cellSizeY, 150); // Max cell size of 150
    SCREEN_WIDTH = SIZE_X * CELL_SIZE;
    SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    context.font = `${CELL_SIZE / 2}px Monospace`;
}

// Main game loop
function gameLoop() {
    // Clear the screen
    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw the matrix
    drawMatrix();
    
    // Draw solver hint if active
    if (solverActive && hintOverlay) {
        drawHint();
    }
    
    // Update canvas cursor based on game state
    if (gameWon) {
        canvas.classList.add('game-won');
    } else {
        canvas.classList.remove('game-won');
    }

    requestAnimationFrame(gameLoop);
}
