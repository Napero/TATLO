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
const victoryReplay = document.getElementById('victoryReplay');
const victoryShareGame = document.getElementById('victoryShareGame');

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
        // Always show/hide share button based on daily puzzle mode
        const victoryShare = document.getElementById('victoryShare');
        if (isDailyPuzzleMode) {
            // Show share button for any daily puzzle
            if (victoryShare) {
                victoryShare.style.display = 'block';
            }
            
            // Check if this is a NEW completion
            if (!isDailyPuzzleCompleted(currentDailyDate)) {
                markDailyPuzzleCompleted(elapsedTime, moveCount, currentDailyDate);
                victoryMessage.textContent = '🎉 Daily puzzle completed! 🎉';
                updateDailyPuzzleButton();
            } else {
                victoryMessage.textContent = '🎉 Daily puzzle! 🎉';
            }
        } else {
            // Hide share button for non-daily puzzles
            if (victoryShare) {
                victoryShare.style.display = 'none';
            }
            
            const scores = loadBestScores();
            if (scores.bestTime === null || elapsedTime < scores.bestTime) {
                victoryMessage.textContent = '🎉 New best time! 🎉';
            } else if (scores.bestMoves === null || moveCount < scores.bestMoves) {
                victoryMessage.textContent = '🎉 New best moves! 🎉';
            } else {
                victoryMessage.textContent = 'Great job! Press R or click below to play again';
            }
        }
    }
    
    // Update button text based on set seed mode
    if (isSetSeedMode) {
        victoryNewGame.innerHTML = '<span>🔄</span> Reset Set Seed';
    } else {
        victoryNewGame.innerHTML = '<span>🎲</span> New Scramble';
    }
    
    // Hide replay button in set seed mode (since reset does the same thing)
    if (victoryReplay) {
        victoryReplay.style.display = isSetSeedMode ? 'none' : 'flex';
    }
    
    // Show modal
    victoryOverlay.classList.add('active');
    console.log('Victory modal shown'); // Debug
    
    // Hide hamburger menu on mobile when modal is open
    if (hamburgerMenu) hamburgerMenu.classList.add('hidden');
}

