const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Game state
let deck = Array.from({ length: 13 }, (_, i) => i + 1);
let player1Score = 0;
let player2Score = 0;
let turn = 1; // Player 1 starts

function shuffleDeck() {
    // Simple Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function resetGame() {
    deck = Array.from({ length: 13 }, (_, i) => i + 1);
    player1Score = 0;
    player2Score = 0;
    turn = 1;
    shuffleDeck();
}

// Initial shuffle
shuffleDeck();

io.on('connection', (socket) => {
    console.log('A player connected');

    // Send initial game state
    socket.emit('updateGameState', {
        player1Score,
        player2Score,
        turn,
        remainingCards: deck.length
    });

    socket.on('disconnect', () => {
        console.log('A player disconnected');
    });

    // Handle drawing card
    socket.on('drawCard', () => {
        if (deck.length === 0) {
            io.emit('gameOver', getWinnerMessage());
            return;
        }

        const cardValue = deck.pop();
        if (turn === 1) {
            player1Score += cardValue;
            turn = 2;
        } else {
            player2Score += cardValue;
            turn = 1;
        }

        io.emit('updateGameState', {
            cardValue,
            player1Score,
            player2Score,
            turn,
            remainingCards: deck.length
        });

        if (deck.length === 0) {
            io.emit('gameOver', getWinnerMessage());
            resetGame(); // Reset the game after it's over
        }
    });
});

function getWinnerMessage() {
    if (player1Score > player2Score) {
        return 'Player 1 Wins!';
    } else if (player2Score > player1Score) {
        return 'Player 2 Wins!';
    } else {
        return "It's a Draw!";
    }
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
