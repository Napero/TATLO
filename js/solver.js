/**
 * TATLO Solver - Complete Rewrite
 * 
 * This solver works for ANY board size and ANY number of colors (including composite numbers).
 * It uses Gaussian elimination over Z_MOD with proper handling of composite moduli.
 */

// ============================================================================
// UI STATE VARIABLES
// ============================================================================
var solverActive = false;
var solutionSteps = [];
var currentStep = 0;
var hintOverlay = null;
var autoSolveCompleted = false;
var autoClickActive = false;
var autoClickInterval = null;

// ============================================================================
// CORE MATHEMATICAL HELPERS
// ============================================================================

/**
 * Compute n modulo MOD in range [0, MOD-1]
 */
function mod(n, MOD) {
    const result = n % MOD;
    return result < 0 ? result + MOD : result;
}

/**
 * Extended Euclidean Algorithm
 * Returns { g, x, y } such that a*x + b*y = g, where g = gcd(a, b)
 */
function egcd(a, b) {
    if (b === 0) {
        return { g: Math.abs(a), x: a >= 0 ? 1 : -1, y: 0 };
    }
    
    let x0 = 0, x1 = 1;
    let y0 = 1, y1 = 0;
    
    while (b !== 0) {
        const q = Math.floor(a / b);
        let temp = b;
        b = a % b;
        a = temp;
        
        temp = x0;
        x0 = x1 - q * x0;
        x1 = temp;
        
        temp = y0;
        y0 = y1 - q * y0;
        y1 = temp;
    }
    
    return { g: Math.abs(a), x: a >= 0 ? x1 : -x1, y: a >= 0 ? y1 : -y1 };
}

/**
 * Compute modular inverse of a modulo MOD
 * Returns null if no inverse exists (when gcd(a, MOD) != 1)
 */
function modInv(a, MOD) {
    a = mod(a, MOD);
    if (a === 0) return null;
    
    const result = egcd(a, MOD);
    if (result.g !== 1) return null; // No inverse exists
    
    return mod(result.x, MOD);
}

// ============================================================================
// LINEAR ALGEBRA OVER Z_MOD
// ============================================================================

/**
 * Build the move matrix A for the TATLO game
 * A[row][col] = 1 if clicking cell col affects cell row, else 0
 * Uses the current flipPattern from the game
 */
function buildMoveMatrix(width, height, MOD) {
    const N = width * height;
    const A = Array.from({ length: N }, () => Array(N).fill(0));
    
    // Helper to convert (x, y) to flat index (row-major order)
    const idx = (x, y) => y * width + x;
    
    // For each cell that can be clicked
    for (let clickX = 0; clickX < width; clickX++) {
        for (let clickY = 0; clickY < height; clickY++) {
            const clickIdx = idx(clickX, clickY);
            
            // Apply the flip pattern
            flipPattern.forEach(({ dx, dy }) => {
                const affectedX = clickX + dx;
                const affectedY = clickY + dy;
                
                // Check if the affected cell is within bounds
                if (affectedX >= 0 && affectedX < width && 
                    affectedY >= 0 && affectedY < height) {
                    const affectedIdx = idx(affectedX, affectedY);
                    A[affectedIdx][clickIdx] = 1;
                }
            });
        }
    }
    
    return A;
}

/**
 * Flatten a 2D board into a 1D state vector (row-major order)
 * Note: board is indexed as board[x][y] where x is column, y is row
 * We flatten in row-major order: for each row y, iterate through columns x
 */
function flattenBoard(board, width, height) {
    const state = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            state.push(board[x][y]);
        }
    }
    return state;
}

/**
 * Build the right-hand side vector b
 * b[i] = (targetColor - stateVector[i]) mod MOD
 */
function buildRightHandSide(stateVector, MOD, targetColor) {
    return stateVector.map(s => mod(targetColor - s, MOD));
}

/**
 * Factor a number into prime powers
 * Returns array of {prime, power} objects
 */
function factorIntoPrimePowers(n) {
    const factors = [];
    let remaining = n;
    
    // Check for factor of 2
    if (remaining % 2 === 0) {
        let power = 0;
        while (remaining % 2 === 0) {
            power++;
            remaining /= 2;
        }
        factors.push({ prime: 2, power, modulus: Math.pow(2, power) });
    }
    
    // Check odd factors
    for (let p = 3; p * p <= remaining; p += 2) {
        if (remaining % p === 0) {
            let power = 0;
            while (remaining % p === 0) {
                power++;
                remaining /= p;
            }
            factors.push({ prime: p, power, modulus: Math.pow(p, power) });
        }
    }
    
    // Remaining is prime
    if (remaining > 1) {
        factors.push({ prime: remaining, power: 1, modulus: remaining });
    }
    
    return factors;
}

/**
 * Solve linear congruence using Chinese Remainder Theorem
 * Given solutions x ≡ a_i (mod m_i), find x (mod M) where M = product of m_i
 */
function chineseRemainderTheorem(residues, moduli) {
    const M = moduli.reduce((a, b) => a * b, 1);
    let x = 0;
    
    for (let i = 0; i < residues.length; i++) {
        const Mi = M / moduli[i];
        const yi = modInv(Mi, moduli[i]);
        if (yi === null) {
            console.error(`CRT failed: no inverse for ${Mi} mod ${moduli[i]}`);
            return null;
        }
        x += residues[i] * Mi * yi;
    }
    
    return mod(x, M);
}

/**
 * Core linear system solver: A * x ≡ b (mod MOD)
 * Works for any MOD, including composite numbers
 */
