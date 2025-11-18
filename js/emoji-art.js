// Emoji Art Generator for Game States

// Convert RGB color to nearest emoji square
function colorToEmoji(rgbColor) {
    // Parse RGB color
    const match = rgbColor.match(/\d+/g);
    if (!match) {
        // Handle hex colors
        if (rgbColor.startsWith('#')) {
            const hex = rgbColor.slice(1);
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return rgbToEmoji(r, g, b);
        }
        // Handle HSL colors
        if (rgbColor.startsWith('hsl')) {
            const hslMatch = rgbColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
                const [_, h, s, l] = hslMatch.map(Number);
                return hslToEmoji(h, s, l);
            }
        }
        return '⬛';
    }
    
    const [r, g, b] = match.map(Number);
    return rgbToEmoji(r, g, b);
}

function rgbToEmoji(r, g, b) {
    // Calculate lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    
    // Very dark or very light
    if (lightness < 35) return '⬛'; // Black
    if (lightness > 220) return '⬜'; // White
    
    // If it's grayscale (low saturation)
    if (max - min < 40) {
        return lightness > 127 ? '⬜' : '⬛';
    }
    
    // Determine dominant color
    if (r > g + 30 && r > b + 30) {
        // Red dominant
        return '🟥';
    } else if (g > r + 30 && g > b + 30) {
        // Green dominant
        return '🟩';
    } else if (b > r + 30 && b > g + 30) {
        // Blue dominant
        return '🟦';
    } else if (r > b + 30 && g > b + 30) {
        // Yellow (red + green)
        return '🟨';
    } else if (r > g + 30 && b > g + 30) {
        // Purple/Magenta (red + blue)
        return '🟪';
    } else if (g > r + 30 && b > r + 30) {
        // Cyan (green + blue) - use blue
        return '🟦';
    } else if (Math.abs(r - b) < 30 && r > g + 30) {
        // Purple-ish
        return '🟪';
    } else if (Math.abs(r - g) < 30 && r > b + 30) {
        // Orange/Yellow-ish
        return '🟧';
    }
    
    // Default based on overall brightness
    return lightness > 127 ? '⬜' : '⬛';
}

function hslToEmoji(h, s, l) {
    // Very low lightness or saturation
    if (l < 15) return '⬛';
    if (l > 85) return '⬜';
    if (s < 20) return l > 50 ? '⬜' : '⬛';
    
    // Map hue to emoji colors
    if (h < 30 || h >= 330) {
        return '🟥'; // Red (0-30, 330-360)
    } else if (h < 60) {
        return '🟧'; // Orange (30-60)
    } else if (h < 90) {
        return '🟨'; // Yellow (60-90)
    } else if (h < 150) {
        return '🟩'; // Green (90-150)
    } else if (h < 210) {
        return '🟦'; // Blue (150-210)
    } else if (h < 270) {
        return '🟦'; // Blue (210-270)
    } else {
        return '🟪'; // Purple (270-330)
    }
}

// Generate emoji art for the current game matrix
function generateEmojiArt(matrixData, colorsArray) {
    let emojiGrid = '';
    
    const height = matrixData.length;
    const width = matrixData[0] ? matrixData[0].length : 0;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = matrixData[y][x];
            const color = colorsArray[colorIndex];
            emojiGrid += colorToEmoji(color);
        }
        emojiGrid += '\n';
    }
    
    return emojiGrid;
}

// Generate emoji art from the global game state
function generateCurrentGameEmojiArt() {
    return generateEmojiArt(matrix, rainbowColors);
}
