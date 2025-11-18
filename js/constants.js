// Game Configuration Constants
const DEFAULT_SIZE_X = 7;
const DEFAULT_SIZE_Y = 5;
const DEFAULT_COLORS = 2;

// Default flip pattern: center + up + down + left + right (cross)
const DEFAULT_FLIP_PATTERN = [
    { dx: 0, dy: 0 },   // center
    { dx: -1, dy: 0 },  // left
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: -1 },  // up
    { dx: 0, dy: 1 }    // down
];

// Game State Variables
let SIZE_X = DEFAULT_SIZE_X;
let SIZE_Y = DEFAULT_SIZE_Y;
let COLORS = DEFAULT_COLORS;
let CELL_SIZE = 100;
let SCREEN_WIDTH = SIZE_X * CELL_SIZE;
let SCREEN_HEIGHT = SIZE_Y * CELL_SIZE;

let rainbowColors = [];
let flipPattern = [...DEFAULT_FLIP_PATTERN];

// Seed system
let currentSeed = null;
let isSetSeedMode = false;
let setSeedValue = null;

// Simple seeded random number generator (mulberry32)
function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Helper function to get pattern grid size
function getPatternGridSize() {
    const maxDim = Math.max(SIZE_X, SIZE_Y);
    // Ensure odd number for center cell
    return maxDim % 2 === 0 ? maxDim - 1 : maxDim;
}
