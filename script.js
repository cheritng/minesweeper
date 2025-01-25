class FindOscar {
    constructor() {
        this.gridSize = 10;
        this.numBombs = 8;
        this.numCats = 5; // Reduced number of cats since we now have bombs too
        this.grid = [];
        this.gameOver = false;
        this.catsFound = 0;
        this.isFirstClick = true;

        this.initializeGame();
        this.setupEventListeners();
        this.createModal();
    }

    createModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('game-modal')) {
            const modal = document.createElement('div');
            modal.id = 'game-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2 id="modal-title"></h2>
                    <p id="modal-message"></p>
                    <button id="modal-button" class="modal-button">OK</button>
                </div>
            `;
            document.body.appendChild(modal);

            // Close modal on button click
            document.getElementById('modal-button').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    showModal(title, message, isSuccess) {
        const modal = document.getElementById('game-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalButton = document.getElementById('modal-button');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Add success/failure class for different styling
        modal.className = 'modal ' + (isSuccess ? 'success' : 'failure');
        modalButton.className = 'modal-button ' + (isSuccess ? 'success' : 'failure');
        
        modal.style.display = 'flex';
    }

    initializeGame() {
        this.gameOver = false;
        this.catsFound = 0;
        this.isFirstClick = true;
        this.grid = [];
        
        // Create empty grid
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = {
                    isCat: false,
                    isBomb: false,
                    revealed: false,
                    neighborBombs: 0,
                    neighborCats: 0
                };
            }
        }

        // Place bombs randomly
        let bombsPlaced = 0;
        while (bombsPlaced < this.numBombs) {
            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);
            
            if (!this.grid[row][col].isBomb && !this.grid[row][col].isCat) {
                this.grid[row][col].isBomb = true;
                bombsPlaced++;
            }
        }

        // Place cats randomly
        let catsPlaced = 0;
        while (catsPlaced < this.numCats) {
            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);
            
            if (!this.grid[row][col].isBomb && !this.grid[row][col].isCat) {
                this.grid[row][col].isCat = true;
                catsPlaced++;
            }
        }

        // Calculate neighbor counts
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.grid[i][j].isBomb && !this.grid[i][j].isCat) {
                    this.grid[i][j].neighborBombs = this.countNeighbors(i, j, 'isBomb');
                    this.grid[i][j].neighborCats = this.countNeighbors(i, j, 'isCat');
                }
            }
        }

        this.updateDisplay();
        document.getElementById('cats-count').textContent = this.numCats - this.catsFound;
    }

    countNeighbors(row, col, type) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize &&
                    this.grid[newRow][newCol][type]) {
                    count++;
                }
            }
        }
        return count;
    }

    updateDisplay() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                if (this.grid[i][j].revealed) {
                    cell.classList.add('revealed');
                    if (this.grid[i][j].isBomb) {
                        cell.innerHTML = '💣';
                        cell.classList.add('bomb');
                    } else if (this.grid[i][j].isCat) {
                        cell.innerHTML = '🐱';
                        cell.classList.add('cat');
                    } else {
                        // Only show bomb neighbors, not cat neighbors
                        const bombCount = this.grid[i][j].neighborBombs;
                        if (bombCount > 0) {
                            cell.textContent = bombCount;
                            cell.dataset.number = bombCount;
                        }
                    }
                }

                gridElement.appendChild(cell);
            }
        }
    }

    revealCell(row, col) {
        if (this.gameOver || this.grid[row][col].revealed) return;

        // First click safety - ensure first click is never a bomb
        if (this.isFirstClick && this.grid[row][col].isBomb) {
            this.relocateBomb(row, col);
        }
        this.isFirstClick = false;

        this.grid[row][col].revealed = true;

        if (this.grid[row][col].isBomb) {
            this.gameOver = true;
            this.revealAllBombs();
            this.showModal(
                'Game Over!',
                'Oh no! You hit a bomb! Oscar ran away... Try again!',
                false
            );
        } else if (this.grid[row][col].isCat) {
            this.catsFound++;
            document.getElementById('cats-count').textContent = this.numCats - this.catsFound;
            
            if (this.catsFound === this.numCats) {
                this.gameOver = true;
                this.showModal(
                    'Congratulations!',
                    'You found all the cats! Oscar is very happy! 🎉',
                    true
                );
            }
        } else if (this.grid[row][col].neighborBombs === 0 && this.grid[row][col].neighborCats === 0) {
            // Reveal neighboring cells if no adjacent bombs or cats
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.gridSize && 
                        newCol >= 0 && newCol < this.gridSize && 
                        !this.grid[newRow][newCol].revealed) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }

        this.updateDisplay();
    }

    relocateBomb(row, col) {
        // Find a new spot for the bomb
        let newRow, newCol;
        do {
            newRow = Math.floor(Math.random() * this.gridSize);
            newCol = Math.floor(Math.random() * this.gridSize);
        } while (this.grid[newRow][newCol].isBomb || this.grid[newRow][newCol].isCat ||
                (newRow === row && newCol === col));

        // Move the bomb
        this.grid[row][col].isBomb = false;
        this.grid[newRow][newCol].isBomb = true;

        // Recalculate neighbor counts
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.grid[i][j].isBomb && !this.grid[i][j].isCat) {
                    this.grid[i][j].neighborBombs = this.countNeighbors(i, j, 'isBomb');
                }
            }
        }
    }

    revealAllBombs() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j].isBomb) {
                    this.grid[i][j].revealed = true;
                }
            }
        }
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.revealCell(row, col);
            }
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.initializeGame();
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FindOscar();
}); 