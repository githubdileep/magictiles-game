// Improved game.js

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

let score = 0;

function tileClick(tile) {
    // Check if the tile is valid to click
    if (tile.isValid) {
        score += 10; // Increment score
        playSound(440); // Play sound for valid click
    } else {
        score -= 5; // Decrement score for invalid click
        playSound(220); // Play sound for invalid click
    }
    updateScoreDisplay(); // Update the score display in the UI
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

// Adding event listeners for tile clicks
const tiles = document.querySelectorAll('.tile');
tiles.forEach(tile => {
    tile.addEventListener('click', () => tileClick(tile.dataset));
});

// Initialize game state and score
resetGame();

function resetGame() {
    score = 0;
    updateScoreDisplay();
    // Additional game initialization logic
}