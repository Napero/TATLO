// Scoring System for TATLO

// Base configuration (original game): 5x7, 2 colors, cross pattern (+)
const BASE_SIZE_X = 7;
const BASE_SIZE_Y = 5;
const BASE_COLORS = 2;
const BASE_PATTERN = [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 }
];
const BASE_SCORE = 1000;

// Calculate normalization factor once
// This ensures the base configuration always scores exactly 1000
let NORMALIZATION_FACTOR = null;

function calculateNormalizationFactor() {
    if (NORMALIZATION_FACTOR !== null) return NORMALIZATION_FACTOR;
    
    // Calculate what the base config would produce without normalization
    const baseGridMult = getGridSizeMultiplier(BASE_SIZE_X, BASE_SIZE_Y);
    const baseColorsMult = getColorsMultiplier(BASE_COLORS);
    
    // Replicate getPatternMultiplier logic for BASE_PATTERN
    const pattern = BASE_PATTERN;
    const affectedCells = pattern.length; // 5 for cross
    const baseTotalCells = BASE_SIZE_X * BASE_SIZE_Y;
    const affectedRatio = affectedCells / baseTotalCells;
    
    // Cell multiplier for base (5 cells)
    const cellRatio = affectedCells / 5.0; // = 1.0
    const cellMultiplier = Math.pow(cellRatio, 0.6); // = 1.0
    
    // Max distance for base cross pattern
    let maxDistance = 0;
    for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
            const dx = pattern[i].dx - pattern[j].dx;
            const dy = pattern[i].dy - pattern[j].dy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            maxDistance = Math.max(maxDistance, dist);
        }
    }
    const baseMaxDistance = 2.83;
    const spreadRatio = maxDistance / baseMaxDistance; // ~1.0
    const spreadMultiplier = Math.pow(Math.max(0.8, spreadRatio), 0.7);
    
    // Connectivity for base cross (fully connected)
    let adjacencyCount = 0;
    for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
            const dx = Math.abs(pattern[i].dx - pattern[j].dx);
            const dy = Math.abs(pattern[i].dy - pattern[j].dy);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                adjacencyCount++;
            }
        }
    }
    const minAdjacencies = Math.max(1, affectedCells - 1);
    const connectivity = Math.min(1.0, adjacencyCount / minAdjacencies); // ~1.0 for cross
    const connectivityMultiplier = 1.0 + ((1.0 - connectivity) * 0.4); // ~1.0
    
    // Shape for base cross
    const minX = Math.min(...pattern.map(c => c.dx));
    const maxX = Math.max(...pattern.map(c => c.dx));
    const minY = Math.min(...pattern.map(c => c.dy));
    const maxY = Math.max(...pattern.map(c => c.dy));
    const boundingWidth = maxX - minX + 1;
    const boundingHeight = maxY - minY + 1;
    const boundingArea = boundingWidth * boundingHeight;
    const density = affectedCells / boundingArea; // 5/9 = 0.56
    
    // Shape multiplier for base cross (density ~0.56, irregular)
    const shapeMultiplier = 1.0 + ((1.0 - density) * 0.5); // ~1.22
    
    // Combine all factors for base
    const basePatternMult = cellMultiplier * 
                           spreadMultiplier * 
                           connectivityMultiplier * 
                           shapeMultiplier;
    
    const basePatternMultClamped = Math.max(0.3, Math.min(3.0, basePatternMult));
    
    const baseTotalMult = baseGridMult * baseColorsMult * basePatternMultClamped;
    
    // Normalization factor to make base config = 1.0
    NORMALIZATION_FACTOR = 1.0 / baseTotalMult;
    
    return NORMALIZATION_FACTOR;
}

// Calculate difficulty multiplier based on grid size
function getGridSizeMultiplier(sizeX, sizeY) {
    const baseArea = BASE_SIZE_X * BASE_SIZE_Y; // 35
    const currentArea = sizeX * sizeY;
    
    // Polynomial scaling: smaller grids are easier, larger grids are harder
    // Using area ratio with power of 1.5 for polynomial growth
    const multiplier = Math.pow(currentArea / baseArea, 1.5);
    
    return multiplier;
}

// Calculate difficulty multiplier based on number of colors
function getColorsMultiplier(colors) {
    // More colors = exponentially harder
    // Using power of 1.8 for strong polynomial growth
    const multiplier = Math.pow(colors / BASE_COLORS, 1.8);
    
    return multiplier;
}

// Calculate pattern complexity score
function getPatternComplexity(pattern) {
    // Two factors:
    // 1. Number of cells (more cells = easier to solve)
    // 2. Distance between cells (more spread = harder to predict)
    
    const numCells = pattern.length;
    
    // Calculate average distance from center (0,0)
    let totalDistance = 0;
    for (const cell of pattern) {
        const distance = Math.sqrt(cell.dx * cell.dx + cell.dy * cell.dy);
        totalDistance += distance;
    }
    const avgDistance = totalDistance / numCells;
    
    // Calculate spread (max distance between any two cells)
    let maxSpread = 0;
    for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
            const dx = pattern[i].dx - pattern[j].dx;
            const dy = pattern[i].dy - pattern[j].dy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            maxSpread = Math.max(maxSpread, distance);
        }
    }
    
    return { numCells, avgDistance, maxSpread };
}

