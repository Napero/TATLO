// LocalStorage management for best scores

// Generate a unique key for the current game configuration
function getConfigKey() {
    const patternKey = flipPattern.map(p => `${p.dx},${p.dy}`).sort().join('|');
    return `${SIZE_X}x${SIZE_Y}_c${COLORS}_p${patternKey}`;
}

// Load best scores from localStorage for current config
function loadBestScores() {
    const key = isSetSeedMode ? `setSeed_${currentSeed}` : getConfigKey();
    const prefix = isSetSeedMode ? 'tatlo_setSeed' : 'tatlo';
    
    const bestTime = localStorage.getItem(`${prefix}_bestTime_${key}`) ? parseInt(localStorage.getItem(`${prefix}_bestTime_${key}`)) : null;
    const bestMoves = localStorage.getItem(`${prefix}_bestMoves_${key}`) ? parseInt(localStorage.getItem(`${prefix}_bestMoves_${key}`)) : null;
    const bestSeed = localStorage.getItem(`${prefix}_bestSeed_${key}`) || null;
    return { bestTime, bestMoves, bestSeed };
}

// Save best scores to localStorage for current config
function saveBestScores(bestTime, bestMoves, seed) {
    const key = isSetSeedMode ? `setSeed_${currentSeed}` : getConfigKey();
    const prefix = isSetSeedMode ? 'tatlo_setSeed' : 'tatlo';
    
    if (bestTime !== null) {
        localStorage.setItem(`${prefix}_bestTime_${key}`, bestTime);
    }
    if (bestMoves !== null) {
        localStorage.setItem(`${prefix}_bestMoves_${key}`, bestMoves);
    }
    if (seed !== null) {
        localStorage.setItem(`${prefix}_bestSeed_${key}`, seed);
    }
}

// Generate a full seed string including config and random seed
function generateSeedString(randomSeed) {
    const patternKey = flipPattern.map(p => `${p.dx},${p.dy}`).sort().join('|');
    return `${SIZE_X}x${SIZE_Y}:${COLORS}c:${patternKey}:${randomSeed}`;
}

// Parse a seed string and return config + random seed
function parseSeedString(seedString) {
    try {
        const parts = seedString.split(':');
        if (parts.length !== 4) return null;
        
        const [sizeStr, colorsStr, patternStr, seedStr] = parts;
        
        // Parse size
        const sizeParts = sizeStr.split('x');
        if (sizeParts.length !== 2) return null;
        const sizeX = parseInt(sizeParts[0]);
        const sizeY = parseInt(sizeParts[1]);
        
        // Parse colors
        const colors = parseInt(colorsStr.replace('c', ''));
        
        // Parse pattern
        const pattern = patternStr.split('|').map(p => {
            const [dx, dy] = p.split(',').map(n => parseInt(n));
            return { dx, dy };
        });
        
        // Parse seed
        const randomSeed = parseInt(seedStr);
        
        // Validate
        if (isNaN(sizeX) || isNaN(sizeY) || isNaN(colors) || isNaN(randomSeed)) return null;
        if (sizeX < 1 || sizeX > 50 || sizeY < 1 || sizeY > 50) return null;
        if (colors < 2 || colors > 256) return null;
        
        return { sizeX, sizeY, colors, pattern, randomSeed };
    } catch (e) {
        return null;
    }
}
