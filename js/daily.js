// Daily Puzzle System

// Daily reminder elements
let dailyReminder = null;
let dailyReminderDismiss = null;

// Initialize daily reminder
function initDailyReminder() {
    dailyReminder = document.getElementById('dailyReminder');
    dailyReminderDismiss = document.getElementById('dailyReminderDismiss');
    
    if (!dailyReminder || !dailyReminderDismiss) return;
    
    // Click reminder to open daily puzzle
    dailyReminder.addEventListener('click', (e) => {
        if (e.target !== dailyReminderDismiss) {
            hideDailyReminder();
            showDailyPuzzleModal();
        }
    });
    
    // Dismiss button
    dailyReminderDismiss.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissDailyReminder();
    });
    
    // Check if we should show the reminder
    checkDailyReminder();
}

// Check if daily reminder should be shown
function checkDailyReminder() {
    const today = getTodayDateString();
    const completed = isDailyPuzzleCompleted(today);
    const dismissed = localStorage.getItem(`tatlo_daily_reminder_dismissed`);
    const dismissedDate = localStorage.getItem(`tatlo_daily_reminder_dismissed_date`);
    
    // Show if: not completed today AND (never dismissed OR dismissed on a different day)
    if (!completed && (!dismissed || dismissedDate !== today)) {
        showDailyReminder();
    }
}

// Show daily reminder
function showDailyReminder() {
    if (dailyReminder) {
        dailyReminder.style.display = 'flex';
    }
}

// Hide daily reminder (temporary, for this session)
function hideDailyReminder() {
    if (dailyReminder) {
        dailyReminder.style.display = 'none';
    }
}

// Dismiss daily reminder (until tomorrow)
function dismissDailyReminder() {
    const today = getTodayDateString();
    localStorage.setItem(`tatlo_daily_reminder_dismissed`, 'true');
    localStorage.setItem(`tatlo_daily_reminder_dismissed_date`, today);
    hideDailyReminder();
}

// Get today's date as a string (YYYY-MM-DD)
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate daily puzzle seed from date
function getDailySeed(dateString = null) {
    const date = dateString || getTodayDateString();
    
    // Parse date to get day of week and day of month
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = day;
    
    // Difficulty progression:
    // Week: Monday easiest → Sunday hardest
    // Month: Early days easier → End of month harder
    
    // Base config: 7×5, 2 colors, cross pattern (difficulty ~1000)
    let sizeX = 7;
    let sizeY = 5;
    let colors = 2;
    let pattern = [
        { dx: 0, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 }
    ];
    
    // Scale difficulty based on day of week (0-6)
    // Monday (1) = easiest, Sunday (0) = hardest
    if (dayOfWeek === 1) {
        // Monday: Super easy (5×5, 2 colors) - ~550 difficulty
        sizeX = 5;
        sizeY = 5;
    } else if (dayOfWeek === 2) {
        // Tuesday: Easy (6×5, 2 colors) - ~750 difficulty
        sizeX = 6;
        sizeY = 5;
    } else if (dayOfWeek === 3) {
        // Wednesday: Normal (7×5, 2 colors) - ~1000 difficulty
        sizeX = 7;
        sizeY = 5;
    } else if (dayOfWeek === 4) {
        // Thursday: Medium (7×5, 3 colors) - ~1900 difficulty
        sizeX = 7;
        sizeY = 5;
        colors = 3;
    } else if (dayOfWeek === 5) {
        // Friday: Hard (8×6, 3 colors) - ~3500 difficulty
        sizeX = 8;
        sizeY = 6;
        colors = 3;
    } else if (dayOfWeek === 6) {
        // Saturday: Very Hard (9×7, 3 colors) - ~5800 difficulty
        sizeX = 9;
        sizeY = 7;
        colors = 3;
    } else {
        // Sunday: Brutal (10×7, 4 colors) - ~15000 difficulty
        sizeX = 10;
        sizeY = 7;
        colors = 4;
    }
    
    // Add monthly scaling - last week of month gets harder
    if (dayOfMonth >= 22) {
        colors = Math.min(colors + 1, 5); // Add a color (max 5)
    }
    
    // Generate seed from date
    const dateNumber = year * 10000 + month * 100 + day;
    const randomSeed = dateNumber;
    
    // Create seed string
    const patternStr = pattern.map(p => `${p.dx},${p.dy}`).sort().join('|');
    const seedString = `${sizeX}x${sizeY}:${colors}c:${patternStr}:${randomSeed}`;
    
    return {
        seedString,
        config: { sizeX, sizeY, colors, pattern, randomSeed },
        date,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
    };
}