/**
 * Hensel Lifting: lift a solution from mod currentMod to mod nextMod
 * Given x0 that solves Ax = b (mod currentMod), find x that solves Ax = b (mod nextMod)
 * Solution has form: x = x0 + t * currentMod, where t is to be determined
 */
function henselLift(A, b, x0, currentMod, nextMod) {
    const N = A.length;
    const prime = currentMod; // Assume nextMod = currentMod * prime (this works for prime powers)
    
    // Compute residual: r = b - Ax0 (over integers, not mod)
    const residual = Array(N);
    for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < N; j++) {
            sum += A[i][j] * x0[j];
        }
        residual[i] = b[i] - sum;
    }
    
    // The residual should be divisible by currentMod
    // We need to solve: A * t = residual / currentMod (mod prime)
    const b_lift = residual.map(r => {
        const quot = Math.floor(r / currentMod);
        return mod(quot, prime);
    });
    
    // Solve A * t = b_lift (mod prime)
    // For Hensel lifting, we use a more permissive approach - even if the system
    // appears inconsistent, we'll try brute force search
    const A_prime = A.map(row => row.map(val => mod(val, prime)));
    
    // Try to solve analytically first
    const result = solveLinearSystemModPrime(A_prime, b_lift, prime);
    
    if (result) {
        // Analytic solution worked - use it
        const t = result.solution;
        const x_lifted = x0.map((val, i) => mod(val + t[i] * currentMod, nextMod));
        
        // Verify
        let valid = true;
        for (let i = 0; i < N; i++) {
            let sum = 0;
            for (let j = 0; j < N; j++) {
                sum += A[i][j] * x_lifted[j];
            }
            if (mod(sum, nextMod) !== mod(b[i], nextMod)) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            return x_lifted;
        }
        // If verification failed, fall through to search
        console.log(`  Analytic lift solution failed verification, trying search...`);
    }
    
    // Either no analytic solution, or it didn't verify - use brute force
    console.log(`  Using brute force search for Hensel lift...`);
    
    // Strategy: Try all possible correction vectors in Z_prime^N
    // For efficiency, we'll enumerate systematically
    // The correction should be in range [0, prime-1] for each component
    
    // For N=16 and prime=2, there are 2^16 = 65536 possibilities
    // For N=16 and prime=4, there are 4^16 = too many, so we cap it
    const maxSearchAttempts = Math.min(65536, Math.pow(prime, N));
    console.log(`  Searching up to ${maxSearchAttempts} correction vectors...`);
    
    for (let attempt = 0; attempt < maxSearchAttempts; attempt++) {
        // Generate correction vector t by treating attempt as a base-prime number
        const t = Array(N).fill(0);
        let temp = attempt;
        for (let i = 0; i < N; i++) {
            t[i] = temp % prime;
            temp = Math.floor(temp / prime);
            if (temp === 0 && i < N - 1) {
                // Early termination: remaining positions stay 0
                break;
            }
        }
        
        // Compute lifted solution: x = x0 + t * currentMod
        const x_lifted = x0.map((val, i) => mod(val + t[i] * currentMod, nextMod));
        
        // Verify it works
        let valid = true;
        for (let i = 0; i < N; i++) {
            let sum = 0;
            for (let j = 0; j < N; j++) {
                sum += A[i][j] * x_lifted[j];
            }
            if (mod(sum, nextMod) !== mod(b[i], nextMod)) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            console.log(`  Found valid lift on attempt ${attempt + 1}`);
            return x_lifted;
        }
    }
    
    console.error(`  Search exhausted after ${maxSearchAttempts} attempts`);
    return null;
}

