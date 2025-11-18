// Main Entry Point - Initialization and Event Handlers

// Victory Modal
const victoryOverlay = document.getElementById('victoryOverlay');
const victoryTitle = document.getElementById('victoryTitle');
const victoryTime = document.getElementById('victoryTime');
const victoryMoves = document.getElementById('victoryMoves');
const victoryScore = document.getElementById('victoryScore');
const victoryDifficulty = document.getElementById('victoryDifficulty');
const victoryMessage = document.getElementById('victoryMessage');
const victoryGridSize = document.getElementById('victoryGridSize');
const victoryColors = document.getElementById('victoryColors');
const victoryPattern = document.getElementById('victoryPattern');
const victorySeed = document.getElementById('victorySeed');
const victoryNewGame = document.getElementById('victoryNewGame');

// Live Difficulty Display
const difficultyEmoji = document.getElementById('difficultyEmoji');
const difficultyScore = document.getElementById('difficultyScore');

function updateDifficultyDisplay() {
    if (!difficultyEmoji || !difficultyScore) return;
    
    // Check if scoring functions are available
    if (typeof calculateScore !== 'function' || typeof formatScore !== 'function') {
        return;
    }
    
    try {
        const scoreData = calculateScore();
        difficultyEmoji.textContent = scoreData.difficulty.emoji;
        difficultyScore.textContent = formatScore(scoreData.totalScore);
        difficultyScore.style.color = scoreData.difficulty.color;
    } catch (error) {
        console.error('Error updating difficulty display:', error);
    }
}

function showVictoryModal() {
    console.log('showVictoryModal called'); // Debug
    console.log('autoSolveCompleted:', autoSolveCompleted); // Debug
    
    // Determine the final color
    const winningColor = rainbowColors[matrix[0][0]];
    
    // Set title based on auto-solve status or winning color
    if (autoSolveCompleted) {
        victoryTitle.textContent = 'Auto-solve completed!';
        console.log('Setting auto-solve title'); // Debug
    } else if (winningColor === '#FFFFFF') {
        victoryTitle.textContent = 'You won?';
    } else {
        victoryTitle.textContent = 'You won!';
    }
    
    // Format time display
    const totalSeconds = Math.floor(elapsedTime / 1000); // Convert milliseconds to seconds
    const milliseconds = elapsedTime % 1000; // Get remaining milliseconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const ms = String(milliseconds).padStart(3, '0');
    
    // Show NONE for auto-solve, actual time for normal wins
    if (autoSolveCompleted) {
        victoryTime.textContent = 'NONE';
        victoryMoves.textContent = moveCount;
    } else {
        victoryTime.textContent = `${minutes}:${seconds}.${ms}`;
        victoryMoves.textContent = moveCount;
    }
    
    // Set game configuration
    victoryGridSize.textContent = `${SIZE_X}×${SIZE_Y}`;
    victoryColors.textContent = COLORS;
    
    // Set pattern description
    const patternSize = getPatternGridSize();
    const patternCells = flipPattern.length;
    victoryPattern.textContent = `${patternSize}×${patternSize} (${patternCells} cells)`;
    
    // Set seed
    victorySeed.textContent = currentSeed;
    
    // Calculate and display score
    const scoreData = calculateScore();
    victoryScore.textContent = formatScore(scoreData.totalScore);
    
    // Display difficulty rating
    victoryDifficulty.innerHTML = `
        <span class="victory-difficulty-emoji">${scoreData.difficulty.emoji}</span>
        <span class="victory-difficulty-name">${scoreData.difficulty.name}</span>
    `;
    victoryDifficulty.style.borderColor = scoreData.difficulty.color;
    
    // Set message based on performance
    if (autoSolveCompleted) {
        victoryMessage.textContent = 'Solution completed. Stats not saved.';
    } else {
        const scores = loadBestScores();
        if (scores.bestTime === null || elapsedTime < scores.bestTime) {
            victoryMessage.textContent = '🎉 New best time! 🎉';
        } else if (scores.bestMoves === null || moveCount < scores.bestMoves) {
            victoryMessage.textContent = '🎉 New best moves! 🎉';
        } else {
            victoryMessage.textContent = 'Great job! Press R or click below to play again';
        }
    }
    
    // Update button text based on set seed mode
    if (isSetSeedMode) {
        victoryNewGame.innerHTML = '<span>🔄</span> Reset Set Seed';
    } else {
        victoryNewGame.innerHTML = '<span>🎲</span> New Scramble';
    }
    
    // Show modal
    victoryOverlay.classList.add('active');
    console.log('Victory modal shown'); // Debug
}