// Load daily puzzle
function loadDailyPuzzle(dateString = null) {
    const dailyData = getDailySeed(dateString);
    const result = loadSeed(dailyData.seedString);
    
    if (result) {
        // Mark as daily puzzle mode
        isDailyPuzzleMode = true;
        currentDailyDate = dailyData.date;
        
        console.log(`Daily puzzle loaded for ${dailyData.date} (${dailyData.dayName})`);
        
        // Update button appearance
        updateDailyPuzzleButton();
        
        return true;
    }
    
    return false;
}

// Check if today's daily puzzle has been completed
function isDailyPuzzleCompleted(date = null) {
    const dateString = date || getTodayDateString();
    const key = `tatlo_daily_completed_${dateString}`;
    return localStorage.getItem(key) === 'true';
}

// Mark today's daily puzzle as completed
function markDailyPuzzleCompleted(time, moves, date = null) {
    const dateString = date || getTodayDateString();
    const key = `tatlo_daily_completed_${dateString}`;
    localStorage.setItem(key, 'true');
    localStorage.setItem(`tatlo_daily_time_${dateString}`, time);
    localStorage.setItem(`tatlo_daily_moves_${dateString}`, moves);
    
    // Hide the daily reminder when puzzle is completed
    hideDailyReminder();
}
// Generate emoji grid visualization by recreating scramble from seed
function generateEmojiGrid(seedString) {
    if (!seedString) {
        console.error('No seed provided for emoji grid generation');
        return '';
    }
    
    console.log('generateEmojiGrid called with seed:', seedString);
    
    // Parse the seed to get configuration
    const parsed = parseSeedString(seedString);
    if (!parsed || parsed === 'exploit') {
        console.error('Failed to parse seed');
        return '';
    }
    
    // Generate colors based on the COLORS count
    let colors;
    if (parsed.colors === 2) {
        colors = ['#000000', '#FFFFFF'];
    } else {
        colors = Array.from({ length: parsed.colors }, (_, i) => {
            const hue = Math.floor((i / parsed.colors) * 360);
            return `hsl(${hue}, 100%, 50%)`;
        });
    }
    
    // Create empty matrix
    const scrambleMatrix = Array.from({ length: parsed.sizeY }, () => 
        Array(parsed.sizeX).fill(0)
    );
    
    // Recreate the scramble using the seed (same logic as game-logic.js)
    const rng = seededRandom(parsed.randomSeed);
    
    // Calculate scramble count (same formula as resetMatrix)
    const gridSize = parsed.sizeX * parsed.sizeY;
    const basePatternSize = 5;
    const actualPatternSize = parsed.pattern.length;
    const patternAdjustment = basePatternSize / actualPatternSize;
    let steps = Math.ceil(gridSize * parsed.colors * Math.log(parsed.colors) * patternAdjustment);
    steps = Math.max(steps, gridSize * 2);
    
    // Apply scramble clicks
    for (let i = 0; i < steps; i++) {
        const x = Math.floor(rng() * parsed.sizeX);
        const y = Math.floor(rng() * parsed.sizeY);
        
        // Apply flip to center cell
        scrambleMatrix[y][x] = (scrambleMatrix[y][x] + 1) % parsed.colors;
        
        // Apply pattern
        for (const { dx, dy } of parsed.pattern) {
            if (dx === 0 && dy === 0) continue; // Already did center
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < parsed.sizeX && ny >= 0 && ny < parsed.sizeY) {
                scrambleMatrix[ny][nx] = (scrambleMatrix[ny][nx] + 1) % parsed.colors;
            }
        }
    }
    
    console.log('Generated scramble matrix, calling generateEmojiArt...');
    
    // Generate emoji art from the scrambled matrix
    return generateEmojiArt(scrambleMatrix, colors);
}

