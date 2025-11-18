// Share and URL Parameter System

// Compress seed to base64 for shorter URLs
function compressSeed(seedString) {
    try {
        // Convert seed string to base64
        return btoa(seedString);
    } catch (e) {
        console.error('Failed to compress seed:', e);
        return seedString;
    }
}

// Decompress base64 seed back to string
function decompressSeed(compressed) {
    try {
        // Try to decode from base64
        return atob(compressed);
    } catch (e) {
        // If it fails, it might be an uncompressed seed, return as-is
        return compressed;
    }
}

// Parse URL parameters and auto-load seed if present
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    const compressedParam = urlParams.get('s'); // Short parameter for compressed seeds
    
    // Check for compressed seed first (shorter URLs)
    let seedToLoad = null;
    if (compressedParam) {
        seedToLoad = decompressSeed(compressedParam);
    } else if (seedParam) {
        seedToLoad = seedParam;
    }
    
    if (seedToLoad) {
        // Auto-load seed from URL
        const result = loadSeed(seedToLoad);
        if (result) {
            console.log('Auto-loaded seed from URL:', seedToLoad);
        } else {
            console.error('Failed to load seed from URL:', seedToLoad);
        }
    }
    
    // Check for daily puzzle parameter
    const dailyParam = urlParams.get('daily');
    if (dailyParam === 'true') {
        loadDailyPuzzle();
    }
}

// Generate shareable URL for current game
function generateShareableURL(useCompression = true) {
    if (!currentSeed) {
        return null;
    }
    
    const baseURL = window.location.origin + window.location.pathname;
    
    if (useCompression) {
        // Use compressed seed with short parameter
        const compressed = compressSeed(currentSeed);
        return `${baseURL}?s=${encodeURIComponent(compressed)}`;
    } else {
        // Use full seed (longer URL)
        return `${baseURL}?seed=${encodeURIComponent(currentSeed)}`;
    }
}

// Generate shareable text with stats and emoji art for any game
function generateShareText() {
    if (!currentSeed) {
        return null;
    }
    
    const shareURL = generateShareableURL();
    const scoreData = calculateScore();
    const difficultyEmoji = scoreData.difficulty.emoji;
    const difficultyName = scoreData.difficulty.name;
    
    // Check if pattern is default (cross pattern)
    const isDefaultPattern = flipPattern.length === 5 && 
        flipPattern.some(p => p.dx === 0 && p.dy === 0) &&
        flipPattern.some(p => p.dx === -1 && p.dy === 0) &&
        flipPattern.some(p => p.dx === 1 && p.dy === 0) &&
        flipPattern.some(p => p.dx === 0 && p.dy === -1) &&
        flipPattern.some(p => p.dx === 0 && p.dy === 1);
    
    const patternInfo = isDefaultPattern ? '' : ' • Custom pattern';
    
    let shareText = `TATLO Puzzle\n`;
    shareText += `${difficultyEmoji} ${difficultyName}\n`;
    shareText += `${SIZE_X}×${SIZE_Y} • ${COLORS} colors${patternInfo}\n\n`;
    
    // Add emoji grid visualization
    shareText += generateEmojiGrid(currentSeed);
    shareText += `\nPlay: ${shareURL}`;
    
    return shareText;
}

// Copy shareable URL to clipboard
function copyShareableURL() {
    const shareURL = generateShareableURL();
    
    if (!shareURL) {
        return false;
    }
    
    navigator.clipboard.writeText(shareURL).then(() => {
        return true;
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        return false;
    });
}

// Show temporary notification
function showTemporaryNotification(message, duration = 3000) {
    // Create notification element
    let notification = document.getElementById('shareNotification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'shareNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2a2a2a;
            color: #f0f0f0;
            padding: 15px 20px;
            border-radius: 8px;
            border: 2px solid #4a7c59;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.style.opacity = '0';
    }, duration);
}

// Show share modal with options
function showShareModal() {
    if (!currentSeed) {
        showTemporaryNotification('❌ No puzzle to share');
        return;
    }
    
    const shareURL = generateShareableURL();
    
    modalTitle.textContent = 'Share This Puzzle';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    const scoreData = calculateScore();
    const difficultyEmoji = scoreData.difficulty.emoji;
    const difficultyName = scoreData.difficulty.name;
    const difficultyScore = formatScore(scoreData.totalScore);
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.8;">
            <div style="margin-bottom: 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">${difficultyEmoji}</div>
                <div style="font-size: 18px; color: ${scoreData.difficulty.color}; font-weight: bold;">${difficultyName}</div>
                <div style="font-size: 14px; color: #a0a0a0;">Difficulty: ${difficultyScore}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 10px 0;">📋 Shareable Link:</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="shareURLInput" readonly value="${shareURL}" 
                           style="flex: 1; padding: 8px; background: #2a2a2a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="copyShareURLBtn" style="padding: 8px 16px; background: #4a7c59; border: none; 
                                                         color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace;">
                        📋 Copy
                    </button>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 10px 0;">🎲 Seed Code:</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="shareSeedInput" readonly value="${currentSeed}" 
                           style="flex: 1; padding: 8px; background: #2a2a2a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="copySeedCodeBtn" style="padding: 8px 16px; background: #4a7c59; border: none; 
                                                         color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace;">
                        📋 Copy
                    </button>
                </div>
            </div>
            
            <div style="background: #333; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #ffffff; margin: 0 0 10px 0;">🎯 Puzzle Info:</h4>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 15px; font-size: 13px;">
                    <span style="color: #888;">Grid:</span>
                    <span>${SIZE_X}×${SIZE_Y}</span>
                    <span style="color: #888;">Colors:</span>
                    <span>${COLORS}</span>
                    <span style="color: #888;">Pattern:</span>
                    <span>${flipPattern.length} cells</span>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">
                Share this link with friends to challenge them with the same puzzle!
            </div>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Close';
    
    setTimeout(() => {
        const copyShareURLBtn = document.getElementById('copyShareURLBtn');
        const copySeedCodeBtn = document.getElementById('copySeedCodeBtn');
        const shareURLInput = document.getElementById('shareURLInput');
        const shareSeedInput = document.getElementById('shareSeedInput');
        
        copyShareURLBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shareURL).then(() => {
                copyShareURLBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyShareURLBtn.textContent = '📋 Copy';
                }, 2000);
            });
        });
        
        copySeedCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentSeed).then(() => {
                copySeedCodeBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copySeedCodeBtn.textContent = '📋 Copy';
                }, 2000);
            });
        });
        
        // Select all on click
        shareURLInput.addEventListener('click', () => shareURLInput.select());
        shareSeedInput.addEventListener('click', () => shareSeedInput.select());
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
