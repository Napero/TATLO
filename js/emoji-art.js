// Emoji Art Generator for Game States

// Generate emoji art for the current game matrix
function generateEmojiArt(matrixData, colorsArray) {
    let emojiGrid = '';
    
    const height = matrixData.length;
    const width = matrixData[0] ? matrixData[0].length : 0;
    
    // Emoji mapping:
    // 2 colors: black and white
    // 3-8 colors: rainbow sequence (red, orange, yellow, green, blue, purple)
    const rainbowEmojis = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'];
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = matrixData[y][x];
            
            // For 2-color mode, use black/white
            if (colorsArray.length === 2) {
                emojiGrid += colorIndex === 0 ? '⬛' : '⬜';
            }
            // For 3+ colors, use rainbow colors only
            else {
                // Wrap around if we have more than 6 colors
                const emojiIndex = colorIndex % rainbowEmojis.length;
                emojiGrid += rainbowEmojis[emojiIndex];
            }
        }
        emojiGrid += '\n';
    }
    
    return emojiGrid;
}

// Generate emoji art from the global game state
function generateCurrentGameEmojiArt() {
    return generateEmojiArt(matrix, rainbowColors);
}