// Generate Wordle-style shareable result
function generateDailyPuzzleShare(dateOverride = null) {
    const targetDate = dateOverride || currentDailyDate;
    
    if (!targetDate) {
        console.error('No date provided for share generation');
        return null;
    }
    
    const dailyData = getDailySeed(targetDate);
    
    // Calculate difficulty based on the daily puzzle's configuration, not current game state
    const dailyConfig = dailyData.config;
    const gridSize = dailyConfig.sizeX * dailyConfig.sizeY;
    const patternSize = dailyConfig.pattern.length;
    const baseScore = gridSize * dailyConfig.colors * Math.log(dailyConfig.colors);
    const patternMultiplier = Math.pow(5 / patternSize, 0.5);
    const totalScore = Math.round(baseScore * patternMultiplier);
    
    // Use the existing difficulty rating function from scoring.js
    const difficulty = getDifficultyRating(totalScore);
    const difficultyEmoji = difficulty.emoji;
    
    // Format date nicely
    const [year, month, day] = targetDate.split('-');
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
    
    // Get completion stats
    const completed = isDailyPuzzleCompleted(targetDate);
    
    let shareText = `TATLO! Daily ${targetDate} (${dayOfWeek})\n`;
    shareText += `${difficultyEmoji} ${difficulty.name}\n\n`;
    
    if (completed) {
        const time = localStorage.getItem(`tatlo_daily_time_${targetDate}`);
        const moves = localStorage.getItem(`tatlo_daily_moves_${targetDate}`);
        
        if (time && moves) {
            shareText += `⏱️ ${formatTime(parseInt(time))}\n`;
            shareText += `🎯 ${moves} moves\n\n`;
        } else {
            shareText += `✅ Completed!\n\n`;
        }
        
        // Add emoji grid visualization
        shareText += generateEmojiGrid(dailyData.seedString);
    } else {
        shareText += `❌ Not yet completed\n`;
    }
    
    shareText += `\nPlay: ${window.location.origin}${window.location.pathname}?daily=true`;
    
    return shareText;
}