function solveLinearSystemMod(A, b, MOD) {
    // For MOD = 1, trivial solution
    if (MOD === 1) {
        return { solution: Array(A.length).fill(0), pivotCols: [] };
    }
    
    // For composite moduli with multiple distinct primes, use Chinese Remainder Theorem
    const factors = factorIntoPrimePowers(MOD);
    
    // ONLY use CRT if we have multiple DISTINCT prime factors
    // For prime powers (p^k), solve directly - CRT requires coprime moduli
    if (factors.length > 1) {
        console.log(`MOD=${MOD} factorization: ${factors.map(f => `${f.prime}^${f.power}`).join(' × ')}`);
        console.log('Using Chinese Remainder Theorem approach...');
        
        // Each prime power is coprime to the others (different primes)
        const moduli = factors.map(f => f.modulus);
        
        console.log(`Solving system using moduli: ${moduli.join(', ')}`);
        
        // Solve for each prime power modulus
        const solutions = [];
        for (const {modulus} of factors) {
            console.log(`  Solving mod ${modulus}...`);
            const A_mod = A.map(row => row.map(val => mod(val, modulus)));
            const b_mod = b.map(val => mod(val, modulus));
            const result = solveLinearSystemModPrime(A_mod, b_mod, modulus);
            if (!result) {
                console.error(`  Failed to solve mod ${modulus}`);
                return null;
            }
            solutions.push(result.solution);
            console.log(`  Success! Sample: [${result.solution.slice(0, 3).join(', ')}...]`);
        }
        
        // Combine solutions using CRT
        console.log('Combining solutions via CRT...');
        const N = A.length;
        const combined = Array(N).fill(0);
        
        for (let i = 0; i < N; i++) {
            const residues = solutions.map(sol => sol[i]);
            combined[i] = chineseRemainderTheorem(residues, moduli);
            if (combined[i] === null) {
                console.error(`CRT failed for variable ${i}`);
                return null;
            }
        }
        
        return { solution: combined, pivotCols: [] };
    }
    
    // For prime powers (including 8=2^3), use Hensel lifting for better stability
    // Hensel lifting: solve mod p, then lift to mod p^2, then p^3, etc.
    const {prime, power} = factors[0];
    console.log(`MOD=${MOD} is a prime power: ${prime}^${power}`);
    
    // For prime powers with small MOD values, just solve directly
    // Hensel lifting can fail for under-determined systems with free variables
    if (MOD <= 16 || power === 1) {
        console.log(`Solving directly mod ${MOD} (MOD is small or prime)`);
        return solveLinearSystemModPrime(A, b, MOD);
    }
    
    if (power >= 2) {
        console.log(`Using Hensel lifting: solving mod ${prime}, then lifting to mod ${MOD}...`);
        
        // Step 1: Solve mod p (the prime)
        console.log(`  Step 1: Solving mod ${prime}...`);
        const A_p = A.map(row => row.map(val => mod(val, prime)));
        const b_p = b.map(val => mod(val, prime));
        const result_p = solveLinearSystemModPrime(A_p, b_p, prime);
        if (!result_p) {
            console.error(`  Failed to solve mod ${prime}`);
            return null;
        }
        console.log(`  Success mod ${prime}! Sample: [${result_p.solution.slice(0, 3).join(', ')}...]`);
        
        // Store the base solution and info about free variables
        const baseSolution = result_p.solution;
        const freeCols = result_p.freeCols || [];
        
        // If there are free variables and lifting fails, we'll try different free variable values
        const maxFreeVarAttempts = Math.min(100, Math.pow(prime, Math.min(freeCols.length, 6)));
        
        // Step 2: Iteratively lift from p^k to p^(k+1)
        // Try different free variable assignments if lifting fails
        for (let freeAttempt = 0; freeAttempt < maxFreeVarAttempts; freeAttempt++) {
            // Adjust free variables based on attempt number
            let currentSolution = baseSolution.slice();
            if (freeAttempt > 0 && freeCols.length > 0) {
                let temp = freeAttempt;
                for (let i = 0; i < freeCols.length; i++) {
                    const col = freeCols[i];
                    const adjustment = temp % prime;
                    currentSolution[col] = mod(baseSolution[col] + adjustment, prime);
                    temp = Math.floor(temp / prime);
                }
                if (freeAttempt === 1) {
                    console.log(`  Trying different free variable values (${freeCols.length} free vars)...`);
                }
            }
            
            let currentMod = prime;
            let success = true;
            
            for (let k = 2; k <= power; k++) {
                const nextMod = Math.pow(prime, k);
                if (freeAttempt === 0) {
                    console.log(`  Step ${k}: Lifting from mod ${currentMod} to mod ${nextMod}...`);
                }
                
                // Use the current solution as a starting point and search for corrections
                const liftedSolution = henselLift(A, b, currentSolution, currentMod, nextMod);
                if (!liftedSolution) {
                    success = false;
                    break;
                }
                currentSolution = liftedSolution;
                currentMod = nextMod;
                if (freeAttempt === 0) {
                    console.log(`  Success! Sample: [${currentSolution.slice(0, 3).join(', ')}...]`);
                }
            }
            
            if (success) {
                if (freeAttempt > 0) {
                    console.log(`  Success on free variable attempt ${freeAttempt + 1}!`);
                }
                return { solution: currentSolution, pivotCols: [] };
            }
            
            // If this wasn't the first attempt, suppress error message
            if (freeAttempt === 0 && freeCols.length > 0) {
                console.log(`  Hensel lifting failed, will try different base solutions...`);
            }
        }
        
        console.error(`  All ${maxFreeVarAttempts} free variable combinations failed`);
        return null;
    }
    
    // For prime (power=1), solve directly
    return solveLinearSystemModPrime(A, b, MOD);
}

/**
 * Solve linear system for prime or prime power modulus
 * This is the original Gaussian elimination code
 */
