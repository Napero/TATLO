// Leaderboard UI

// Calculate difficulty from seed string
function getDifficultyFromSeed(seedString) {
    if (!seedString) return null;
    
    const parsed = parseSeedString(seedString);
    if (!parsed || parsed === 'exploit') return null;
    
    // Temporarily store current config
    const oldSizeX = SIZE_X;
    const oldSizeY = SIZE_Y;
    const oldColors = COLORS;
    const oldPattern = [...flipPattern];
    
    // Apply seed config
    SIZE_X = parsed.sizeX;
    SIZE_Y = parsed.sizeY;
    COLORS = parsed.colors;
    flipPattern = parsed.pattern;
    
    // Calculate score
    const scoreData = calculateScore();
    const difficulty = scoreData ? scoreData.difficulty : null;
    
    // Restore original config
    SIZE_X = oldSizeX;
    SIZE_Y = oldSizeY;
    COLORS = oldColors;
    flipPattern = oldPattern;
    
    return difficulty;
}

// Get all best scores from localStorage
function getAllBestScores() {
    const randomScores = [];
    const setSeedScores = [];
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Check for random seed scores
        if (key.startsWith('tatlo_bestTime_') && !key.includes('setSeed')) {
            const configKey = key.replace('tatlo_bestTime_', '');
            const time = parseInt(localStorage.getItem(key));
            const moves = localStorage.getItem(`tatlo_bestMoves_${configKey}`) ? parseInt(localStorage.getItem(`tatlo_bestMoves_${configKey}`)) : null;
            const seed = localStorage.getItem(`tatlo_bestSeed_${configKey}`) || null;
            const difficultyScore = localStorage.getItem(`tatlo_bestDifficulty_${configKey}`) ? parseInt(localStorage.getItem(`tatlo_bestDifficulty_${configKey}`)) : null;
            
            let difficulty = null;
            if (difficultyScore !== null) {
                difficulty = getDifficultyRating(difficultyScore);
            } else if (seed) {
                // Fallback: calculate from seed if not stored
                difficulty = getDifficultyFromSeed(seed);
            }
            
            if (time !== null) {
                randomScores.push({ configKey, time, moves, seed, difficulty });
            }
        }
        
        // Check for set seed scores
        if (key.startsWith('tatlo_setSeed_bestTime_')) {
            const seedKey = key.replace('tatlo_setSeed_bestTime_', '');
            const time = parseInt(localStorage.getItem(key));
            const moves = localStorage.getItem(`tatlo_setSeed_bestMoves_${seedKey}`) ? parseInt(localStorage.getItem(`tatlo_setSeed_bestMoves_${seedKey}`)) : null;
            const difficultyScore = localStorage.getItem(`tatlo_setSeed_bestDifficulty_${seedKey}`) ? parseInt(localStorage.getItem(`tatlo_setSeed_bestDifficulty_${seedKey}`)) : null;
            
            let difficulty = null;
            if (difficultyScore !== null) {
                difficulty = getDifficultyRating(difficultyScore);
            } else {
                // Fallback: calculate from seed
                difficulty = getDifficultyFromSeed(seedKey);
            }
            
            if (time !== null) {
                setSeedScores.push({ seed: seedKey, time, moves, difficulty });
            }
        }
    }
    
    // Sort by time (best first)
    randomScores.sort((a, b) => a.time - b.time);
    setSeedScores.sort((a, b) => a.time - b.time);
    
    return { randomScores, setSeedScores };
}

// Format configuration key for display
function formatConfigKey(configKey) {
    const parts = configKey.split('_');
    const size = parts[0]; // e.g., "7x5"
    const colors = parts[1].replace('c', '') + ' colors'; // e.g., "2 colors"
    return `${size}, ${colors}`;
}