// Calculate difficulty multiplier based on click pattern
function getPatternMultiplier(pattern) {
    const affectedCells = pattern.length;
    const totalCells = SIZE_X * SIZE_Y;
    const affectedRatio = affectedCells / totalCells;
        
    // FACTOR 1: Cell Count (linear scaling, then logarithmic)
    let cellMultiplier;
    if (affectedCells === 1) {
        // Single cell is trivial - clicking = toggling
        cellMultiplier = 0.3;
    } else if (affectedRatio > 0.5) {
        // Flipping >50% of grid each click = actually easier
        // Less precision needed
        cellMultiplier = 0.7;
    } else {
        // More cells = more complexity, but with diminishing returns
        // Scale relative to base pattern (5 cells)
        const cellRatio = affectedCells / 5.0;
        cellMultiplier = Math.pow(cellRatio, 0.6); // 0.6x to 1.6x for 2-20 cells
    }
    
    // FACTOR 2: Spread/Reach (how far apart are the cells?)
    let maxDistance = 0;
    for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
            const dx = pattern[i].dx - pattern[j].dx;
            const dy = pattern[i].dy - pattern[j].dy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            maxDistance = Math.max(maxDistance, dist);
        }
    }
    
    // Normalize against base pattern max distance (~2.83 for cross)
    const baseMaxDistance = 2.83;
    const spreadRatio = maxDistance / baseMaxDistance;
    const spreadMultiplier = Math.pow(Math.max(0.8, spreadRatio), 0.7); // 0.8x to 2.0x+
    
    // FACTOR 3: Connectivity (are cells clustered or scattered?)
    let adjacencyCount = 0;
    for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
            const dx = Math.abs(pattern[i].dx - pattern[j].dx);
            const dy = Math.abs(pattern[i].dy - pattern[j].dy);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                adjacencyCount++;
            }
        }
    }
    
    // Connectivity: 0 = scattered, 1 = fully connected
    const minAdjacencies = Math.max(1, affectedCells - 1); // Tree connectivity
    const connectivity = Math.min(1.0, adjacencyCount / minAdjacencies);
    
    // Low connectivity = harder (scattered cells)
    // Range: 0.9x (connected) to 1.4x (scattered)
    const connectivityMultiplier = 1.0 + ((1.0 - connectivity) * 0.4);
    
    // FACTOR 4: Shape Regularity (rectangle vs irregular)
    const minX = Math.min(...pattern.map(c => c.dx));
    const maxX = Math.max(...pattern.map(c => c.dx));
    const minY = Math.min(...pattern.map(c => c.dy));
    const maxY = Math.max(...pattern.map(c => c.dy));
    const boundingWidth = maxX - minX + 1;
    const boundingHeight = maxY - minY + 1;
    const boundingArea = boundingWidth * boundingHeight;
    
    // How much of bounding box is filled?
    const density = affectedCells / boundingArea;
    
    // Dense rectangles are easier, sparse irregular shapes are harder
    // Range: 0.8x (filled rectangle) to 1.3x (sparse/irregular)
    let shapeMultiplier;
    if (density > 0.8) {
        // Nearly filled rectangle - easier
        shapeMultiplier = 0.8 + (density * 0.2); // 0.8x to 1.0x
    } else {
        // Irregular/sparse - harder
        shapeMultiplier = 1.0 + ((1.0 - density) * 0.5); // 1.0x to 1.4x
    }
    
    // COMBINE ALL FACTORS
    const finalMultiplier = cellMultiplier * 
                           spreadMultiplier * 
                           connectivityMultiplier * 
                           shapeMultiplier;
    
    // Clamp to reasonable range
    return Math.max(0.3, Math.min(3.0, finalMultiplier));
}

// Calculate total score for current configuration
function calculateScore() {
    // Ensure normalization factor is calculated
    const normFactor = calculateNormalizationFactor();
    
    const gridMultiplier = getGridSizeMultiplier(SIZE_X, SIZE_Y);
    const colorsMultiplier = getColorsMultiplier(COLORS);
    const patternMultiplier = getPatternMultiplier(flipPattern);
    
    const totalMultiplier = gridMultiplier * colorsMultiplier * patternMultiplier * normFactor;
    const totalScore = Math.round(BASE_SCORE * totalMultiplier);
    const difficulty = getDifficultyRating(totalScore);
    
    return {
        totalScore: totalScore,
        difficulty: difficulty,
        multipliers: {
            grid: gridMultiplier.toFixed(2),
            colors: colorsMultiplier.toFixed(2),
            pattern: patternMultiplier.toFixed(2),
            total: totalMultiplier.toFixed(2)
        }
    };
}

// Get difficulty rating based on score
function getDifficultyRating(score) {
    if (score < 1000) return { name: 'Free', emoji: '🎁', color: '#4ade80' };
    if (score < 2000) return { name: 'Normal', emoji: '😊', color: '#86efac' };
    if (score < 5000) return { name: 'Hard', emoji: '😰', color: '#fbbf24' };
    if (score < 8000) return { name: 'Very Hard', emoji: '😱', color: '#fb923c' };
    if (score < 12000) return { name: 'Ummmm', emoji: '🤯', color: '#f87171' };
    if (score < 20000) return { name: 'Horrified', emoji: '😨', color: '#dc2626' };
    if (score < 50000) return { name: 'Brutal', emoji: '💀', color: '#991b1b' };
    return { name: 'Impossible', emoji: '☠️', color: '#7f1d1d' };
}

// Format score with thousands separators
function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