function solveLinearSystemModPrime(A, b, MOD) {
    const N = A.length;
    
    // Create augmented matrix [A | b]
    const M = A.map((row, i) => [...row.map(val => mod(val, MOD)), mod(b[i], MOD)]);
    
    // Track which column is the pivot for each row
    const pivotColPerRow = Array(N).fill(-1);
    let currentRow = 0;
    
    console.log(`Starting Gaussian elimination: N=${N}, MOD=${MOD}`);
    
    // Gaussian elimination
    for (let col = 0; col < N; col++) {
        // Find best pivot row (prefer gcd == 1)
        let pivotRow = -1;
        let bestGcd = MOD + 1;
        
        for (let row = currentRow; row < N; row++) {
            const val = M[row][col];
            if (val === 0) continue;
            
            const g = egcd(val, MOD).g;
            
            // Prefer entries with gcd == 1
            if (g === 1) {
                pivotRow = row;
                bestGcd = 1;
                break;
            }
            
            if (g < bestGcd) {
                pivotRow = row;
                bestGcd = g;
            }
        }
        
        // No pivot found in this column - it's a free variable
        if (pivotRow === -1) {
            if (col % 10 === 0) console.log(`Column ${col}: no pivot (free variable)`);
            continue;
        }
        
        // Swap rows
        if (pivotRow !== currentRow) {
            [M[currentRow], M[pivotRow]] = [M[pivotRow], M[currentRow]];
        }
        
        const pivotValue = M[currentRow][col];
        const g = egcd(pivotValue, MOD).g;
        
        if (col % 10 === 0) console.log(`Column ${col}: pivot=${pivotValue}, gcd=${g}`);
        
        if (g === 1) {
            // Case A: Pivot is invertible
            const inv = modInv(pivotValue, MOD);
            
            // Scale pivot row
            for (let c = 0; c <= N; c++) {
                M[currentRow][c] = mod(M[currentRow][c] * inv, MOD);
            }
            
            // Eliminate this column in all other rows
            for (let row = 0; row < N; row++) {
                if (row === currentRow) continue;
                
                const factor = M[row][col];
                if (factor === 0) continue;
                
                for (let c = 0; c <= N; c++) {
                    M[row][c] = mod(M[row][c] - factor * M[currentRow][c], MOD);
                }
            }
            
            pivotColPerRow[currentRow] = col;
            currentRow++;
        } else {
            // Case B: Pivot is not invertible (gcd > 1)
            // Try to find a linear combination with better gcd
            let foundBetter = false;
            
            for (let row = currentRow + 1; row < N; row++) {
                const val2 = M[row][col];
                if (val2 === 0) continue;
                
                // Try to combine rows to get gcd == 1
                const combo = egcd(pivotValue, val2);
                if (combo.g === 1) {
                    // Combine rows: newRow = combo.x * currentRow + combo.y * row
                    const newRow = Array(N + 1).fill(0);
                    for (let c = 0; c <= N; c++) {
                        newRow[c] = mod(
                            combo.x * M[currentRow][c] + combo.y * M[row][c],
                            MOD
                        );
                    }
                    M[currentRow] = newRow;
                    foundBetter = true;
                    console.log(`  Improved pivot via row combination`);
                    break;
                }
            }
            
            if (foundBetter) {
                // Retry this column with the improved pivot
                col--;
                continue;
            } else {
                // Cannot improve this pivot
                // For composite moduli, we need to handle this more carefully
                // Let's try a different approach: use the pivot as-is and do partial elimination
                console.log(`  Warning: keeping non-invertible pivot with gcd=${g} at col=${col}`);
                
                // We can still eliminate in rows where it makes sense
                // For rows where M[row][col] is a multiple of pivotValue, we can eliminate
                for (let row = 0; row < N; row++) {
                    if (row === currentRow) continue;
                    
                    const factor = M[row][col];
                    if (factor === 0) continue;
                    
                    // Try to eliminate using integer arithmetic
                    // We want to find multipliers u, v such that u*factor = v*pivotValue
                    // This way u * row[row] - v * row[currentRow] eliminates column col
                    
                    const gRow = egcd(factor, MOD).g;
                    const gPivot = egcd(pivotValue, MOD).g;
                    const gBoth = egcd(factor, pivotValue).g;
                    
                    if (gBoth > 1) {
                        // We can reduce both by their gcd
                        const u = Math.floor(pivotValue / gBoth);
                        const v = Math.floor(factor / gBoth);
                        
                        for (let c = 0; c <= N; c++) {
                            M[row][c] = mod(M[row][c] * u - M[currentRow][c] * v, MOD);
                        }
                    }
                }
                
                pivotColPerRow[currentRow] = col;
                currentRow++;
            }
        }
    }
    
    console.log(`Elimination complete. Filled ${currentRow} rows out of ${N}.`);
    
    // Debug: show which columns got pivots
    const pivotedCols = pivotColPerRow.filter(c => c !== -1);
    const freeCols = [];
    for (let c = 0; c < N; c++) {
        if (!pivotedCols.includes(c)) freeCols.push(c);
    }
    if (freeCols.length > 0) {
        console.log(`Free variables (no pivot): columns ${freeCols.join(', ')}`);
        console.log(`Will try to find values for free variables...`);
    }
    
    // Check for inconsistency - but be more careful with non-invertible pivots
    for (let row = 0; row < N; row++) {
        let allZero = true;
        for (let col = 0; col < N; col++) {
            if (M[row][col] !== 0) {
                allZero = false;
                break;
            }
        }
        
        if (allZero && M[row][N] !== 0) {
            // Row is [0 0 0 ... | non-zero] - but check if it's really inconsistent
            // For composite moduli, we need to check if the RHS is divisible by MOD's factors
            const rhsValue = M[row][N];
            console.error(`Potential inconsistency at row ${row}: [0...0 | ${rhsValue}]`);
            
            // If RHS is not a multiple of MOD, it's truly inconsistent
            // But if it is, it might just be a redundant constraint
            if (rhsValue % MOD !== 0) {
                console.error(`  -> Truly inconsistent: ${rhsValue} % ${MOD} = ${rhsValue % MOD}`);
                return null;
            } else {
                console.log(`  -> Actually consistent (${rhsValue} ≡ 0 mod ${MOD}), treating as satisfied`);
            }
        }
    }
    
    // Identify columns with non-invertible pivots (these have multiple solutions)
    const ambiguousCols = [];
    for (let row = 0; row < N; row++) {
        const pivotCol = pivotColPerRow[row];
        if (pivotCol === -1) continue;
        const pivotValue = M[row][pivotCol];
        if (pivotValue !== 1 && pivotValue !== 0) {
            const g = egcd(pivotValue, MOD).g;
            if (g > 1) {
                // This equation has g different solutions
                const m_reduced = Math.floor(MOD / g);
                ambiguousCols.push({col: pivotCol, row: row, gcd: g, step: m_reduced, pivot: pivotValue});
            }
        }
    }
    
    // Build INITIAL solution (pick one arbitrary solution for each ambiguous pivot)
    const x = Array(N).fill(0);
    
    for (let row = 0; row < N; row++) {
        const pivotCol = pivotColPerRow[row];
        if (pivotCol === -1) continue;
        
        const pivotValue = M[row][pivotCol];
        const rhsValue = M[row][N];
        
        if (pivotValue === 1) {
            // Normalized pivot
            x[pivotCol] = rhsValue;
        } else if (pivotValue !== 0) {
            // Non-normalized pivot - need to solve pivotValue * x ≡ rhsValue (mod MOD)
            const g = egcd(pivotValue, MOD).g;
            
            // Check if this congruence is solvable
            if (rhsValue % g !== 0) {
                console.error(`Row ${row}: ${pivotValue} * x ≡ ${rhsValue} (mod ${MOD}) not solvable (gcd=${g})`);
                return null; // Not solvable
            }
            
            // The congruence is solvable
            // Reduce to simpler form: (pivotValue/g) * x ≡ (rhsValue/g) (mod MOD/g)
            const a_reduced = Math.floor(pivotValue / g);
            const b_reduced = Math.floor(rhsValue / g);
            const m_reduced = Math.floor(MOD / g);
            
            // Now solve in the reduced system
            const inv = modInv(a_reduced, m_reduced);
            if (inv !== null) {
                const x_reduced = mod(b_reduced * inv, m_reduced);
                // This is ONE solution; there are g-1 others (x_reduced + k*m_reduced for k=1..g-1)
                x[pivotCol] = x_reduced;
                console.log(`Row ${row}: non-inv pivot ${pivotValue}, base solution=${x_reduced} (has ${g} total solutions)`);
            } else {
                // This shouldn't happen if we reduced correctly
                console.warn(`Row ${row}: couldn't solve even after reduction`);
                x[pivotCol] = 0;
            }
        }
    }
    
    // Verify the solution by computing A * x mod MOD
    console.log('Verifying solution against linear system...');
    let systemValid = true;
    const failedEquations = [];
    for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < N; j++) {
            sum += A[i][j] * x[j];
        }
        sum = mod(sum, MOD);
        if (sum !== b[i]) {
            failedEquations.push(i);
            systemValid = false;
            if (i < 5) { // Only show first few failures
                console.error(`  Equation ${i} failed: A*x = ${sum}, b = ${b[i]}`);
            }
        }
    }
    
    if (!systemValid && (freeCols.length > 0 || ambiguousCols.length > 0)) {
        // Try adjusting free variables AND ambiguous pivot values to fix the solution
        console.log(`Initial solution failed ${failedEquations.length} equations. Trying to adjust variables...`);
        if (ambiguousCols.length > 0) {
            console.log(`  Ambiguous pivots (non-invertible) in columns: ${ambiguousCols.map(p => p.col).join(', ')}`);
        }
        
        // Combine free variables and ambiguous variables for search
        const searchCols = [...freeCols, ...ambiguousCols.map(a => a.col)];
        
        // Calculate required attempts: MOD^(free vars) * product of gcd values
        let requiredAttempts = Math.pow(MOD, freeCols.length);
        for (const amb of ambiguousCols) {
            requiredAttempts *= amb.gcd;
        }
        const maxAttempts = Math.min(100000, requiredAttempts);
        
        console.log(`  Searching ${maxAttempts} combinations (${freeCols.length} free vars, ${ambiguousCols.length} ambiguous pivots)...`);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Set free variables based on attempt number
            const freeValues = Array(freeCols.length).fill(0);
            let temp = attempt;
            for (let i = 0; i < freeCols.length; i++) {
                freeValues[i] = temp % MOD;
                temp = Math.floor(temp / MOD);
            }
            
            // Also try different values for ambiguous pivots
            const ambiguousOffsets = Array(ambiguousCols.length).fill(0);
            for (let i = 0; i < ambiguousCols.length; i++) {
                const {gcd, step} = ambiguousCols[i];
                ambiguousOffsets[i] = (temp % gcd) * step;
                temp = Math.floor(temp / gcd);
            }
            
            // Apply free variable values
            for (let i = 0; i < freeCols.length; i++) {
                x[freeCols[i]] = freeValues[i];
            }
            
            // Recompute ALL dependent variables
            for (let row = 0; row < N; row++) {
                const pivotCol = pivotColPerRow[row];
                if (pivotCol === -1 || freeCols.includes(pivotCol)) continue;
                
                // Recompute x[pivotCol] based on current free variable values
                let sum = M[row][N]; // RHS
                for (let col = 0; col < N; col++) {
                    if (col === pivotCol) continue;
                    sum -= M[row][col] * x[col];
                }
                sum = mod(sum, MOD);
                
                const pivotValue = M[row][pivotCol];
                if (pivotValue === 1) {
                    x[pivotCol] = sum;
                } else if (pivotValue !== 0) {
                    const g = egcd(pivotValue, MOD).g;
                    if (sum % g === 0) {
                        const a_reduced = Math.floor(pivotValue / g);
                        const b_reduced = Math.floor(sum / g);
                        const m_reduced = Math.floor(MOD / g);
                        const inv = modInv(a_reduced, m_reduced);
                        if (inv !== null) {
                            let baseValue = mod(b_reduced * inv, m_reduced);
                            // If this is an ambiguous column, add offset
                            const ambigIdx = ambiguousCols.findIndex(a => a.col === pivotCol);
                            if (ambigIdx !== -1) {
                                baseValue = mod(baseValue + ambiguousOffsets[ambigIdx], MOD);
                            }
                            x[pivotCol] = baseValue;
                        }
                    }
                }
            }
            
            // Check if this works
            let allGood = true;
            for (let i = 0; i < N; i++) {
                let sum = 0;
                for (let j = 0; j < N; j++) {
                    sum += A[i][j] * x[j];
                }
                if (mod(sum, MOD) !== b[i]) {
                    allGood = false;
                    break;
                }
            }
            
            if (allGood) {
                console.log(`  Found working solution on attempt ${attempt + 1}!`);
                systemValid = true;
                break;
            }
        }
    }
    
    if (!systemValid) {
        console.error('Solution does not satisfy the linear system!');
        return null;
    }
    
    console.log('Solution satisfies all equations ✓');
    
    // freeCols is already computed earlier in the function
    return { solution: x, pivotCols: pivotColPerRow, freeCols: freeCols };
}  // End of solveLinearSystemModPrime