// Show daily puzzle modal
function showDailyPuzzleModal() {
    const dailyData = getDailySeed();
    const completed = isDailyPuzzleCompleted();
    
    modalTitle.textContent = '📅 Daily Puzzle';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    // Calculate expected difficulty
    const oldSizeX = SIZE_X;
    const oldSizeY = SIZE_Y;
    const oldColors = COLORS;
    const oldPattern = [...flipPattern];
    
    SIZE_X = dailyData.config.sizeX;
    SIZE_Y = dailyData.config.sizeY;
    COLORS = dailyData.config.colors;
    flipPattern = dailyData.config.pattern;
    
    const scoreData = calculateScore();
    
    SIZE_X = oldSizeX;
    SIZE_Y = oldSizeY;
    COLORS = oldColors;
    flipPattern = oldPattern;
    
    const completedBadge = completed 
        ? '<div style="background: #4a7c59; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px; color: white; font-weight: bold;">✅ Already Completed Today!</div>'
        : '';
    
    let completionStats = '';
    if (completed) {
        const time = localStorage.getItem(`tatlo_daily_time_${dailyData.date}`);
        const moves = localStorage.getItem(`tatlo_daily_moves_${dailyData.date}`);
        
        if (time && moves) {
            completionStats = `
                <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #ffffff; margin: 0 0 10px 0;">Your Performance:</h4>
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 15px; font-size: 13px;">
                        <span style="color: #888;">Time:</span>
                        <span>${formatTime(parseInt(time))}</span>
                        <span style="color: #888;">Moves:</span>
                        <span>${moves}</span>
                    </div>
                </div>
            `;
        }
    }
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.8;">
            ${completedBadge}
            
            <div style="margin-bottom: 20px; text-align: center;">
                <h3 style="color: #ffffff; margin: 10px 0;">${dailyData.dayName}, ${dailyData.date}</h3>
                <div style="font-size: 48px; margin: 15px 0;">${scoreData.difficulty.emoji}</div>
                <div style="font-size: 18px; color: ${scoreData.difficulty.color}; font-weight: bold;">${scoreData.difficulty.name}</div>
                <div style="font-size: 14px; color: #a0a0a0; margin-top: 5px;">Difficulty: ${formatScore(scoreData.totalScore)}</div>
            </div>
            
            ${completionStats}
            
            <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #ffffff; margin: 0 0 10px 0;">Today's Challenge:</h4>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 15px; font-size: 13px;">
                    <span style="color: #888;">Grid:</span>
                    <span>${dailyData.config.sizeX}×${dailyData.config.sizeY}</span>
                    <span style="color: #888;">Colors:</span>
                    <span>${dailyData.config.colors}</span>
                    <span style="color: #888;">Pattern:</span>
                    <span>Cross (5 cells)</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                ${completed ? 
                    `<button id="shareDaily" style="width: 100%; padding: 12px; background: #4a7c59; border: none; color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-bottom: 10px;">
                        📤 Share Results
                    </button>
                    <button id="playDailyAgain" style="width: 100%; padding: 12px; background: #7c4a4a; border: none; color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 14px;">
                        🔄 Play Again
                    </button>` :
                    `<button id="startDaily" style="width: 100%; padding: 12px; background: #4a7c59; border: none; color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 14px;">
                        ▶️ Start Today's Puzzle
                    </button>`
                }
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">
                New puzzle every day at midnight!
            </div>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Close';
    
    setTimeout(() => {
        const startDaily = document.getElementById('startDaily');
        const shareDaily = document.getElementById('shareDaily');
        const playDailyAgain = document.getElementById('playDailyAgain');
        
        if (startDaily) {
            startDaily.addEventListener('click', () => {
                loadDailyPuzzle();
                hideModal();
                modalCancel.style.display = '';
                modalConfirm.textContent = 'Confirm';
            });
        }
        
        if (shareDaily) {
            shareDaily.addEventListener('click', () => {
                // Pass the daily date to the share function
                const shareText = generateDailyPuzzleShare(dailyData.date);
                if (shareText) {
                    navigator.clipboard.writeText(shareText).then(() => {
                        shareDaily.textContent = '✓ Copied to Clipboard!';
                        setTimeout(() => {
                            shareDaily.textContent = '📤 Share Results';
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        shareDaily.textContent = '❌ Failed to copy';
                        setTimeout(() => {
                            shareDaily.textContent = '📤 Share Results';
                        }, 2000);
                    });
                } else {
                    console.error('No share text generated - date:', dailyData.date);
                }
            });
        }
        
        if (playDailyAgain) {
            playDailyAgain.addEventListener('click', () => {
                loadDailyPuzzle();
                hideModal();
                modalCancel.style.display = '';
                modalConfirm.textContent = 'Confirm';
            });
        }
    }, 100);
    
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
}

// Update daily puzzle button appearance
function updateDailyPuzzleButton() {
    const btn = document.getElementById('btnDaily');
    if (!btn) return;
    
    const completed = isDailyPuzzleCompleted();
    
    if (isDailyPuzzleMode) {
        btn.style.background = '#7c4a4a';
        btn.style.color = '#ffcccc';
        if (completed) {
            btn.innerHTML = '<span>✅</span> Daily (Completed)';
        } else {
            btn.innerHTML = '<span>📅</span> Daily (Active)';
        }
    } else {
        btn.style.background = '';
        btn.style.color = '';
        if (completed) {
            btn.innerHTML = '<span>✅</span> Daily';
        } else {
            btn.innerHTML = '<span>📅</span> Daily';
        }
    }
}

// Exit daily puzzle mode
function exitDailyPuzzleMode() {
    isDailyPuzzleMode = false;
    currentDailyDate = null;
    updateDailyPuzzleButton();
}