function hideVictoryModal() {
    victoryOverlay.classList.remove('active');
    // Show hamburger menu again on mobile
    if (hamburgerMenu) hamburgerMenu.classList.remove('hidden');
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
    // Check if on mobile and adjust default grid size
    if (window.innerWidth <= 768) {
        // Only change if still at default desktop size
        if (SIZE_X === DEFAULT_SIZE_X && SIZE_Y === DEFAULT_SIZE_Y) {
            SIZE_X = 5;
            SIZE_Y = 7;
        }
    }
    
    // Load best scores for initial config
    const scores = loadBestScores();
    bestTime = scores.bestTime;
    bestMoves = scores.bestMoves;
    bestScore = scores.bestScore;
    
    // Check URL parameters for seed sharing
    checkURLParameters();
    
    // Generate initial colors and matrix (unless loaded from URL)
    if (!isSetSeedMode) {
        resetMatrix();
    }
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
    
    // Replay button - restart same puzzle
    const victoryReplay = document.getElementById('victoryReplay');
    if (victoryReplay) {
        victoryReplay.addEventListener('click', () => {
            hideVictoryModal();
            stopSolver();
            hideGiveUpButton();
            // Reset with same seed and enter set seed mode
            if (currentSeed) {
                const parsed = parseSeedString(currentSeed);
                if (parsed && parsed.randomSeed) {
                    // Enter set seed mode
                    isSetSeedMode = true;
                    setSeedValue = parsed.randomSeed;
                    resetMatrix(parsed.randomSeed);
                    updateDifficultyDisplay();
                } else {
                    resetMatrix();
                }
            } else {
                resetMatrix();
            }
        });
    }
    
    // Share Game button - copy share text with emoji art
    const victoryShareGame = document.getElementById('victoryShareGame');
    if (victoryShareGame) {
        victoryShareGame.addEventListener('click', () => {
            const shareText = generateShareText();
            if (shareText) {
                navigator.clipboard.writeText(shareText).then(() => {
                    // Visual feedback
                    const originalHTML = victoryShareGame.innerHTML;
                    victoryShareGame.innerHTML = '<span>✓</span>';
                    victoryShareGame.style.backgroundColor = '#3a6c49';
                    setTimeout(() => {
                        victoryShareGame.innerHTML = originalHTML;
                        victoryShareGame.style.backgroundColor = '';
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy to clipboard');
                });
            }
        });
    }
    
    // Share Results button for daily puzzle
    const victoryShare = document.getElementById('victoryShare');
    if (victoryShare) {
        victoryShare.addEventListener('click', () => {
            console.log('Share button clicked');
            console.log('isDailyPuzzleMode:', isDailyPuzzleMode);
            console.log('currentDailyDate:', currentDailyDate);
            
            if (isDailyPuzzleMode && currentDailyDate) {
                const shareText = generateDailyPuzzleShare(currentDailyDate);
                console.log('Share text generated:', shareText);
                
                if (shareText) {
                    navigator.clipboard.writeText(shareText).then(() => {
                        console.log('Copied to clipboard successfully');
                        victoryShare.innerHTML = '<span>✓</span> Copied!';
                        setTimeout(() => {
                            victoryShare.innerHTML = '<span>📊</span> Share Results';
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        victoryShare.innerHTML = '<span>❌</span> Failed';
                        setTimeout(() => {
                            victoryShare.innerHTML = '<span>📊</span> Share Results';
                        }, 2000);
                    });
                } else {
                    console.error('No share text generated');
                }
            } else {
                console.error('Not in daily puzzle mode or no date');
            }
        });
    } else {
        console.error('Victory share button not found');
    }
    
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

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
});

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
const btnLeaderboard = document.getElementById('btnLeaderboard');
const btnCustomize = document.getElementById('btnCustomize');
const btnInfo = document.getElementById('btnInfo');
const btnGiveUp = document.getElementById('btnGiveUp');
const btnPuzzle = document.getElementById('btnPuzzle');
const btnStats = document.getElementById('btnStats');
const btnSeedAndShare = document.getElementById('btnSeedAndShare');
const btnLeaveSetSeed = document.getElementById('btnLeaveSetSeed');
const customizeMenu = document.getElementById('customizeMenu');
const puzzleMenu = document.getElementById('puzzleMenu');
const statsMenu = document.getElementById('statsMenu');
const btnGridSize = document.getElementById('btnGridSize');
const btnColors = document.getElementById('btnColors');
const btnPattern = document.getElementById('btnPattern');
const btnResetAll = document.getElementById('btnResetAll');

// New Scramble button
btnNewScramble.addEventListener('click', () => {
    puzzleMenu.classList.remove('active');
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

// Seed & Share button - show combined seed and share modal
btnSeedAndShare.addEventListener('click', () => {
    puzzleMenu.classList.remove('active');
    showSeedModal();
});

// Leave Set Seed Mode button
if (btnLeaveSetSeed) {
    btnLeaveSetSeed.addEventListener('click', () => {
        puzzleMenu.classList.remove('active');
        exitSetSeedMode();
    });
}

// Random Puzzle button
const btnRandomPuzzle = document.getElementById('btnRandomPuzzle');
btnRandomPuzzle.addEventListener('click', () => {
    puzzleMenu.classList.remove('active');
    showRandomPuzzleModal();
});

// Leaderboard button - show best scores
btnLeaderboard.addEventListener('click', () => {
    statsMenu.classList.remove('active');
    showLeaderboard();
});

// Customize menu toggle
btnCustomize.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other menus
    puzzleMenu.classList.remove('active');
    statsMenu.classList.remove('active');
    
    const isActive = customizeMenu.classList.toggle('active');
    
    if (isActive) {
        // Position menu below the button, aligned to the right
        const rect = btnCustomize.getBoundingClientRect();
        customizeMenu.style.top = `${rect.bottom + 5}px`;
        customizeMenu.style.left = 'auto';
        customizeMenu.style.right = `${window.innerWidth - rect.right}px`;
    }
});

// Puzzle menu toggle
btnPuzzle.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other menus
    customizeMenu.classList.remove('active');
    statsMenu.classList.remove('active');
    
    const isActive = puzzleMenu.classList.toggle('active');
    
    if (isActive) {
        // Position menu below the button, aligned to the right
        const rect = btnPuzzle.getBoundingClientRect();
        puzzleMenu.style.top = `${rect.bottom + 5}px`;
        puzzleMenu.style.left = 'auto';
        puzzleMenu.style.right = `${window.innerWidth - rect.right}px`;
    }
});

// Stats menu toggle
btnStats.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other menus
    customizeMenu.classList.remove('active');
    puzzleMenu.classList.remove('active');
    
    const isActive = statsMenu.classList.toggle('active');
    
    if (isActive) {
        // Position menu below the button, aligned to the right
        const rect = btnStats.getBoundingClientRect();
        statsMenu.style.top = `${rect.bottom + 5}px`;
        statsMenu.style.left = 'auto';
        statsMenu.style.right = `${window.innerWidth - rect.right}px`;
    }
});

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!customizeMenu.contains(e.target) && e.target !== btnCustomize) {
        customizeMenu.classList.remove('active');
    }
    if (!puzzleMenu.contains(e.target) && e.target !== btnPuzzle) {
        puzzleMenu.classList.remove('active');
    }
    if (!statsMenu.contains(e.target) && e.target !== btnStats) {
        statsMenu.classList.remove('active');
    }
});

