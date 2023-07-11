// Constants
let SIZE_X = 7;
let SIZE_Y = 5;
let CELL_SIZE = 100;
let SCREEN_WIDTH = SIZE_X * CELL_SIZE;
let SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;

// Colors
const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';

// Initialize the canvas
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
context.font = '36px Monospace';
context.textAlign = 'center';

let matrix;

function generateMatrix() {
    return Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill(0));
}

function resetMatrix() {
    matrix = generateMatrix();
    // Generate a valid solution by applying random actions
    for (let i = 0; i < SIZE_X * SIZE_Y; i++) {
        const x = Math.floor(Math.random() * SIZE_X);
        const y = Math.floor(Math.random() * SIZE_Y);
        action(x, y);
    }
}

function action(x, y) {  // select coordinates, flip the value of the cell and its neighbors
    if (x < 0 || x >= SIZE_X || y < 0 || y >= SIZE_Y) {
        return -1;
    } else {
        matrix[x][y] = flip(matrix[x][y]);
        if (x > 0) {
            matrix[x - 1][y] = flip(matrix[x - 1][y]);
        }
        if (x < SIZE_X - 1) {
            matrix[x + 1][y] = flip(matrix[x + 1][y]);
        }
        if (y > 0) {
            matrix[x][y - 1] = flip(matrix[x][y - 1]);
        }
        if (y < SIZE_Y - 1) {
            matrix[x][y + 1] = flip(matrix[x][y + 1]);
        }
        return 0;
    }
}

function flip(num) {  // flip the value of a cell
    return 1 - num;
}

function drawMatrix() {
    for (let i = 0; i < SIZE_X; i++) {
        for (let j = 0; j < SIZE_Y; j++) {
            const rectX = i * CELL_SIZE;
            const rectY = j * CELL_SIZE;
            const color = matrix[i][j] === 1 ? WHITE : BLACK;
            context.fillStyle = color;
            context.fillRect(rectX, rectY, CELL_SIZE, CELL_SIZE);
        }
    }
}

function checkWin() {
    return matrix.every(col => col.every(row => row === 0));
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
    context.textAlign = 'center';
}

// Generate initial scramble
resetMatrix();

// Call resizeCanvas once to initialize the canvas size
resizeCanvas();

// Add event listener to resize the canvas when the window size changes
window.addEventListener('resize', resizeCanvas);

// Main game loop
function gameLoop() {
    // Clear the screen
    context.fillStyle = BLACK;
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw the matrix
    drawMatrix();

    // Check if all lights are off
    if (checkWin()) {
        // Display "You won!" message
        context.fillStyle = WHITE;
        context.fillText('You won!', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Handle mouse clicks
canvas.addEventListener('mousedown', event => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE);

    if (0 <= x && x < SIZE_X && 0 <= y && y < SIZE_Y) {
        // Flip the cell and its neighbors
        action(x, y);
    }
});

// Handle key presses
document.addEventListener('keydown', event => {
    if (event.key === 'r') {
        // Generate new scramble on "R" key press
        resetMatrix();
    } else if (event.key === 'i') {
        // Reset canvas and matrix on "I" key press
        const newX = parseInt(prompt('Enter new width:'));
        const newY = parseInt(prompt('Enter new height:'));
        if (!isNaN(newX) && !isNaN(newY) && newX > 0 && newY > 0) {
            SIZE_X = newX;
            SIZE_Y = newY;
            CELL_SIZE = Math.min(SCREEN_WIDTH / SIZE_X, SCREEN_HEIGHT / SIZE_Y);
            resetMatrix();
            resizeCanvas();
        } else {
            alert('Invalid input. Please enter valid numbers.');
        }
    }
});