/**
 * Apply a solution vector to a board and return the resulting board
 */
function applySolutionToBoard(board, solution, width, height, MOD) {
    // Deep copy the board
    const result = board.map(row => [...row]);
    
    // Helper to convert flat index to (x, y)
    const toXY = (idx) => {
        const x = idx % width;
        const y = Math.floor(idx / width);
        return { x, y };
    };
    
    // Apply each click
    solution.forEach((clicks, idx) => {
        const { x: clickX, y: clickY } = toXY(idx);
        
        for (let i = 0; i < clicks; i++) {
            flipPattern.forEach(({ dx, dy }) => {
                const affectedX = clickX + dx;
                const affectedY = clickY + dy;
                
                if (affectedX >= 0 && affectedX < width &&
                    affectedY >= 0 && affectedY < height) {
                    result[affectedX][affectedY] = mod(result[affectedX][affectedY] + 1, MOD);
                }
            });
        }
    });
    
    return result;
}

/**
 * Verify that a solution is correct
 */
function verifySolution(board, solution, width, height, MOD, targetColor) {
    const resultBoard = applySolutionToBoard(board, solution, width, height, MOD);
    
    // Check if all cells equal targetColor
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (resultBoard[x][y] !== targetColor) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * High-level function to solve a TATLO board
 * Returns solution vector or null if no solution exists
 */
function solveTatloBoard(board, width, height, MOD, targetColor) {
    // Build the system
    const A = buildMoveMatrix(width, height, MOD);
    const stateVector = flattenBoard(board, width, height);
    const b = buildRightHandSide(stateVector, MOD, targetColor);
    
    // Debug logging for troubleshooting
    console.log('Solving:', { width, height, MOD, targetColor });
    console.log('State vector sample:', stateVector.slice(0, 5));
    console.log('Target vector sample:', b.slice(0, 5));
    
    // Solve
    const result = solveLinearSystemMod(A, b, MOD);
    if (!result) {
        console.error('solveLinearSystemMod returned null - system is inconsistent');
        return null;
    }
    
    const { solution } = result;
    console.log('Solution found, sample:', solution.slice(0, 5));
    
    // Verify the solution
    const isValid = verifySolution(board, solution, width, height, MOD, targetColor);
    console.log('Verification result:', isValid);
    
    if (!isValid) {
        console.error('Solution verification failed!');
        // Let's see what the solution produces
        const resultBoard = applySolutionToBoard(board, solution, width, height, MOD);
        console.log('Result board sample:', resultBoard[0].slice(0, 5));
        return null;
    }
    
    return solution;
}

// ============================================================================
// GAME INTEGRATION - Main Solver Function
// ============================================================================

/**
 * Main solve function called by the game
 * Returns array of click steps or throws error
 */
async function solvePuzzle() {
    const n = SIZE_X * SIZE_Y;
    
    // Warn for very large grids
    if (n > 900) {
        const proceed = await showSolverConfirm(`${SIZE_X}×${SIZE_Y}`, n);
        if (!proceed) throw new Error('Solver cancelled by user');
    }
    
    // Show progress indicator for large grids
    const showProgress = n > 400;
    if (showProgress) {
        createProgressIndicator();
        updateProgress(0, 100);
    }
    
    try {
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (showProgress) updateProgress(30, 100);
        
        // Solve for target color 0
        const solution = solveTatloBoard(matrix, SIZE_X, SIZE_Y, COLORS, 0);
        
        if (showProgress) updateProgress(70, 100);
        
        if (!solution) {
            throw new Error('No solution found for this configuration');
        }
        
        // Convert solution vector to sequence of clicks
        const clicks = [];
        solution.forEach((numClicks, idx) => {
            if (numClicks > 0) {
                const x = idx % SIZE_X;
                const y = Math.floor(idx / SIZE_X);
                for (let i = 0; i < numClicks; i++) {
                    clicks.push({ x, y });
                }
            }
        });
        
        if (showProgress) updateProgress(100, 100);
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return clicks;
        
    } finally {
        if (showProgress) {
            removeProgressIndicator();
        }
    }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function showSolverConfirm(gridSize, cellCount) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #2a2a2a;
            border: 2px solid #4a7c59;
            border-radius: 10px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        dialog.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 15px;">⚠️</div>
            <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 22px;">Large Grid Warning</h2>
            <p style="color: #b0b0b0; margin: 0 0 20px 0; line-height: 1.5;">
                This ${gridSize} grid has ${cellCount} cells and may take a while to solve.
                <br><br>
                <strong style="color: #ffaa00;">Estimated time: ${getEstimatedTime(cellCount)}</strong>
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="solver-cancel" style="
                    padding: 10px 25px;
                    font-size: 16px;
                    background: #555;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Cancel</button>
                <button id="solver-continue" style="
                    padding: 10px 25px;
                    font-size: 16px;
                    background: #4a7c59;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Continue</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        document.getElementById('solver-cancel').onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
        
        document.getElementById('solver-continue').onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
    });
}