function hideVictoryModal() {
    victoryOverlay.classList.remove('active');
}

// Update logo based on number of colors
function updateLogo() {
    const gameLogo = document.getElementById('gameLogo');
    if (gameLogo) {
        if (COLORS > 2) {
            gameLogo.src = 'logo-rainbow.svg';
        } else {
            gameLogo.src = 'logo.svg';
        }
    }
}

// Show/hide Give Up button
function showGiveUpButton() {
    const btnGiveUp = document.getElementById('btnGiveUp');
    if (btnGiveUp) {
        btnGiveUp.style.display = 'block';
    }
}

function hideGiveUpButton() {
    const btnGiveUp = document.getElementById('btnGiveUp');
    if (btnGiveUp) {
        btnGiveUp.style.display = 'none';
    }
}

// Show/hide Auto-click button
function showAutoClickButton() {
    const btnAutoClick = document.getElementById('btnAutoClick');
    if (btnAutoClick) {
        btnAutoClick.style.display = 'block';
    }
}

function hideAutoClickButton() {
    const btnAutoClick = document.getElementById('btnAutoClick');
    if (btnAutoClick) {
        btnAutoClick.style.display = 'none';
        btnAutoClick.classList.remove('active');
    }
}

// Initialize game on load
function initGame() {
    // Load best scores for initial config
    const scores = loadBestScores();
    bestTime = scores.bestTime;
    bestMoves = scores.bestMoves;
    
    // Generate initial colors and matrix
    resetMatrix();
    resizeCanvas();
    updateDisplay();
    updateLogo();
    hideGiveUpButton();
    hideAutoClickButton();
    hideVictoryModal();
    
    // Start game loop
    gameLoop();
    
    // Update difficulty display after a short delay to ensure all scripts are loaded
    setTimeout(() => {
        updateDifficultyDisplay();
    }, 100);
    
    // Window resize handler
    window.addEventListener('resize', resizeCanvas);
    
    // Victory modal buttons
    victoryNewGame.addEventListener('click', () => {
        hideVictoryModal();
        stopSolver();
        hideGiveUpButton();
        resetMatrix();
    });
    
    // Click to copy seed
    victorySeed.addEventListener('click', () => {
        const seedText = victorySeed.textContent;
        navigator.clipboard.writeText(seedText).then(() => {
            const originalText = victorySeed.textContent;
            victorySeed.textContent = '✓ Copied!';
            setTimeout(() => {
                victorySeed.textContent = originalText;
            }, 1000);
        }).catch(err => {
            console.error('Failed to copy seed:', err);
        });
    });
}

