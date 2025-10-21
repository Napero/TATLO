// Constants
let SIZE_X = 7;
let SIZE_Y = 5;
let CELL_SIZE = 100;
let SCREEN_WIDTH = SIZE_X * CELL_SIZE;
let SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;
let COLORS = 2; // Default is 2 for black and white
let rainbowColors = [];

// Game modes
const GAME_MODES = {
    CROSS: 'Cross',    // Flip cell + orthogonal neighbors (original mode)
    X: 'X',            // Flip cell + diagonal neighbors
    PLUS: 'Plus'       // Flip cell + all 8 neighbors
};
let currentMode = GAME_MODES.CROSS;

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

// Initialize the canvas
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
context.font = '36px Monospace';
context.textAlign = 'center';

let matrix;

function generateMatrix() {
    return Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill(0));
}

let scrambleSequence = [];

function resetMatrix() {
    generateColors(); // Ensure colors are generated based on the current COLORS value
    matrix = generateMatrix();
    scrambleSequence = [];
    let steps = SIZE_X * SIZE_Y * Math.pow(COLORS, 2);
    
    for (let i = 0; i < steps; i++) {
        const x = Math.floor(Math.random() * SIZE_X);
        const y = Math.floor(Math.random() * SIZE_Y);
        action(x, y);
        scrambleSequence.push({ x, y });
    }

    drawMatrix();
}

function flip(num, reverse = false) {
    if (reverse) {
        return (num - 1 + COLORS) % COLORS; // Cycle backwards
    } else {
        return (num + 1) % COLORS; // Cycle forwards
    }
}

// Detect shift-click for backward cycling
canvas.addEventListener('mousedown', event => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE);

    if (0 <= x && x < SIZE_X && 0 <= y && y < SIZE_Y) {
        const reverse = event.shiftKey;
        action(x, y, reverse);
    }
});

function action(x, y, reverse = false) {
    if (x < 0 || x >= SIZE_X || y < 0 || y >= SIZE_Y) {
        return -1;
    } else {
        // Always flip the clicked cell
        matrix[x][y] = flip(matrix[x][y], reverse);
        
        // Apply mode-specific neighbor flips
        if (currentMode === GAME_MODES.CROSS || currentMode === GAME_MODES.PLUS) {
            // Flip orthogonal neighbors (up, down, left, right)
            if (x > 0) {
                matrix[x - 1][y] = flip(matrix[x - 1][y], reverse);
            }
            if (x < SIZE_X - 1) {
                matrix[x + 1][y] = flip(matrix[x + 1][y], reverse);
            }
            if (y > 0) {
                matrix[x][y - 1] = flip(matrix[x][y - 1], reverse);
            }
            if (y < SIZE_Y - 1) {
                matrix[x][y + 1] = flip(matrix[x][y + 1], reverse);
            }
        }
        
        if (currentMode === GAME_MODES.X || currentMode === GAME_MODES.PLUS) {
            // Flip diagonal neighbors
            if (x > 0 && y > 0) {
                matrix[x - 1][y - 1] = flip(matrix[x - 1][y - 1], reverse);
            }
            if (x > 0 && y < SIZE_Y - 1) {
                matrix[x - 1][y + 1] = flip(matrix[x - 1][y + 1], reverse);
            }
            if (x < SIZE_X - 1 && y > 0) {
                matrix[x + 1][y - 1] = flip(matrix[x + 1][y - 1], reverse);
            }
            if (x < SIZE_X - 1 && y < SIZE_Y - 1) {
                matrix[x + 1][y + 1] = flip(matrix[x + 1][y + 1], reverse);
            }
        }
    }
}

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

function checkWin() {
    const targetColor = matrix[0][0];
    return matrix.every(col => col.every(row => row === targetColor));
}

function cycleGameMode() {
    const modes = Object.values(GAME_MODES);
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    currentMode = modes[nextIndex];
}

function resizeCanvas() {
    const availableWidth = canvas.parentElement.clientWidth;
    const availableHeight = canvas.parentElement.clientHeight;
    const cellSizeX = Math.floor(availableWidth / SIZE_X);
    const cellSizeY = Math.floor(availableHeight / SIZE_Y);
    CELL_SIZE = Math.min(cellSizeX, cellSizeY);
    SCREEN_WIDTH = SIZE_X * CELL_SIZE;
    SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    context.font = `${CELL_SIZE / 2}px Monospace`;
}

// Generate initial colors and matrix
resetMatrix();
resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function gameLoop() {
    // Clear the screen
    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    context.message = 'You won!'

    // Draw the matrix
    drawMatrix();

    // Display current game mode in top-left corner
    context.save();
    context.font = `${CELL_SIZE / 4}px Monospace`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = 'rgba(128, 128, 128, 0.7)';
    context.fillText(`Mode: ${currentMode}`, 10, 10);
    context.restore();

    // Check if all tiles are the same color
    if (checkWin()) {
        // Determine the final color
        const winningColor = rainbowColors[matrix[0][0]];

        // Set text color and message based on the winning color
        if (winningColor === '#FFFFFF') {
            context.message = 'You won?'
            context.fillStyle = 'rgb(0, 0, 0)'
        } else {
            context.fillStyle = 'rgb(255, 255, 255)'
        }

        // Center the "You won!" text
        context.textAlign = 'center'; // Center text horizontally
        context.textBaseline = 'middle'; // Center text vertically
        context.fillText(context.message, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

gameLoop();

document.addEventListener('keydown', event => {
    if (event.key === 'r') {
        resetMatrix();
    } else if (event.key === 'i') {
        const newX = parseInt(prompt('Enter new width:'));
        const newY = parseInt(prompt('Enter new height:'));
        if (!isNaN(newX) && !isNaN(newY) && newX > 0 && newY > 0) {
            SIZE_X = newX;
            SIZE_Y = newY;
            resetMatrix();
            resizeCanvas();
        } else {
            alert('Invalid input. Please enter valid numbers.');
        }
    } else if (event.key === 'c') {
        const newColors = parseInt(prompt('Enter amount of colors: '));
        if (!isNaN(newColors) && newColors > 1 && newColors <= 256) { // Limit colors for practical use
            COLORS = newColors;
            generateColors();
            resetMatrix();
        } else {
            alert('Invalid input. Please enter valid numbers.');
        }
    } else if (event.key === 'm') {
        cycleGameMode();
        resetMatrix(); // Reset the board when changing modes
    }
});
