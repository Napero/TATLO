// UI and Modal System

// Modal DOM elements
const modalOverlay = document.getElementById('modalOverlay');
const modalDialog = document.getElementById('modalDialog');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalError = document.getElementById('modalError');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const modalReset = document.getElementById('modalReset');

// Show a generic input modal
function showModal(title, inputs, onConfirm, defaults = null) {
    modalTitle.textContent = title;
    modalError.classList.remove('active');
    
    // Show/hide reset button based on whether defaults are provided
    if (defaults) {
        modalReset.classList.add('visible');
        // Set tooltip with default values
        const defaultsText = inputs.map((input, i) => {
            const label = input.label.replace(/\s*\(.*?\)\s*:?\s*/, ''); // Remove range info
            return `${label}: ${defaults[i]}`;
        }).join(', ');
        modalReset.title = `Reset to defaults (${defaultsText})`;
    } else {
        modalReset.classList.remove('visible');
        modalReset.title = '';
    }
    
    // Build input fields
    modalContent.innerHTML = '';
    inputs.forEach((input, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'modal-input-group';
        
        const label = document.createElement('label');
        label.className = 'modal-label';
        label.textContent = input.label;
        label.setAttribute('for', `modal-input-${index}`);
        
        const inputField = document.createElement('input');
        inputField.className = 'modal-input';
        inputField.id = `modal-input-${index}`;
        inputField.type = input.type || 'text';
        inputField.value = input.defaultValue || '';
        inputField.placeholder = input.placeholder || '';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(inputField);
        modalContent.appendChild(inputGroup);
    });
    
    // Show modal
    modalOverlay.classList.add('active');
    
    // Focus first input
    const firstInput = modalContent.querySelector('.modal-input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Handle reset to defaults
    const resetHandler = () => {
        if (defaults) {
            const inputFields = modalContent.querySelectorAll('.modal-input');
            defaults.forEach((defaultValue, index) => {
                if (inputFields[index]) {
                    inputFields[index].value = defaultValue;
                }
            });
        }
    };
    
    // Handle confirm
    const confirmHandler = () => {
        const values = Array.from(modalContent.querySelectorAll('.modal-input')).map(input => input.value);
        const result = onConfirm(values);
        
        if (result === false) {
            // Validation failed
            modalError.classList.add('active');
        } else {
            // Success - close modal
            hideModal();
            cleanup();
        }
    };
    
    // Handle cancel
    const cancelHandler = () => {
        hideModal();
        cleanup();
    };
    
    // Handle Enter key
    const keyHandler = (e) => {
        if (e.key === 'Enter') {
            confirmHandler();
        } else if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
        modalReset.removeEventListener('click', resetHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    modalCancel.addEventListener('click', cancelHandler);
    modalReset.addEventListener('click', resetHandler);
    document.addEventListener('keydown', keyHandler);
    
    // Hide hamburger menu on mobile when modal is open
    if (typeof hamburgerMenu !== 'undefined' && hamburgerMenu) {
        hamburgerMenu.classList.add('hidden');
    }
}

// Hide the modal
function hideModal() {
    modalOverlay.classList.remove('active');
    modalError.classList.remove('active');
    // Remove tabbed-modal class when closing
    modalDialog.classList.remove('tabbed-modal');
    // Show hamburger menu again on mobile
    if (hamburgerMenu) hamburgerMenu.classList.remove('hidden');
}

// Show grid selector for customizing flip pattern
function showGridSelector(onConfirm) {
    const gridSize = getPatternGridSize();
    const center = Math.floor(gridSize / 2);
    
    modalTitle.textContent = 'Select Flip Pattern';
    modalError.classList.remove('active');
    
    // Show reset button for grid selector
    modalReset.classList.add('visible');
    modalReset.title = 'Reset to default pattern (cross)';
    
    // Calculate cell size based on grid size to keep it reasonable
    // Max container width is 400px, with 4px gaps between cells
    const maxContainerWidth = 400;
    const gapSize = 4;
    const totalGapWidth = gapSize * (gridSize - 1);
    const maxCellSize = Math.floor((maxContainerWidth - totalGapWidth) / gridSize);
    // Clamp cell size between 8px and 35px
    const cellSize = Math.max(8, Math.min(35, maxCellSize));
    const containerWidth = cellSize * gridSize + totalGapWidth;
    
    // Create grid
    modalContent.innerHTML = '<div class="pattern-grid-container"><div class="pattern-grid"></div></div>';
    const gridContainer = modalContent.querySelector('.pattern-grid');
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${gridSize}, ${cellSize}px);
        grid-template-rows: repeat(${gridSize}, ${cellSize}px);
        gap: ${gapSize}px;
    `;
    
    // Initialize selection state based on current flipPattern
    const selected = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    
    function loadPattern(pattern) {
        // Clear current selection
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                selected[x][y] = false;
            }
        }
        // Load pattern
        pattern.forEach(({ dx, dy }) => {
            const gridX = center + dx;
            const gridY = center + dy;
            if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
                selected[gridX][gridY] = true;
            }
        });
        // Update cells visually
        updateCells();
    }
    
    function updateCells() {
        const cells = gridContainer.querySelectorAll('.pattern-cell');
        let index = 0;
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = cells[index];
                if (cell) {
                    if (selected[x][y]) {
                        cell.classList.add('selected');
                    } else {
                        cell.classList.remove('selected');
                    }
                }
                index++;
            }
        }
    }
    
    // Load current pattern
    loadPattern(flipPattern);
    
    // Track drag state
    let isDragging = false;
    let dragMode = null; // 'select' or 'deselect'
    
    // Create cells
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'pattern-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            const isCenter = (x === center && y === center);
            
            if (isCenter) {
                cell.classList.add('center');
            }
            
            if (selected[x][y]) {
                cell.classList.add('selected');
            }
            
            // Mouse down starts drag
            cell.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDragging = true;
                // Set drag mode based on current state
                dragMode = selected[x][y] ? 'deselect' : 'select';
                // Toggle this cell
                selected[x][y] = !selected[x][y];
                cell.classList.toggle('selected');
            });
            
            // Mouse enter continues drag
            cell.addEventListener('mouseenter', () => {
                if (isDragging && dragMode !== null) {
                    if (dragMode === 'select' && !selected[x][y]) {
                        selected[x][y] = true;
                        cell.classList.add('selected');
                    } else if (dragMode === 'deselect' && selected[x][y]) {
                        selected[x][y] = false;
                        cell.classList.remove('selected');
                    }
                }
            });
            
            // Click handler for single clicks (when not dragging)
            cell.addEventListener('click', (e) => {
                // Click is already handled by mousedown, but we prevent default behavior
                e.preventDefault();
            });
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Global mouse up ends drag
    const stopDragging = () => {
        isDragging = false;
        dragMode = null;
    };
    
    document.addEventListener('mouseup', stopDragging);
    
    // Also stop dragging if mouse leaves the modal
    modalOverlay.addEventListener('mouseleave', stopDragging);
    
    // Show modal
    modalOverlay.classList.add('active');
    
    // Handle reset to default pattern
    const resetHandler = () => {
        loadPattern(DEFAULT_FLIP_PATTERN);
    };
    
    // Handle confirm
    const confirmHandler = () => {
        // Build new flip pattern from selected cells
        const newPattern = [];
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (selected[x][y]) {
                    newPattern.push({
                        dx: x - center,
                        dy: y - center
                    });
                }
            }
        }
        
        // Easter egg for empty pattern
        if (newPattern.length === 0) {
            hideModal();
            modalReset.classList.remove('visible');
            setTimeout(() => {
                modalTitle.textContent = '🧘 Zen Master Mode! 🧘';
                modalContent.innerHTML = `
                    <div style="text-align: center; color: #d0d0d0; line-height: 1.8;">
                        <p style="font-size: 24px; margin: 20px 0;">🌟</p>
                        <p style="font-size: 18px; font-weight: bold; color: #ffdd00;">ENLIGHTENMENT ACHIEVED!</p>
                        <p>You've discovered the <strong>EMPTY PATTERN MODE</strong>!</p>
                        <p style="margin-top: 20px;">Click anywhere... and nothing happens. 🎭</p>
                        <p style="margin-top: 15px;">The puzzle is already solved!</p>
                        <p style="font-size: 14px; color: #888; margin-top: 20px; font-style: italic;">
                            (Hint: You might want to select at least one cell)
                        </p>
                    </div>
                `;
                modalOverlay.classList.add('active');
                modalCancel.style.display = 'none';
                modalConfirm.textContent = 'Got it!';
                
                const closeHandler = () => {
                    hideModal();
                    modalCancel.style.display = '';
                    modalConfirm.textContent = 'Confirm';
                    modalConfirm.removeEventListener('click', closeHandler);
                };
                modalConfirm.addEventListener('click', closeHandler);
            }, 100);
            cleanup();
            return;
        }
        
        // Allow empty pattern (flips nothing)
        flipPattern = newPattern;
        hideModal();
        modalReset.classList.remove('visible');
        cleanup();
        onConfirm();
    };
    
    // Handle cancel
    const cancelHandler = () => {
        hideModal();
        modalReset.classList.remove('visible');
        cleanup();
    };
    
    // Handle Enter key
    const keyHandler = (e) => {
        if (e.key === 'Enter') {
            confirmHandler();
        } else if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    const cleanup = () => {
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
        modalReset.removeEventListener('click', resetHandler);
        document.removeEventListener('keydown', keyHandler);
        document.removeEventListener('mouseup', stopDragging);
        modalOverlay.removeEventListener('mouseleave', stopDragging);
    };
    
    modalConfirm.addEventListener('click', confirmHandler);
    modalCancel.addEventListener('click', cancelHandler);
    modalReset.addEventListener('click', resetHandler);
    document.addEventListener('keydown', keyHandler);
}