// Grid Size button
btnGridSize.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    puzzleMenu.classList.remove('active');
    statsMenu.classList.remove('active');
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
    puzzleMenu.classList.remove('active');
    statsMenu.classList.remove('active');
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
    puzzleMenu.classList.remove('active');
    statsMenu.classList.remove('active');
    showGridSelector(() => {
        exitSetSeedMode(); // Exit set seed mode when changing pattern
        resetMatrix();
        updateDifficultyDisplay();
    });
});

// Reset All to Defaults button
btnResetAll.addEventListener('click', () => {
    customizeMenu.classList.remove('active');
    puzzleMenu.classList.remove('active');
    statsMenu.classList.remove('active');
    
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

// Daily button - show daily puzzle modal
const btnDaily = document.getElementById('btnDaily');
btnDaily.addEventListener('click', () => {
    puzzleMenu.classList.remove('active');
    showDailyPuzzleModal();
});

// Info button - shows game information from README
btnInfo.addEventListener('click', () => {
    modalDialog.classList.add('tabbed-modal');
    modalTitle.textContent = 'About TATLO!';
    modalError.classList.remove('active');
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.6; display: flex; flex-direction: column; height: 100%;">
            <!-- Tab Navigation -->
            <div class="info-tabs-container" style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #4a4a4a; flex-shrink: 0; flex-wrap: wrap;">
                <button class="info-tab active" data-tab="about" style="flex: 1; min-width: 80px; padding: 10px 8px; background: #4a7c59; border: none; color: white; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">📖</span> <span class="tab-text">About</span>
                </button>
                <button class="info-tab" data-tab="features" style="flex: 1; min-width: 80px; padding: 10px 8px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">✨</span> <span class="tab-text">Features</span>
                </button>
                <button class="info-tab" data-tab="seeds" style="flex: 1; min-width: 80px; padding: 10px 8px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">🎲</span> <span class="tab-text">Seeds</span>
                </button>
                <button class="info-tab" data-tab="leaderboard" style="flex: 1; min-width: 80px; padding: 10px 8px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">🏆</span> <span class="tab-text">Leaderboard</span>
                </button>
                <button class="info-tab" data-tab="controls" style="flex: 1; min-width: 80px; padding: 10px 8px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 12px; border-radius: 4px 4px 0 0; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    <span style="font-size: 16px;">⌨️</span> <span class="tab-text">Controls</span>
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

// Show customize options as a modal (for mobile)
function showCustomizeModal() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    
    modalTitle.textContent = 'Customize Game';
    modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="customize-menu-button" id="modalBtnGridSize">
                <span>📐</span> Grid Size <span class="keybind">I</span>
            </button>
            <button class="customize-menu-button" id="modalBtnColors">
                <span>🎨</span> Colors <span class="keybind">C</span>
            </button>
            <button class="customize-menu-button" id="modalBtnPattern">
                <span>✨</span> Pattern <span class="keybind">S</span>
            </button>
            <button class="customize-menu-button" id="modalBtnResetAll">
                <span>🔄</span> Reset All Settings
            </button>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Close';
    
    const confirmHandler = () => {
        hideModal();
        modalCancel.style.display = '';
        modalConfirm.textContent = 'Confirm';
        cleanup();
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    
    // Add button handlers
    setTimeout(() => {
        document.getElementById('modalBtnGridSize')?.addEventListener('click', () => {
            hideModal();
            btnGridSize.click();
        });
        document.getElementById('modalBtnColors')?.addEventListener('click', () => {
            hideModal();
            btnColors.click();
        });
        document.getElementById('modalBtnPattern')?.addEventListener('click', () => {
            hideModal();
            btnPattern.click();
        });
        document.getElementById('modalBtnResetAll')?.addEventListener('click', () => {
            hideModal();
            btnResetAll.click();
        });
    }, 0);
}

// Mobile Hamburger Menu
const hamburgerMenu = document.getElementById('hamburgerMenu');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');

// Mobile menu buttons
const mobileInfo = document.getElementById('mobileInfo');
const mobileNewScramble = document.getElementById('mobileNewScramble');
const mobileSeed = document.getElementById('mobileSeed');
const mobileLeaderboard = document.getElementById('mobileLeaderboard');
const mobileCustomize = document.getElementById('mobileCustomize');
const mobileGiveUp = document.getElementById('mobileGiveUp');
const mobileAutoClick = document.getElementById('mobileAutoClick');

// Toggle hamburger menu
hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('active');
    mobileNavOverlay.classList.toggle('active');
});

// Close menu when clicking outside
mobileNavOverlay.addEventListener('click', (e) => {
    if (e.target === mobileNavOverlay) {
        hamburgerMenu.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
    }
});

// Helper function to close mobile menu
function closeMobileMenu() {
    hamburgerMenu.classList.remove('active');
    mobileNavOverlay.classList.remove('active');
}

// Mobile button handlers (mirror desktop functionality)
mobileInfo.addEventListener('click', () => {
    closeMobileMenu();
    btnInfo.click();
});

const mobileDaily = document.getElementById('mobileDaily');
mobileDaily.addEventListener('click', () => {
    closeMobileMenu();
    btnDaily.click();
});

mobileNewScramble.addEventListener('click', () => {
    closeMobileMenu();
    btnNewScramble.click();
});

const mobileRandomPuzzle = document.getElementById('mobileRandomPuzzle');
if (mobileRandomPuzzle) {
    mobileRandomPuzzle.addEventListener('click', () => {
        closeMobileMenu();
        btnRandomPuzzle.click();
    });
}

mobileSeed.addEventListener('click', () => {
    closeMobileMenu();
    btnSeedAndShare.click();
});

const mobileLeaveSetSeed = document.getElementById('mobileLeaveSetSeed');
if (mobileLeaveSetSeed) {
    mobileLeaveSetSeed.addEventListener('click', () => {
        closeMobileMenu();
        if (btnLeaveSetSeed) {
            btnLeaveSetSeed.click();
        }
    });
}

mobileLeaderboard.addEventListener('click', () => {
    closeMobileMenu();
    btnLeaderboard.click();
});

const mobileGridSize = document.getElementById('mobileGridSize');
if (mobileGridSize) {
    mobileGridSize.addEventListener('click', () => {
        closeMobileMenu();
        btnGridSize.click();
    });
}

const mobileColors = document.getElementById('mobileColors');
if (mobileColors) {
    mobileColors.addEventListener('click', () => {
        closeMobileMenu();
        btnColors.click();
    });
}

const mobilePattern = document.getElementById('mobilePattern');
if (mobilePattern) {
    mobilePattern.addEventListener('click', () => {
        closeMobileMenu();
        btnPattern.click();
    });
}

const mobileResetAll = document.getElementById('mobileResetAll');
if (mobileResetAll) {
    mobileResetAll.addEventListener('click', () => {
        closeMobileMenu();
        btnResetAll.click();
    });
}

mobileGiveUp.addEventListener('click', () => {
    closeMobileMenu();
    btnGiveUp.click();
});

mobileAutoClick.addEventListener('click', () => {
    closeMobileMenu();
    btnAutoClick.click();
    // Sync the active class
    if (btnAutoClick.classList.contains('active')) {
        mobileAutoClick.classList.add('active');
    } else {
        mobileAutoClick.classList.remove('active');
    }
});

// Sync mobile button visibility with desktop buttons
function syncMobileButtonVisibility() {
    if (mobileGiveUp && btnGiveUp) {
        mobileGiveUp.style.display = btnGiveUp.style.display;
    }
    if (mobileAutoClick && btnAutoClick) {
        mobileAutoClick.style.display = btnAutoClick.style.display;
        // Also sync active state
        if (btnAutoClick.classList.contains('active')) {
            mobileAutoClick.classList.add('active');
        } else {
            mobileAutoClick.classList.remove('active');
        }
    }
    // Sync Leave Set Seed Mode button visibility
    if (mobileLeaveSetSeed) {
        mobileLeaveSetSeed.style.display = isSetSeedMode ? 'flex' : 'none';
    }
    // Update New Scramble button style on mobile
    if (mobileNewScramble) {
        if (isSetSeedMode) {
            mobileNewScramble.innerHTML = '<span>🔄</span> Reset Set Seed';
            mobileNewScramble.style.background = '#7c4a4a';
            mobileNewScramble.style.color = '#ffcccc';
        } else {
            mobileNewScramble.innerHTML = '<span>🎲</span> New Scramble';
            mobileNewScramble.style.background = '';
            mobileNewScramble.style.color = '';
        }
    }
}

// Override the show/hide functions to sync mobile buttons
const originalShowGiveUpButton = window.showGiveUpButton;
if (typeof originalShowGiveUpButton === 'function') {
    window.showGiveUpButton = function() {
        originalShowGiveUpButton();
        syncMobileButtonVisibility();
    };
}

const originalHideGiveUpButton = window.hideGiveUpButton;
if (typeof originalHideGiveUpButton === 'function') {
    window.hideGiveUpButton = function() {
        originalHideGiveUpButton();
        syncMobileButtonVisibility();
    };
}

const originalShowAutoClickButton = window.showAutoClickButton;
if (typeof originalShowAutoClickButton === 'function') {
    window.showAutoClickButton = function() {
        originalShowAutoClickButton();
        syncMobileButtonVisibility();
    };
}

const originalHideAutoClickButton = window.hideAutoClickButton;
if (typeof originalHideAutoClickButton === 'function') {
    window.hideAutoClickButton = function() {
        originalHideAutoClickButton();
        syncMobileButtonVisibility();
    };
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    syncMobileButtonVisibility();
    initDailyReminder(); // Initialize daily puzzle reminder
});
