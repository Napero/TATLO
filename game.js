// Constants
let SIZE_X = 7;
let SIZE_Y = 5;
let CELL_SIZE = 100;
let SCREEN_WIDTH = SIZE_X * CELL_SIZE;
let SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;
let COLORS = 2; // Default is 2 for black and white
let rainbowColors = [];

// Default values
const DEFAULT_SIZE_X = 7;
const DEFAULT_SIZE_Y = 5;
const DEFAULT_COLORS = 2;

// Flip Pattern System - stores relative offsets from clicked cell
// Default is cross pattern: center + up + down + left + right
const DEFAULT_FLIP_PATTERN = [
    { dx: 0, dy: 0 },   // center
    { dx: -1, dy: 0 },  // left
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: -1 },  // up
    { dx: 0, dy: 1 }    // down
];

let flipPattern = [...DEFAULT_FLIP_PATTERN];

function getPatternGridSize() {
    const maxDim = Math.max(SIZE_X, SIZE_Y);
    // Ensure odd number for center cell
    return maxDim % 2 === 0 ? maxDim - 1 : maxDim;
}

// Modal System
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalError = document.getElementById('modalError');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const modalReset = document.getElementById('modalReset');

function showModal(title, inputs, onConfirm, defaults = null) {
    modalTitle.textContent = title;
    modalError.classList.remove('active');
    
    // Show/hide reset button based on whether defaults are provided
    if (defaults) {
        modalReset.classList.add('visible');
        // Set tooltip with default values
        const defaultsText = inputs.map((input, i) => {
            const label = input.label.replace(/\s*\(.*?\)\s*:?\s*/, ''); // Remove range info
            return `${label}: ${defaults[i]}`;
        }).join(', ');
        modalReset.title = `Reset to defaults (${defaultsText})`;
    } else {
        modalReset.classList.remove('visible');
        modalReset.title = '';
    }
    
    // Build input fields
    modalContent.innerHTML = '';
    inputs.forEach((input, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'modal-input-group';
        
        const label = document.createElement('label');
        label.className = 'modal-label';
        label.textContent = input.label;
        label.setAttribute('for', `modal-input-${index}`);
        
        const inputField = document.createElement('input');
        inputField.className = 'modal-input';
        inputField.id = `modal-input-${index}`;
        inputField.type = input.type || 'text';
        inputField.value = input.defaultValue || '';
        inputField.placeholder = input.placeholder || '';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(inputField);
        modalContent.appendChild(inputGroup);
    });
    
    // Show modal
    modalOverlay.classList.add('active');
    
    // Focus first input
    const firstInput = modalContent.querySelector('.modal-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Handle reset to defaults
    const resetHandler = () => {
        if (defaults) {
            const inputFields = modalContent.querySelectorAll('.modal-input');
            defaults.forEach((defaultValue, index) => {
                if (inputFields[index]) {
                    inputFields[index].value = defaultValue;
                }
            });
        }
    };
    
    // Handle confirm
    const confirmHandler = () => {
        const values = Array.from(modalContent.querySelectorAll('.modal-input')).map(input => input.value);
        const result = onConfirm(values);
        
        if (result === false) {
            // Validation failed
            modalError.classList.add('active');
        } else {
            // Success - close modal
            hideModal();
            cleanup();
        }
    };
    
    // Handle cancel
    const cancelHandler = () => {
        hideModal();
        cleanup();
    };
    
    // Handle Enter key
    const keyHandler = (e) => {
        if (e.key === 'Enter') {
            confirmHandler();
        } else if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
        modalReset.removeEventListener('click', resetHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    modalCancel.addEventListener('click', cancelHandler);
    modalReset.addEventListener('click', resetHandler);
    document.addEventListener('keydown', keyHandler);
}

function hideModal() {
    modalOverlay.classList.remove('active');
    modalError.classList.remove('active');
}

// Grid Selector Modal for flip pattern
function showGridSelector(onConfirm) {
    const gridSize = getPatternGridSize();
    const center = Math.floor(gridSize / 2);
    
    modalTitle.textContent = 'Select Flip Pattern';
    modalError.classList.remove('active');
    
    // Show reset button for grid selector
    modalReset.classList.add('visible');
    modalReset.title = 'Reset to default pattern (cross)';
    
    // Create grid
    modalContent.innerHTML = '<div class="pattern-grid-container"></div>';
    const gridContainer = modalContent.querySelector('.pattern-grid-container');
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${gridSize}, 1fr);
        gap: 4px;
        max-width: 400px;
        margin: 0 auto;
    `;
    
    // Initialize selection state based on current flipPattern
    const selected = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    
    function loadPattern(pattern) {
        // Clear current selection
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                selected[x][y] = false;
            }
        }
        // Load pattern
        pattern.forEach(({ dx, dy }) => {
            const gridX = center + dx;
            const gridY = center + dy;
            if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
                selected[gridX][gridY] = true;
            }
        });
        // Update cells visually
        updateCells();
    }
    
    function updateCells() {
        const cells = gridContainer.querySelectorAll('.pattern-cell');
        let index = 0;
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = cells[index];
                if (cell) {
                    if (selected[x][y]) {
                        cell.classList.add('selected');
                    } else {
                        cell.classList.remove('selected');
                    }
                }
                index++;
            }
        }
    }
    
    // Load current pattern
    loadPattern(flipPattern);
    
    // Create cells
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'pattern-cell';
            const isCenter = (x === center && y === center);
            
            if (isCenter) {
                cell.classList.add('center');
            }
            
            if (selected[x][y]) {
                cell.classList.add('selected');
            }
            
            cell.addEventListener('click', () => {
                selected[x][y] = !selected[x][y];
                cell.classList.toggle('selected');
            });
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Show modal
    modalOverlay.classList.add('active');
    
    // Handle reset to default pattern
    const resetHandler = () => {
        loadPattern(DEFAULT_FLIP_PATTERN);
    };
    
    // Handle confirm
    const confirmHandler = () => {
        // Build new flip pattern from selected cells
        const newPattern = [];
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (selected[x][y]) {
                    newPattern.push({
                        dx: x - center,
                        dy: y - center
                    });
                }
            }
        }
        
        // Allow empty pattern (flips nothing)
        flipPattern = newPattern;
        hideModal();
        modalReset.classList.remove('visible');
        cleanup();
        onConfirm();
    };
    
    // Handle cancel
    const cancelHandler = () => {
        hideModal();
        modalReset.classList.remove('visible');
        cleanup();
    };
    
    // Handle Enter key
    const keyHandler = (e) => {
        if (e.key === 'Enter') {
            confirmHandler();
        } else if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
        modalReset.removeEventListener('click', resetHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    modalCancel.addEventListener('click', cancelHandler);
    modalReset.addEventListener('click', resetHandler);
    document.addEventListener('keydown', keyHandler);
}

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

let gameWon = false;
let gameStarted = false;
let moveCount = 0;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

// Generate a unique key for the current game configuration
function getConfigKey() {
    const patternKey = flipPattern.map(p => `${p.dx},${p.dy}`).sort().join('|');
    return `${SIZE_X}x${SIZE_Y}_c${COLORS}_p${patternKey}`;
}

// Load best scores from localStorage for current config
function loadBestScores() {
    const key = getConfigKey();
    bestTime = localStorage.getItem(`tatlo_bestTime_${key}`) ? parseInt(localStorage.getItem(`tatlo_bestTime_${key}`)) : null;
    bestMoves = localStorage.getItem(`tatlo_bestMoves_${key}`) ? parseInt(localStorage.getItem(`tatlo_bestMoves_${key}`)) : null;
}

// Save best scores to localStorage for current config
function saveBestScores() {
    const key = getConfigKey();
    if (bestTime !== null) {
        localStorage.setItem(`tatlo_bestTime_${key}`, bestTime);
    }
    if (bestMoves !== null) {
        localStorage.setItem(`tatlo_bestMoves_${key}`, bestMoves);
    }
}

let bestTime = null;
let bestMoves = null;

function generateMatrix() {
    return Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill(0));
}

let scrambleSequence = [];

function resetMatrix() {
    generateColors(); // Ensure colors are generated based on the current COLORS value
    matrix = generateMatrix();
    scrambleSequence = [];
    gameWon = false; // Reset win state
    gameStarted = false; // Reset game started state
    moveCount = 0;
    elapsedTime = 0;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    loadBestScores(); // Load best scores for current config
    updateDisplay();
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
    // Don't allow clicks if game is won
    if (gameWon) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE);

    if (0 <= x && x < SIZE_X && 0 <= y && y < SIZE_Y) {
        // Start timer on first move
        if (!gameStarted) {
            gameStarted = true;
            startTime = Date.now();
            timerInterval = setInterval(() => {
                if (gameStarted && !gameWon) {
                    elapsedTime = Date.now() - startTime;
                    updateDisplay();
                }
            }, 100);
        }
        
        const reverse = event.shiftKey;
        action(x, y, reverse);
        moveCount++;
        updateDisplay();
        
        // Check for win after action
        if (checkWin()) {
            gameWon = true;
            gameStarted = false;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            // Update best scores
            const finalTime = elapsedTime;
            if (bestTime === null || finalTime < bestTime) {
                bestTime = finalTime;
            }
            if (bestMoves === null || moveCount < bestMoves) {
                bestMoves = moveCount;
            }
            saveBestScores(); // Save best scores for current config
            updateDisplay();
        }
    }
});

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

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Show centiseconds (2 digits)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

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
}

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

// Generate initial colors and matrix
loadBestScores(); // Load best scores for initial config
resetMatrix();
resizeCanvas();
updateDisplay();

window.addEventListener('resize', resizeCanvas);

function gameLoop() {
    // Clear the screen
    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw the matrix
    drawMatrix();

    // Update canvas cursor based on game state
    if (gameWon) {
        canvas.classList.add('game-won');
    } else {
        canvas.classList.remove('game-won');
    }

    // Check if all tiles are the same color
    if (gameWon) {
        // Determine the final color
        const winningColor = rainbowColors[matrix[0][0]];
        
        // Draw semi-transparent overlay
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Set text color and message based on the winning color
        let message = 'You won!';
        if (winningColor === '#FFFFFF') {
            message = 'You won?';
        }
        
        // Draw victory text with shadow for better visibility
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(message, SCREEN_WIDTH / 2 + 2, SCREEN_HEIGHT / 2 + 2);
        
        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillText(message, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        
        // Draw hint text
        context.font = `${CELL_SIZE / 4}px Monospace`;
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillText('Press R or click New Scramble to play again', SCREEN_WIDTH / 2 + 1, SCREEN_HEIGHT / 2 + CELL_SIZE + 1);
        context.fillStyle = 'rgb(200, 200, 200)';
        context.fillText('Press R or click New Scramble to play again', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + CELL_SIZE);
        context.font = `${CELL_SIZE / 2}px Monospace`;
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

gameLoop();

document.addEventListener('keydown', event => {
    if (event.key === 'r') {
        resetMatrix();
    } else if (event.key === 'i') {
        showModal('Set Grid Size', [
            { label: 'Width (1-50):', type: 'number', defaultValue: SIZE_X, placeholder: 'Enter width' },
            { label: 'Height (1-50):', type: 'number', defaultValue: SIZE_Y, placeholder: 'Enter height' }
        ], (values) => {
            const newX = parseInt(values[0]);
            const newY = parseInt(values[1]);
            if (!isNaN(newX) && !isNaN(newY) && newX > 0 && newY > 0 && newX <= 50 && newY <= 50) {
                SIZE_X = newX;
                SIZE_Y = newY;
                resetMatrix();
                resizeCanvas();
                return true; // Success
            }
            return false; // Validation failed
        }, [DEFAULT_SIZE_X, DEFAULT_SIZE_Y]);
    } else if (event.key === 'c') {
        showModal('Set Number of Colors', [
            { label: 'Number of colors (2-256):', type: 'number', defaultValue: COLORS, placeholder: 'Enter number of colors' }
        ], (values) => {
            const newColors = parseInt(values[0]);
            if (!isNaN(newColors) && newColors > 1 && newColors <= 256) {
                COLORS = newColors;
                generateColors();
                resetMatrix();
                return true; // Success
            }
            return false; // Validation failed
        }, [DEFAULT_COLORS]);
    } else if (event.key === 's') {
        showGridSelector(() => {
            // Regenerate scramble with new pattern
            resetMatrix();
        });
    }
});

// UI Button Handlers
const btnNewScramble = document.getElementById('btnNewScramble');
const btnCustomize = document.getElementById('btnCustomize');
const btnInfo = document.getElementById('btnInfo');
const customizeMenu = document.getElementById('customizeMenu');
const btnGridSize = document.getElementById('btnGridSize');
const btnColors = document.getElementById('btnColors');
const btnPattern = document.getElementById('btnPattern');

// New Scramble button
btnNewScramble.addEventListener('click', () => {
    resetMatrix();
});

// Customize menu toggle
btnCustomize.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = customizeMenu.classList.toggle('active');
    
    if (isActive) {
        // Position menu below the button, aligned to the right
        const rect = btnCustomize.getBoundingClientRect();
        customizeMenu.style.top = `${rect.bottom + 5}px`;
        customizeMenu.style.left = 'auto';
        customizeMenu.style.right = `${window.innerWidth - rect.right}px`;
    }
});

// Close customize menu when clicking outside
document.addEventListener('click', (e) => {
    if (!customizeMenu.contains(e.target) && e.target !== btnCustomize) {
        customizeMenu.classList.remove('active');
    }
});

// Grid Size button
btnGridSize.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    showModal('Set Grid Size', [
        { label: 'Width (1-50):', type: 'number', defaultValue: SIZE_X, placeholder: 'Enter width' },
        { label: 'Height (1-50):', type: 'number', defaultValue: SIZE_Y, placeholder: 'Enter height' }
    ], (values) => {
        const newX = parseInt(values[0]);
        const newY = parseInt(values[1]);
        if (!isNaN(newX) && !isNaN(newY) && newX > 0 && newY > 0 && newX <= 50 && newY <= 50) {
            SIZE_X = newX;
            SIZE_Y = newY;
            resetMatrix();
            resizeCanvas();
            return true;
        }
        return false;
    }, [DEFAULT_SIZE_X, DEFAULT_SIZE_Y]);
});

// Colors button
btnColors.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    showModal('Set Number of Colors', [
        { label: 'Number of colors (2-256):', type: 'number', defaultValue: COLORS, placeholder: 'Enter number of colors' }
    ], (values) => {
        const newColors = parseInt(values[0]);
        if (!isNaN(newColors) && newColors > 1 && newColors <= 256) {
            COLORS = newColors;
            generateColors();
            resetMatrix();
            return true;
        }
        return false;
    }, [DEFAULT_COLORS]);
});

// Click Pattern button
btnPattern.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    showGridSelector(() => {
        resetMatrix();
    });
});

// Reset All button
const btnResetAll = document.getElementById('btnResetAll');
btnResetAll.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    
    // Reset all settings to defaults
    SIZE_X = DEFAULT_SIZE_X;
    SIZE_Y = DEFAULT_SIZE_Y;
    COLORS = DEFAULT_COLORS;
    flipPattern = [...DEFAULT_FLIP_PATTERN];
    
    // Regenerate game with defaults
    generateColors();
    resetMatrix();
    resizeCanvas();
});

// Info button - shows game information from README
btnInfo.addEventListener('click', () => {
    modalTitle.textContent = 'About TATLO';
    modalError.classList.remove('active');
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.6;">
            <p><strong>Turn All The Lights Off!</strong></p>
            <p>The objective is to turn all the cells to the same color (default: all black).</p>
            
            <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">How to Play</h3>
            <ul style="margin-left: 20px;">
                <li>Click a cell to flip it and its neighbors</li>
                <li>With 3+ colors: Shift+Click cycles colors backwards</li>
                <li>Any color can be the target color</li>
            </ul>
            
            <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Controls</h3>
            <ul style="margin-left: 20px;">
                <li><strong>R</strong> - Generate new scramble</li>
                <li><strong>I</strong> - Set grid size (default: 7×5)</li>
                <li><strong>C</strong> - Set number of colors (default: 2)</li>
                <li><strong>S</strong> - Customize click pattern (default: cross)</li>
            </ul>
            
            <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Links</h3>
            <p>
                <a href="https://docs.google.com/document/d/e/2PACX-1vQneouQdbkZ96iV2srNMGTnXVfWiv2udaHyaH42FEdILTS3m1OUxKTd7ozuHwPWGi-8a8WlB51sK-QU/pub" target="_blank" style="color: #88ccff;">7×5 Solution</a>
            </p>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    
    // Only show Confirm button for info
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Got it!';
    
    const confirmHandler = () => {
        hideModal();
        modalCancel.style.display = '';
        modalConfirm.textContent = 'Confirm';
        cleanup();
    };
    
    const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            confirmHandler();
        }
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    document.addEventListener('keydown', keyHandler);
});


