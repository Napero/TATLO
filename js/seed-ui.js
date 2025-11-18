// Seed Management UI

// Track consecutive invalid seed attempts
let invalidSeedAttempts = 0;

// Show combined seed and share modal
function showSeedModal() {
    modalTitle.textContent = 'Seed & Share';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    const seedDisplay = currentSeed || 'No seed loaded';
    const modeIndicator = isSetSeedMode 
        ? '<div style="background: #7c4a4a; padding: 8px; border-radius: 4px; text-align: center; margin-bottom: 15px; color: #ffcccc;"><strong>⚠️ SET SEED MODE ACTIVE</strong></div>' 
        : '';
    
    // Generate share URL
    const shareURL = generateShareableURL();
    
    // Get puzzle info for display
    const scoreData = calculateScore();
    const difficultyInfo = scoreData.difficulty;
    const patternCells = flipPattern.length;
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.8;">
            ${modeIndicator}
            
            <!-- Share Section -->
            <div style="margin-bottom: 25px; padding: 15px; background: #2a2a2a; border-radius: 8px; border: 1px solid #4a4a4a;">
                <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">🔗 Share This Puzzle</h3>
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 13px; color: #999; margin-bottom: 8px;">
                        ${difficultyInfo.emoji} ${difficultyInfo.name} • ${SIZE_X}×${SIZE_Y} • ${COLORS} colors • ${patternCells} cells
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <input type="text" id="shareURLDisplay" readonly value="${shareURL}" 
                           style="flex: 1; padding: 10px; background: #1a1a1a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="copyURLBtn" style="padding: 10px 16px; background: #4a7c59; border: none; 
                                                     color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-weight: bold;">
                        🔗 Copy Link
                    </button>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="shareSeedDisplay" readonly value="${seedDisplay}" 
                           style="flex: 1; padding: 10px; background: #1a1a1a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="copySeedBtn" style="padding: 10px 16px; background: #4a7c59; border: none; 
                                                     color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-weight: bold;">
                        📋 Copy Seed
                    </button>
                </div>
            </div>
            
            <!-- Load Seed Section -->
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">📥 Load Custom Seed</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="customSeedInput" placeholder="Paste seed here..." 
                           style="flex: 1; padding: 10px; background: #2a2a2a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="loadCustomSeedBtn" 
                            style="padding: 10px 16px; background: #4a7c59; border: none; 
                                   color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-weight: bold;">
                        ✅ Load
                    </button>
                </div>
                <div id="seedError" style="color: #ff6b6b; font-size: 12px; margin-top: 8px; display: none;">
                    Invalid seed format
                </div>
            </div>
            
            ${isSetSeedMode ? `
            <div>
                <button id="randomSeedBtn" 
                        style="width: 100%; padding: 12px; background: #7c4a4a; border: none; 
                               color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: bold;">
                    🎲 Return to Random Seed Mode
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    modalOverlay.classList.add('active');
    
    // Only show Close button
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Close';
    
    // Button handlers
    setTimeout(() => {
        const copyURLBtn = document.getElementById('copyURLBtn');
        const copySeedBtn = document.getElementById('copySeedBtn');
        const loadCustomSeedBtn = document.getElementById('loadCustomSeedBtn');
        const customSeedInput = document.getElementById('customSeedInput');
        const seedError = document.getElementById('seedError');
        const randomSeedBtn = document.getElementById('randomSeedBtn');
        
        copyURLBtn.addEventListener('click', () => {
            const shareText = generateShareText();
            if (shareText) {
                navigator.clipboard.writeText(shareText).then(() => {
                    copyURLBtn.innerHTML = '✓ Copied!';
                    setTimeout(() => {
                        copyURLBtn.innerHTML = '🔗 Copy Link';
                    }, 2000);
                });
            }
        });
        
        copySeedBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentSeed).then(() => {
                copySeedBtn.innerHTML = '✓ Copied!';
                setTimeout(() => {
                    copySeedBtn.innerHTML = '📋 Copy Seed';
                }, 2000);
            });
        });
        
        loadCustomSeedBtn.addEventListener('click', () => {
            const seedInput = customSeedInput.value.trim();
            if (seedInput) {
                const result = loadSeed(seedInput);
                if (result) {
                    hideModal();
                    modalCancel.style.display = '';
                    modalConfirm.textContent = 'Confirm';
                } else {
                    seedError.style.display = 'block';
                }
            }
        });
        
        customSeedInput.addEventListener('input', () => {
            seedError.style.display = 'none';
            invalidSeedAttempts = 0; // Reset counter when user starts typing
        });
        
        if (randomSeedBtn) {
            randomSeedBtn.addEventListener('click', () => {
                exitSetSeedMode();
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

// Load a seed and apply the configuration (enters set seed mode)
function loadSeed(seedString) {
    const parsed = parseSeedString(seedString);
    
    // Handle any type of invalid seed
    if (!parsed || parsed === 'exploit') {
        invalidSeedAttempts++;
        
        // Show easter egg modal on 3rd consecutive failure
        if (invalidSeedAttempts >= 3) {
            showExploitModal();
            invalidSeedAttempts = 0; // Reset counter
        }
        
        return false;
    }
    
    // Valid seed - reset counter and apply configuration
    invalidSeedAttempts = 0;
    
    // Enter set seed mode
    isSetSeedMode = true;
    setSeedValue = parsed.randomSeed;
    
    // Apply configuration
    SIZE_X = parsed.sizeX;
    SIZE_Y = parsed.sizeY;
    COLORS = parsed.colors;
    flipPattern = parsed.pattern;
    
    // Generate colors and reset with the specific seed
    generateColors();
    resetMatrix(parsed.randomSeed);
    resizeCanvas();
    updateDifficultyDisplay();
    
    return true;
}

// Show fun easter egg modal for exploit attempts
function showExploitModal() {
    modalTitle.textContent = 'Ummmmmm...';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    modalContent.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #f0f0f0;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
            <h2 style="color: #ff6b6b; margin: 15px 0;">What are you trying to break?</h2>
            <p style="font-size: 18px; margin: 20px 0; color: #d0d0d0;">(thx haykam hehe)</p>
        </div>
    `;
    
    modalCancel.style.display = 'none';
    modalConfirm.textContent = 'Bye';
    modalOverlay.classList.add('active');
    
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

// Exit set seed mode and return to random seeds
function exitSetSeedMode() {
    isSetSeedMode = false;
    setSeedValue = null;
    resetMatrix(); // Generate new random scramble
    updateDifficultyDisplay();
}

// Update the New Scramble button appearance based on mode
function updateNewScrambleButton() {
    const btn = document.getElementById('btnNewScramble');
    if (!btn) return;
    
    if (isSetSeedMode) {
        btn.innerHTML = '<span>🔄</span> Reset Set Seed <span class="keybind">R</span>';
        btn.style.background = '#7c4a4a';
        btn.style.color = '#ffcccc';
    } else {
        btn.innerHTML = '<span>🎲</span> New Scramble <span class="keybind">R</span>';
        btn.style.background = '';
        btn.style.color = '';
    }
}