// Helper: Get estimated time for solving
function getEstimatedTime(cellCount) {
    if (cellCount <= 400) return '1-5 seconds';
    if (cellCount <= 900) return '5-15 seconds';
    if (cellCount <= 1600) return '30-60 seconds';
    return '1-5 minutes';
}

// Helper: Show progress indicator
function createProgressIndicator() {
    const overlay = document.createElement('div');
    overlay.id = 'solver-progress';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #2a2a2a;
        border: 2px solid #4a7c59;
        border-radius: 10px;
        padding: 30px 40px;
        text-align: center;
        min-width: 300px;
    `;
    
    content.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 15px;">🧮</div>
        <h2 style="color: #ffffff; margin: 0 0 15px 0;">Calculating Solution...</h2>
        <div style="color: #b0b0b0; margin-bottom: 20px;">
            <div id="solver-progress-text">Processing row 0 of ${SIZE_X * SIZE_Y}</div>
        </div>
        <div style="background: #1a1a1a; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 10px;">
            <div id="solver-progress-bar" style="
                background: linear-gradient(90deg, #4a7c59, #6ab389);
                height: 100%;
                width: 0%;
                transition: width 0.3s;
            "></div>
        </div>
        <div id="solver-progress-percent" style="color: #4a7c59; font-size: 18px; font-weight: bold;">0%</div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    return overlay;
}

// Helper: Update progress indicator
function updateProgress(current, total) {
    const textEl = document.getElementById('solver-progress-text');
    const barEl = document.getElementById('solver-progress-bar');
    const percentEl = document.getElementById('solver-progress-percent');
    
    if (textEl && barEl && percentEl) {
        const percent = Math.round((current / total) * 100);
        textEl.textContent = `Processing row ${current} of ${total}`;
        barEl.style.width = `${percent}%`;
        percentEl.textContent = `${percent}%`;
    }
}

// Helper: Remove progress indicator
function removeProgressIndicator() {
    const overlay = document.getElementById('solver-progress');
    if (overlay) {
        document.body.removeChild(overlay);
    }
}

// Start the solver mode
async function startSolver() {
    if (gameWon) return;
    
    solverActive = true;
    autoSolveCompleted = false;
    currentStep = 0;
    
    // Stop timer and reset (don't save)
    stopTimer();
    resetTimerAndMoves();
    
    // Calculate solution (async now)
    try {
        solutionSteps = await solvePuzzle();
        
        if (solutionSteps.length === 0) {
            // Check if puzzle is already solved
            let allZero = true;
            for (let x = 0; x < SIZE_X && allZero; x++) {
                for (let y = 0; y < SIZE_Y && allZero; y++) {
                    if (matrix[x][y] !== 0) allZero = false;
                }
            }
            
            if (allZero) {
                alert('Already solved!');
            } else {
                alert('Solution verification failed!\n\n' +
                      'The computed solution did not solve the puzzle.\n' +
                      'This is unexpected - please report this as a bug with your grid size and color count.');
            }
            stopSolver();
            return;
        }
        
        // Show first hint
        showNextHint();
        
    } catch (error) {
        // Remove progress indicator if still showing
        removeProgressIndicator();
        
        console.error('Solver error:', error);
        console.error('Error stack:', error.stack);
        if (error.message === 'Solver cancelled by user') {
            stopSolver();
            return;
        }
        alert('Could not find a solution. Error: ' + error.message + '\n\nCheck console (F12) for details.');
        stopSolver();
    }
}

// Stop the solver mode
function stopSolver() {
    solverActive = false;
    solutionSteps = [];
    currentStep = 0;
    // Don't reset autoSolveCompleted here - let it persist for victory modal
    stopAutoClick();
    hideHint();
}

// Show hint for the next move
function showNextHint() {
    if (!solverActive || currentStep >= solutionSteps.length) {
        stopSolver();
        return;
    }
    
    const nextMove = solutionSteps[currentStep];
    displayHint(nextMove.x, nextMove.y);
}

// Display a green cross overlay on the canvas
function displayHint(x, y) {
    hideHint();
    
    hintOverlay = { x, y };
}

// Hide the hint overlay
function hideHint() {
    hintOverlay = null;
}

// Draw the hint overlay on the canvas
function drawHint() {
    if (!hintOverlay) return;
    
    const { x, y } = hintOverlay;
    const centerX = x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = y * CELL_SIZE + CELL_SIZE / 2;
    const crossSize = CELL_SIZE * 0.4;
    const lineWidth = Math.max(3, CELL_SIZE / 15);
    
    // Draw green cross
    context.strokeStyle = 'rgba(0, 255, 0, 0.9)';
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    
    // Horizontal line
    context.beginPath();
    context.moveTo(centerX - crossSize, centerY);
    context.lineTo(centerX + crossSize, centerY);
    context.stroke();
    
    // Vertical line
    context.beginPath();
    context.moveTo(centerX, centerY - crossSize);
    context.lineTo(centerX, centerY + crossSize);
    context.stroke();
    
    // Draw outline for better visibility
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.lineWidth = lineWidth + 2;
    
    context.beginPath();
    context.moveTo(centerX - crossSize, centerY);
    context.lineTo(centerX + crossSize, centerY);
    context.stroke();
    
    context.beginPath();
    context.moveTo(centerX, centerY - crossSize);
    context.lineTo(centerX, centerY + crossSize);
    context.stroke();
}

// Process click when in solver mode
function handleSolverClick(x, y) {
    if (!solverActive) return false;
    
    const expectedMove = solutionSteps[currentStep];
    
    if (x === expectedMove.x && y === expectedMove.y) {
        // Correct move
        currentStep++;
        hideHint();
        
        // If this is the last step, mark as auto-solve completion
        if (currentStep >= solutionSteps.length) {
            autoSolveCompleted = true;
            console.log('Setting autoSolveCompleted to true'); // Debug
        }
        
        // Check if puzzle is solved
        setTimeout(() => {
            if (checkWin()) {
                console.log('Puzzle solved via auto-solver'); // Debug
                stopSolver();
            } else if (currentStep < solutionSteps.length) {
                showNextHint();
            } else {
                stopSolver();
            }
        }, 100);
        
        return true;
    }
    
    return false;
}

// Start auto-clicking
function startAutoClick() {
    if (!solverActive || autoClickActive) return;
    
    autoClickActive = true;
    
    // Speed scales linearly with grid size and colors
    // Baseline: 7×5 grid (35 cells), 2 colors = 5 clicks/sec (200ms)
    // Formula: speed increases with more cells and more colors
    
    const baseGridSize = 35; // 7×5
    const baseColors = 2;
    const baseSpeed = 5; // clicks per second
    
    const currentGridSize = SIZE_X * SIZE_Y;
    const gridFactor = currentGridSize / baseGridSize; // 1.0 for 7×5, 2.0 for 10×7, etc.
    const colorFactor = COLORS / baseColors; // 1.0 for 2 colors, 2.0 for 4 colors, etc.
    
    // Combined scaling: multiply factors together
    // Larger grid + more colors = faster speed
    const speedMultiplier = gridFactor * colorFactor;
    const clicksPerSecond = baseSpeed * speedMultiplier;
    
    // Clamp between 5 and 30 clicks/sec for reasonable viewing
    const clampedSpeed = Math.max(5, Math.min(30, clicksPerSecond));
    const clickInterval = Math.round(1000 / clampedSpeed);
    
    console.log(`Auto-click speed: ${clampedSpeed.toFixed(1)} clicks/sec (${clickInterval}ms interval)`);
    
    autoClickInterval = setInterval(() => {
        if (!solverActive || currentStep >= solutionSteps.length) {
            stopAutoClick();
            return;
        }
        
        const nextMove = solutionSteps[currentStep];
        
        // Simulate a click at the next position
        const clickEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        // Calculate the pixel position on canvas
        const rect = canvas.getBoundingClientRect();
        const pixelX = nextMove.x * CELL_SIZE + CELL_SIZE / 2;
        const pixelY = nextMove.y * CELL_SIZE + CELL_SIZE / 2;
        
        // Create a synthetic click at the correct position
        Object.defineProperty(clickEvent, 'clientX', { value: rect.left + pixelX / (canvas.width / rect.width) });
        Object.defineProperty(clickEvent, 'clientY', { value: rect.top + pixelY / (canvas.height / rect.height) });
        
        canvas.dispatchEvent(clickEvent);
    }, clickInterval);
}

// Stop auto-clicking
function stopAutoClick() {
    autoClickActive = false;
    if (autoClickInterval) {
        clearInterval(autoClickInterval);
        autoClickInterval = null;
    }
}

// Toggle auto-click
function toggleAutoClick() {
    if (autoClickActive) {
        stopAutoClick();
    } else {
        startAutoClick();
    }
}

// ============================================================================
// TESTING HARNESS
// ============================================================================

/**
 * Test the solver with random boards
 * Can be called from browser console: testSolver()
 */
function testSolver() {
    console.log('=== TATLO Solver Test Suite ===\n');
    
    const configs = [
        { width: 3, height: 3, colors: 2 },
        { width: 3, height: 3, colors: 3 },
        { width: 3, height: 3, colors: 4 },
        { width: 4, height: 4, colors: 6 },
        { width: 5, height: 5, colors: 12 },
        { width: 4, height: 4, colors: 8 },
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    configs.forEach(({ width, height, colors }) => {
        console.log(`Testing ${width}x${height} grid with ${colors} colors:`);
        
        for (let test = 0; test < 5; test++) {
            totalTests++;
            
            // Create uniform board
            const board = Array.from({ length: width }, () => Array(height).fill(0));
            
            // Generate random solution
            const N = width * height;
            const randomSolution = Array.from({ length: N }, () => Math.floor(Math.random() * colors));
            
            // Apply random solution to create scrambled board
            const scrambled = applySolutionToBoard(board, randomSolution, width, height, colors);
            
            // Solve the scrambled board
            const solution = solveTatloBoard(scrambled, width, height, colors, 0);
            
            if (solution && verifySolution(scrambled, solution, width, height, colors, 0)) {
                passedTests++;
                console.log(`  Test ${test + 1}: ✓ PASS`);
            } else {
                console.log(`  Test ${test + 1}: ✗ FAIL`);
                console.log('    Random solution:', randomSolution);
                console.log('    Found solution:', solution);
            }
        }
        console.log('');
    });
    
    console.log(`=== Test Results: ${passedTests}/${totalTests} passed ===`);
    return { totalTests, passedTests };
}

// Export for console testing
if (typeof window !== 'undefined') {
    window.testSolver = testSolver;
    console.log('TATLO Solver loaded. Run testSolver() to test the solver.');
}
