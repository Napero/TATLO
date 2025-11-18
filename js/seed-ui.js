// Seed Management UI

// Show seed management modal
function showSeedModal() {
    modalTitle.textContent = 'Seed Management';
    modalError.classList.remove('active');
    modalReset.classList.remove('visible');
    
    const seedDisplay = currentSeed || 'No seed loaded';
    const modeIndicator = isSetSeedMode 
        ? '<div style="background: #7c4a4a; padding: 8px; border-radius: 4px; text-align: center; margin-bottom: 15px; color: #ffcccc;"><strong>⚠️ SET SEED MODE ACTIVE</strong></div>' 
        : '';
    
    modalContent.innerHTML = `
        <div style="color: #d0d0d0; line-height: 1.8;">
            ${modeIndicator}
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 10px 0;">Current Seed:</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="currentSeedDisplay" readonly value="${seedDisplay}" 
                           style="flex: 1; padding: 8px; background: #2a2a2a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="copySeedBtn" style="padding: 8px 16px; background: #4a7c59; border: none; 
                                                     color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace;">
                        📋 Copy
                    </button>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin: 10px 0;">Load Custom Seed:</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="customSeedInput" placeholder="Paste seed here..." 
                           style="flex: 1; padding: 8px; background: #2a2a2a; border: 1px solid #4a4a4a; 
                                  color: #f0f0f0; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px;">
                    <button id="loadCustomSeedBtn" 
                            style="padding: 8px 16px; background: #4a7c59; border: none; 
                                   color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace;">
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
                        style="width: 100%; padding: 12px; background: #4a7c59; border: none; 
                               color: white; border-radius: 4px; cursor: pointer; font-family: 'Courier New', Courier, monospace; font-size: 14px;">
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
        const copySeedBtn = document.getElementById('copySeedBtn');
        const loadCustomSeedBtn = document.getElementById('loadCustomSeedBtn');
        const customSeedInput = document.getElementById('customSeedInput');
        const seedError = document.getElementById('seedError');
        const randomSeedBtn = document.getElementById('randomSeedBtn');
        
        copySeedBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentSeed).then(() => {
                copySeedBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copySeedBtn.textContent = '📋 Copy';
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
    if (!parsed) {
        return false;
    }
    
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