// Show leaderboard modal
function showLeaderboard() {
    modalDialog.classList.add('tabbed-modal');
    modalTitle.textContent = 'Leaderboard';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    const { randomScores, setSeedScores } = getAllBestScores();
    
    // Build random seed section
    let randomHtml = '';
    if (randomScores.length === 0) {
        randomHtml = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No records yet</p>';
    } else {
        randomHtml = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">';
        randomHtml += '<colgroup>';
        randomHtml += '<col style="width: 40px;">'; // Rank
        randomHtml += '<col style="width: 120px;">'; // Config
        randomHtml += '<col style="width: 70px;">'; // Difficulty
        randomHtml += '<col style="width: 90px;">'; // Time
        randomHtml += '<col style="width: 70px;">'; // Moves
        randomHtml += '<col style="width: 150px;">'; // Seed
        randomHtml += '</colgroup>';
        randomHtml += '<thead><tr style="background: #2a2a2a; text-align: left;">';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">#</th>';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Config</th>';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Difficulty</th>';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Time</th>';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Moves</th>';
        randomHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Seed</th>';
        randomHtml += '</tr></thead><tbody>';
        
        randomScores.forEach((score, index) => {
            const bgColor = index % 2 === 0 ? '#3a3a3a' : '#333333';
            const difficultyDisplay = score.difficulty 
                ? `<span style="color: ${score.difficulty.color};">${score.difficulty.emoji}</span>` 
                : 'N/A';
            randomHtml += `<tr style="background: ${bgColor};">`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a;">${index + 1}</td>`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a;">${formatConfigKey(score.configKey)}</td>`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; text-align: center;">${difficultyDisplay}</td>`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; color: #88ccff;">${formatTime(score.time)}</td>`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; color: #88ff88;">${score.moves || 'N/A'}</td>`;
            randomHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; font-size: 10px; word-break: break-all; cursor: pointer; color: #88ccff;" 
                             class="copy-seed" data-seed="${score.seed || ''}" title="Click to copy">${score.seed || 'N/A'}</td>`;
            randomHtml += '</tr>';
        });
        
        randomHtml += '</tbody></table></div>';
    }
    
    // Build set seed section
    let setSeedHtml = '';
    if (setSeedScores.length === 0) {
        setSeedHtml = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No records yet</p>';
    } else {
        setSeedHtml = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">';
        setSeedHtml += '<colgroup>';
        setSeedHtml += '<col style="width: 40px;">'; // Rank
        setSeedHtml += '<col>'; // Seed (flexible)
        setSeedHtml += '<col style="width: 60px;">'; // Difficulty
        setSeedHtml += '<col style="width: 80px;">'; // Time
        setSeedHtml += '<col style="width: 60px;">'; // Moves
        setSeedHtml += '<col style="width: 80px;">'; // Action
        setSeedHtml += '</colgroup>';
        setSeedHtml += '<thead><tr style="background: #2a2a2a; text-align: left;">';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">#</th>';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Seed</th>';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Diff</th>';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Time</th>';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Moves</th>';
        setSeedHtml += '<th style="padding: 8px; border: 1px solid #4a4a4a;">Action</th>';
        setSeedHtml += '</tr></thead><tbody>';
        
        setSeedScores.forEach((score, index) => {
            const bgColor = index % 2 === 0 ? '#3a3a3a' : '#333333';
            const difficultyDisplay = score.difficulty 
                ? `<span style="color: ${score.difficulty.color};">${score.difficulty.emoji}</span>` 
                : 'N/A';
            setSeedHtml += `<tr style="background: ${bgColor};">`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a;">${index + 1}</td>`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; font-size: 10px; word-break: break-all; cursor: pointer; color: #88ccff;" 
                             class="copy-seed" data-seed="${score.seed}" title="Click to copy">${score.seed}</td>`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; text-align: center;">${difficultyDisplay}</td>`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; color: #88ccff;">${formatTime(score.time)}</td>`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a; color: #88ff88;">${score.moves || 'N/A'}</td>`;
            setSeedHtml += `<td style="padding: 8px; border: 1px solid #4a4a4a;"><button class="load-seed-btn" data-seed="${score.seed}" style="padding: 4px 8px; background: #4a7c59; border: none; color: white; border-radius: 3px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 11px;">▶️ Load</button></td>`;
            setSeedHtml += '</tr>';
        });
        
        setSeedHtml += '</tbody></table></div>';
    }
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.6; display: flex; flex-direction: column; height: 100%;">
            <!-- Tab Navigation -->
            <div class="leaderboard-tabs-container" style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 2px solid #4a4a4a; flex-shrink: 0; flex-wrap: wrap;">
                <button id="tabRandomSeed" class="leaderboard-tab active" style="flex: 1; min-width: 120px; padding: 12px 8px; background: #4a7c59; border: none; color: white; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 13px; border-radius: 4px 4px 0 0; transition: background 0.2s;">
                    <span style="font-size: 16px;">🎲</span> <span class="tab-text">Random Seed</span>
                </button>
                <button id="tabSetSeed" class="leaderboard-tab" style="flex: 1; min-width: 120px; padding: 12px 8px; background: #3a3a3a; border: none; color: #b0b0b0; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 13px; border-radius: 4px 4px 0 0; transition: background 0.2s;">
                    <span style="font-size: 16px;">🔢</span> <span class="tab-text">Set Seed</span>
                </button>
            </div>
            
            <!-- Scrollable Content Wrapper -->
            <div style="flex: 1; overflow-y: auto; overflow-x: hidden; padding-right: 10px;" class="leaderboard-scroll-container">
            
            <!-- Tab Content: Random Seed -->
            <div id="contentRandomSeed" class="tab-content">
                ${randomHtml}
            </div>
            
            <!-- Tab Content: Set Seed -->
            <div id="contentSetSeed" class="tab-content" style="display: none;">
                ${setSeedHtml}
            </div>
            
            </div><!-- End scrollable content wrapper -->
        </div>
    `;
    
    modalOverlay.classList.add('active');
    
    // Only show Close button
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Close';
    
    // Add event listeners
    setTimeout(() => {
        // Tab switching
        const tabRandomSeed = document.getElementById('tabRandomSeed');
        const tabSetSeed = document.getElementById('tabSetSeed');
        const contentRandomSeed = document.getElementById('contentRandomSeed');
        const contentSetSeed = document.getElementById('contentSetSeed');
        
        tabRandomSeed.addEventListener('click', () => {
            tabRandomSeed.style.background = '#4a7c59';
            tabRandomSeed.style.color = 'white';
            tabSetSeed.style.background = '#3a3a3a';
            tabSetSeed.style.color = '#b0b0b0';
            contentRandomSeed.style.display = 'block';
            contentSetSeed.style.display = 'none';
        });
        
        tabSetSeed.addEventListener('click', () => {
            tabSetSeed.style.background = '#4a7c59';
            tabSetSeed.style.color = 'white';
            tabRandomSeed.style.background = '#3a3a3a';
            tabRandomSeed.style.color = '#b0b0b0';
            contentSetSeed.style.display = 'block';
            contentRandomSeed.style.display = 'none';
        });
        
        // Copy seed on click
        const copySeedCells = modalContent.querySelectorAll('.copy-seed');
        copySeedCells.forEach(cell => {
            cell.addEventListener('click', () => {
                const seed = cell.getAttribute('data-seed');
                if (seed && seed !== '') {
                    navigator.clipboard.writeText(seed).then(() => {
                        const originalText = cell.textContent;
                        const originalColor = cell.style.color;
                        cell.textContent = '✓ Copied!';
                        cell.style.color = '#88ff88';
                        setTimeout(() => {
                            cell.textContent = originalText;
                            cell.style.color = originalColor;
                        }, 1500);
                    });
                }
            });
        });
        
        // Load seed buttons
        const loadButtons = modalContent.querySelectorAll('.load-seed-btn');
        loadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const seed = btn.getAttribute('data-seed');
                if (seed) {
                    loadSeed(seed);
                    hideModal();
                    modalCancel.style.display = '';
                    modalConfirm.textContent = 'Confirm';
                }
            });
        });
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