// Canvas click handler
canvas.addEventListener('mousedown', event => {
    // Don't allow clicks if game is won
    if (gameWon) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE);

    if (0 <= x && x < SIZE_X && 0 <= y && y < SIZE_Y) {
        // If solver is active, check if this is the correct move
        if (solverActive) {
            const correctMove = handleSolverClick(x, y);
            if (correctMove) {
                // Execute the move
                const reverse = event.shiftKey;
                action(x, y, reverse);
                moveCount++;
                updateDisplay();
                
                // Check for win after action
                if (checkWin()) {
                    gameWon = true;
                    canvas.classList.add('game-won');
                    hideAutoClickButton();
                    stopSolver();
                    showVictoryModal();
                }
            }
            return; // Don't allow other clicks in solver mode
        }
        
        // Start timer on first move
        if (!gameStarted) {
            startTimer();
            showGiveUpButton();
        }
        
        const reverse = event.shiftKey;
        action(x, y, reverse);
        moveCount++;
        updateDisplay();
        
        // Check for win after action
        if (checkWin()) {
            gameWon = true;
            stopTimer();
            canvas.classList.add('game-won');
            hideGiveUpButton();
            
            // Update best scores
            updateBestScores();
            
            // Show victory modal
            showVictoryModal();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', event => {
    // Don't handle shortcuts if a modal is open or victory screen is shown
    if (modalOverlay.classList.contains('active') || victoryOverlay.classList.contains('active')) {
        return;
    }
    
    if (event.key === 'r') {
        stopSolver();
        hideGiveUpButton();
        hideAutoClickButton();
        hideVictoryModal();
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
            if (!isNaN(newColors) && newColors === 1) {
                // Easter egg for 1 color - hide current modal first
                hideModal();
                // Show congratulations modal
                setTimeout(() => {
                    modalTitle.textContent = '🎉 OMG! World Record! 🎉';
                    modalContent.innerHTML = `
                        <div style="text-align: center; color: #d0d0d0; line-height: 1.8;">
                            <p style="font-size: 24px; margin: 20px 0;">🏆</p>
                            <p style="font-size: 18px; font-weight: bold; color: #ffdd00;">CONGRATULATIONS!</p>
                            <p>You've discovered the legendary <strong>ONE COLOR MODE</strong>!</p>
                            <p style="margin-top: 20px;">Every puzzle is instantly solved! 🎯</p>
                            <p style="font-size: 14px; color: #888; margin-top: 20px; font-style: italic;">
                                (But seriously, you need at least 2 colors to play)
                            </p>
                        </div>
                    `;
                    modalOverlay.classList.add('active');
                    modalCancel.style.display = 'none';
                    modalConfirm.textContent = 'Got it!';
                    
                    const closeHandler = () => {
                        hideModal();
                        modalCancel.style.display = '';
                        modalConfirm.textContent = 'Confirm';
                        modalConfirm.removeEventListener('click', closeHandler);
                    };
                    modalConfirm.addEventListener('click', closeHandler);
                }, 100);
                return true; // Close the input modal
            }
            if (!isNaN(newColors) && newColors > 1 && newColors <= 256) {
                COLORS = newColors;
                generateColors();
                resetMatrix();
                updateLogo();
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
const btnSeed = document.getElementById('btnSeed');
const btnLeaderboard = document.getElementById('btnLeaderboard');
const btnCustomize = document.getElementById('btnCustomize');
const btnInfo = document.getElementById('btnInfo');
const btnGiveUp = document.getElementById('btnGiveUp');
const customizeMenu = document.getElementById('customizeMenu');
const btnGridSize = document.getElementById('btnGridSize');
const btnColors = document.getElementById('btnColors');
const btnPattern = document.getElementById('btnPattern');
const btnResetAll = document.getElementById('btnResetAll');

// New Scramble button
btnNewScramble.addEventListener('click', () => {
    stopSolver();
    hideGiveUpButton();
    hideAutoClickButton();
    hideVictoryModal();
    resetMatrix();
    updateDifficultyDisplay();
});

// Give Up button
btnGiveUp.addEventListener('click', () => {
    hideGiveUpButton();
    showAutoClickButton();
    startSolver();
});

// Auto-click button
const btnAutoClick = document.getElementById('btnAutoClick');
btnAutoClick.addEventListener('click', () => {
    toggleAutoClick();
    btnAutoClick.classList.toggle('active');
});

// Seed button - show seed management modal
btnSeed.addEventListener('click', () => {
    showSeedModal();
});

// Leaderboard button - show best scores
btnLeaderboard.addEventListener('click', () => {
    showLeaderboard();
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
            // Easter egg for 1x1 grid
            if (newX === 1 && newY === 1) {
                hideModal();
                setTimeout(() => {
                    modalTitle.textContent = '🎯 Speedrun World Record! 🎯';
                    modalContent.innerHTML = `
                        <div style="text-align: center; color: #d0d0d0; line-height: 1.8;">
                            <p style="font-size: 24px; margin: 20px 0;">🏁</p>
                            <p style="font-size: 18px; font-weight: bold; color: #ffdd00;">CONGRATULATIONS!</p>
                            <p>You've unlocked the <strong>1×1 GRID SPEEDRUN MODE</strong>!</p>
                            <p style="margin-top: 20px;">One cell. One click. Infinite glory! ⚡</p>
                            <p style="font-size: 14px; color: #888; margin-top: 20px; font-style: italic;">
                                (But seriously, you might want a bigger grid to have fun)
                            </p>
                        </div>
                    `;
                    modalOverlay.classList.add('active');
                    modalCancel.style.display = 'none';
                    modalConfirm.textContent = 'Got it!';
                    
                    const closeHandler = () => {
                        hideModal();
                        modalCancel.style.display = '';
                        modalConfirm.textContent = 'Confirm';
                        modalConfirm.removeEventListener('click', closeHandler);
                    };
                    modalConfirm.addEventListener('click', closeHandler);
                }, 100);
                return true;
            }
            
            SIZE_X = newX;
            SIZE_Y = newY;
            exitSetSeedMode(); // Exit set seed mode when changing settings
            resetMatrix();
            resizeCanvas();
            updateDifficultyDisplay();
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
        if (!isNaN(newColors) && newColors === 1) {
            // Easter egg for 1 color - hide current modal first
            hideModal();
            // Show congratulations modal
            setTimeout(() => {
                modalTitle.textContent = '🎉 OMG! World Record! 🎉';
                modalContent.innerHTML = `
                    <div style="text-align: center; color: #d0d0d0; line-height: 1.8;">
                        <p style="font-size: 24px; margin: 20px 0;">🏆</p>
                        <p style="font-size: 18px; font-weight: bold; color: #ffdd00;">CONGRATULATIONS!</p>
                        <p>You've discovered the legendary <strong>ONE COLOR MODE</strong>!</p>
                        <p style="margin-top: 20px;">Every puzzle is instantly solved! 🎯</p>
                        <p style="font-size: 14px; color: #888; margin-top: 20px; font-style: italic;">
                            (But seriously, you need at least 2 colors to play)
                        </p>
                    </div>
                `;
                modalOverlay.classList.add('active');
                modalCancel.style.display = 'none';
                modalConfirm.textContent = 'Got it!';
                
                const closeHandler = () => {
                    hideModal();
                    modalCancel.style.display = '';
                    modalConfirm.textContent = 'Confirm';
                    modalConfirm.removeEventListener('click', closeHandler);
                };
                modalConfirm.addEventListener('click', closeHandler);
            }, 100);
            return true; // Close the input modal
        }
        if (!isNaN(newColors) && newColors > 1 && newColors <= 256) {
            COLORS = newColors;
            generateColors();
            exitSetSeedMode(); // Exit set seed mode when changing settings
            resetMatrix();
            updateLogo();
            updateDifficultyDisplay();
            return true;
        }
        return false;
    }, [DEFAULT_COLORS]);
});

// Click Pattern button
btnPattern.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    showGridSelector(() => {
        exitSetSeedMode(); // Exit set seed mode when changing pattern
        resetMatrix();
        updateDifficultyDisplay();
    });
});

// Reset All to Defaults button
btnResetAll.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    
    // Reset all settings to defaults
    SIZE_X = DEFAULT_SIZE_X;
    SIZE_Y = DEFAULT_SIZE_Y;
    COLORS = DEFAULT_COLORS;
    flipPattern = [...DEFAULT_FLIP_PATTERN];
    
    // Exit set seed mode when resetting to defaults
    exitSetSeedMode();
    
    // Regenerate game with defaults
    generateColors();
    resetMatrix();
    resizeCanvas();
    updateLogo();
    updateDifficultyDisplay();
});

