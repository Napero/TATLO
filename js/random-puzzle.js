// Random Puzzle Generator

// Show random puzzle generator modal
function showRandomPuzzleModal() {
    modalTitle.textContent = '✨ Random Puzzle Generator';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.8;">
            <p style="margin-top: 0; color: #a0a0a0; font-size: 14px;">Generate a random puzzle configuration</p>
            
            <!-- Difficulty Selection -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">🎯 Target Difficulty</h3>
                <select id="randomDifficultySelect" style="width: 100%; padding: 10px; background: #2a2a2a; border: 1px solid #4a4a4a; color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 14px; cursor: pointer;">
                    <option value="700">🎁 Free (&lt;1,000)</option>
                    <option value="1500" selected>😊 Normal (1,000-2,000)</option>
                    <option value="3500">😰 Hard (2,000-5,000)</option>
                    <option value="6500">😱 Very Hard (5,000-8,000)</option>
                    <option value="10000">🤯 Ummmm (8,000-12,000)</option>
                    <option value="15000">😨 Horrified (12,000-20,000)</option>
                    <option value="35000">💀 Brutal (20,000-50,000)</option>
                    <option value="75000">☠️ Impossible (50,000+)</option>
                </select>
            </div>
            
            <!-- Options -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">⚙️ Options</h3>
                
                <label style="display: flex; align-items: center; padding: 12px; background: #2a2a2a; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">
                    <input type="checkbox" id="randomRainbow" style="width: 20px; height: 20px; cursor: pointer; margin-right: 12px;">
                    <div>
                        <div style="font-weight: bold; color: #f0f0f0;">🌈 Rainbow Colors</div>
                        <div style="font-size: 12px; color: #888; margin-top: 2px;">Use 3-6 colors instead of 2</div>
                    </div>
                </label>
                
                <label style="display: flex; align-items: center; padding: 12px; background: #2a2a2a; border-radius: 4px; cursor: pointer;">
                    <input type="checkbox" id="randomPattern" style="width: 20px; height: 20px; cursor: pointer; margin-right: 12px;">
                    <div>
                        <div style="font-weight: bold; color: #f0f0f0;">🎨 Random Pattern</div>
                        <div style="font-size: 12px; color: #888; margin-top: 2px;">Use a random click pattern instead of cross</div>
                    </div>
                </label>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="generateRandomBtn" style="width: 100%; padding: 14px; background: #4a7c59; border: none; color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: bold;">
                    ✨ Generate Puzzle
                </button>
            </div>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    modalCancel.style.display = '';
    modalConfirm.style.display = 'none';
    
    // Button handlers
    setTimeout(() => {
        const generateBtn = document.getElementById('generateRandomBtn');
        const difficultySelect = document.getElementById('randomDifficultySelect');
        const rainbowCheckbox = document.getElementById('randomRainbow');
        const patternCheckbox = document.getElementById('randomPattern');
        
        generateBtn.addEventListener('click', () => {
            const targetDifficulty = parseInt(difficultySelect.value);
            const useRainbow = rainbowCheckbox.checked;
            const useRandomPattern = patternCheckbox.checked;
            
            generateRandomPuzzle(targetDifficulty, useRainbow, useRandomPattern);
            hideModal();
        });
    }, 100);
    
    const cancelHandler = () => {
        hideModal();
        modalConfirm.style.display = '';
        cleanup();
    };
    
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    const cleanup = () => {
        modalCancel.removeEventListener('click', cancelHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    modalCancel.addEventListener('click', cancelHandler);
    document.addEventListener('keydown', keyHandler);
}

// Generate a random puzzle based on parameters
function generateRandomPuzzle(targetDifficulty, useRainbow, useRandomPattern) {
    console.log('Generating random puzzle:', { targetDifficulty, useRainbow, useRandomPattern });
    
    // Determine color count
    let colors = 2;
    if (useRainbow) {
        // Random between 3-6 colors
        colors = Math.floor(Math.random() * 4) + 3; // 3, 4, 5, or 6
    }
    
    // Determine pattern
    let pattern;
    if (useRandomPattern) {
        // Generate a random pattern (3-9 cells)
        pattern = generateRandomClickPattern();
    } else {
        // Use default cross pattern
        pattern = [
            { dx: 0, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
        ];
    }
    
    // Calculate grid size to achieve target difficulty
    // Use the actual scoring formula to work backwards
    const basePatternSize = 5;
    const actualPatternSize = pattern.length;
    const patternAdjustment = basePatternSize / actualPatternSize;
    
    // Target grid size from difficulty formula
    // difficulty = gridSize * colors * ln(colors) * patternAdjustment (approximately)
    const colorFactor = colors * Math.log(colors);
    const targetGridSize = Math.round(targetDifficulty / (colorFactor * patternAdjustment));
    
    console.log('Target grid size:', targetGridSize, 'for difficulty:', targetDifficulty);
    
    // Find reasonable grid dimensions (aspect ratio close to 7:5 = 1.4)
    let bestX = 7, bestY = 5;
    let minDiff = Math.abs(targetGridSize - 35);
    
    // Try different dimensions
    for (let x = 5; x <= 25; x++) {
        for (let y = 5; y <= 25; y++) {
            const area = x * y;
            const diff = Math.abs(area - targetGridSize);
            const aspectRatio = x / y;
            
            // Prefer aspect ratios between 1.0 and 1.8 (wider than tall)
            if (diff < minDiff && aspectRatio >= 1.0 && aspectRatio <= 1.8) {
                minDiff = diff;
                bestX = x;
                bestY = y;
            }
        }
    }
    
    console.log(`Selected dimensions: ${bestX}×${bestY} (area: ${bestX * bestY})`);
    
    // Apply configuration
    SIZE_X = bestX;
    SIZE_Y = bestY;
    COLORS = colors;
    flipPattern = [...pattern];
    
    // Generate and reset
    generateColors();
    resetMatrix();
    resizeCanvas();
    updateDifficultyDisplay();
    
    // Calculate and log actual difficulty
    const actualDifficulty = calculateScore();
    console.log(`Generated: ${SIZE_X}×${SIZE_Y}, ${COLORS} colors, ${pattern.length} cell pattern`);
    console.log(`Target difficulty: ${targetDifficulty}, Actual: ${actualDifficulty.totalScore} (${actualDifficulty.difficulty.name})`);
}

// Generate a random click pattern
function generateRandomClickPattern() {
    // Random pattern size (3-9 cells)
    const size = Math.floor(Math.random() * 7) + 3;
    
    const pattern = [{ dx: 0, dy: 0 }]; // Always include center
    const used = new Set(['0,0']);
    
    // Grid size for pattern (3x3 or 5x5)
    const gridSize = size <= 5 ? 3 : 5;
    const range = Math.floor(gridSize / 2);
    
    // Add random cells
    while (pattern.length < size) {
        const dx = Math.floor(Math.random() * (range * 2 + 1)) - range;
        const dy = Math.floor(Math.random() * (range * 2 + 1)) - range;
        const key = `${dx},${dy}`;
        
        if (!used.has(key)) {
            pattern.push({ dx, dy });
            used.add(key);
        }
    }
    
    return pattern;
}