// Info button - shows game information from README
btnInfo.addEventListener('click', () => {
    modalDialog.classList.add('tabbed-modal');
    modalTitle.textContent = 'About TATLO!';
    modalError.classList.remove('active');
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.6; display: flex; flex-direction: column; height: 100%;">
            <!-- Tab Navigation -->
            <div style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #4a4a4a; flex-shrink: 0;">
                <button class="info-tab active" data-tab="about" style="flex: 1; padding: 10px; background: #4a7c59; border: none; color: white; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">📖</span> About
                </button>
                <button class="info-tab" data-tab="features" style="flex: 1; padding: 10px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">✨</span> Features
                </button>
                <button class="info-tab" data-tab="seeds" style="flex: 1; padding: 10px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">🎲</span> Seeds
                </button>
                <button class="info-tab" data-tab="leaderboard" style="flex: 1; padding: 10px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">🏆</span> Leaderboard
                </button>
                <button class="info-tab" data-tab="controls" style="flex: 1; padding: 10px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">⌨️</span> Controls
                </button>
            </div>
            
            <!-- Scrollable Content Wrapper -->
            <div style="flex: 1; overflow-y: auto; overflow-x: hidden; padding-right: 10px;" class="info-scroll-container">
            
            <!-- Tab Content: About -->
            <div class="info-content" data-content="about">
                <p><strong>Turn All The Lights Off!</strong></p>
                <p>Turn all cells to the same color.</p>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">How to Play</h3>
                <ul style="margin-left: 20px;">
                    <li>Click a cell to flip it and its neighbors</li>
                    <li>Shift+Click flips backwards (3+ colors)</li>
                    <li>Timer starts on first move</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Links</h3>
                <p>
                    <a href="https://docs.google.com/document/d/e/2PACX-1vQneouQdbkZ96iV2srNMGTnXVfWiv2udaHyaH42FEdILTS3m1OUxKTd7ozuHwPWGi-8a8WlB51sK-QU/pub" target="_blank" style="color: #88ccff;">7×5 Solution</a> | 
                    <a href="https://github.com/Napero" target="_blank" style="color: #88ccff;">Made by Napero</a>
                </p>
            </div>
            
            <!-- Tab Content: Features -->
            <div class="info-content" data-content="features" style="display: none;">
                <ul style="margin-left: 20px;">
                    <li><strong>🎲 Random Seed</strong> - New random puzzles</li>
                    <li><strong>🔢 Set Seed</strong> - Play specific puzzles</li>
                    <li><strong>📋 Share Seeds</strong> - Copy and share with friends</li>
                    <li><strong>🏆 Leaderboard</strong> - View all best scores</li>
                    <li><strong>⚙️ Customize</strong> - Grid size, colors, patterns</li>
                    <li><strong>⏱️ Tracking</strong> - Timer and move counter with milliseconds</li>
                    <li><strong>💾 Auto-Save</strong> - Scores saved automatically</li>
                    <li><strong>🤖 Auto-Solver</strong> - Step-by-step hints and auto-click solution</li>
                    <li><strong>🎯 Difficulty Score</strong> - Live score based on configuration complexity</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Options</h3>
                <ul style="margin-left: 20px;">
                    <li><strong>Grid:</strong> 2×1 to 50×50 (default: 7×5)</li>
                    <li><strong>Colors:</strong> 2 to 256 (default: 2)</li>
                    <li><strong>Patterns:</strong> Custom drag-to-paint (default: Cross)</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Scoring System</h3>
                <ul style="margin-left: 20px;">
                    <li><strong>Grid Size:</strong> Larger grids = exponentially harder</li>
                    <li><strong>Colors:</strong> More colors = exponentially harder</li>
                    <li><strong>Pattern Shape:</strong> Irregular patterns = harder than rectangles</li>
                    <li><strong>Ratings:</strong> 8 difficulty levels from Free (🎁) to Impossible (💀)</li>
                    <li><strong>Base:</strong> 7×5, 2 colors, cross = 1,000 points (🙂 Normal)</li>
                </ul>
            </div>
            
            <!-- Tab Content: Seeds -->
            <div class="info-content" data-content="seeds" style="display: none;">
                <p>Seeds are unique puzzle identifiers containing grid size, colors, pattern, and scramble.</p>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Random Seed Mode</h3>
                <ul style="margin-left: 20px;">
                    <li>Each scramble generates a unique seed</li>
                    <li>Click 🔢 button to view/copy seed</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Set Seed Mode</h3>
                <ul style="margin-left: 20px;">
                    <li>Enter a seed to play that exact puzzle</li>
                    <li>Scramble button turns red, resets to same seed</li>
                    <li>Scores tracked separately</li>
                    <li>Exit with "Return to Random Seed Mode"</li>
                </ul>
            </div>
            
            <!-- Tab Content: Leaderboard -->
            <div class="info-content" data-content="leaderboard" style="display: none;">
                <p>View all best scores by clicking <strong>🏆 Leaderboard</strong>.</p>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Random Seed Tab</h3>
                <ul style="margin-left: 20px;">
                    <li>Best scores for each configuration</li>
                    <li>Click seeds to copy</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Set Seed Tab</h3>
                <ul style="margin-left: 20px;">
                    <li>Best scores for specific seeds</li>
                    <li>Click seeds to copy</li>
                    <li>Use ▶️ Load to replay</li>
                </ul>
            </div>
            
            <!-- Tab Content: Controls -->
            <div class="info-content" data-content="controls" style="display: none;">
                <h3 style="color: #ffffff; margin-top: 10px; margin-bottom: 10px;">Mouse</h3>
                <ul style="margin-left: 20px;">
                    <li><strong>Click</strong> - Flip forward</li>
                    <li><strong>Shift+Click</strong> - Flip backward</li>
                </ul>
                
                <h3 style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">Keyboard</h3>
                <ul style="margin-left: 20px;">
                    <li><strong>R</strong> - New scramble</li>
                    <li><strong>I</strong> - Grid size</li>
                    <li><strong>C</strong> - Colors</li>
                    <li><strong>S</strong> - Pattern</li>
                    <li><strong>Enter/Esc</strong> - Close modal</li>
                </ul>
            </div>
            
            </div><!-- End scrollable content wrapper -->
        </div>
    `;
    
    modalOverlay.classList.add('active');
    
    // Add tab switching functionality
    setTimeout(() => {
        const tabs = modalContent.querySelectorAll('.info-tab');
        const contents = modalContent.querySelectorAll('.info-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Update tab styles
                tabs.forEach(t => {
                    t.style.background = '#3a3a3a';
                    t.style.color = '#b0b0b0';
                    t.classList.remove('active');
                });
                tab.style.background = '#4a7c59';
                tab.style.color = 'white';
                tab.classList.add('active');
                
                // Update content visibility
                contents.forEach(content => {
                    if (content.getAttribute('data-content') === targetTab) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
        });
    }, 100);
    
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

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
