const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store active rooms and their participants
const activeRooms = {};

// Generate a unique room code based on timestamp and random string
function generateUniqueCode() {
    const timestamp = Date.now().toString(36); // Convert current time to base36
    const randomString = crypto.randomBytes(4).toString('hex'); // Random 4-byte hex string
    return `${timestamp}-${randomString}`; // Combine timestamp and random string
}

// Serve static files (frontend)
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Step 1: Generate a unique room code
    socket.on('generateCode', () => {
        const roomCode = generateUniqueCode();
        activeRooms[roomCode] = { host: socket.id, guest: null }; // Initialize room
        socket.join(roomCode); // Join the room
        socket.emit('codeGenerated', roomCode); // Send the code to the client
    });

    // Step 2: Join an existing room
    socket.on('joinRoom', (roomCode) => {
        if (activeRooms[roomCode] && !activeRooms[roomCode].guest) {
            socket.join(roomCode); // Join the room
            activeRooms[roomCode].guest = socket.id; // Assign guest to the room
            io.to(activeRooms[roomCode].host).emit('userJoined'); // Notify host
            io.to(roomCode).emit('chatStarted'); // Notify both users
        } else {
            socket.emit('invalidCode'); // Notify client of invalid code
        }
    });

    // Step 3: Send a message
    socket.on('sendMessage', ({ roomCode, message }) => {
        io.to(roomCode).emit('receiveMessage', message); // Broadcast message to both users
    });

    // Step 4: End the chat
    socket.on('endChat', (roomCode) => {
        io.to(roomCode).emit('chatEnded'); // Notify both users
        delete activeRooms[roomCode]; // Remove the room
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        for (const [roomCode, room] of Object.entries(activeRooms)) {
            if (room.host === socket.id || room.guest === socket.id) {
                io.to(roomCode).emit('chatEnded'); // Notify other user
                delete activeRooms[roomCode]; // Remove the room
            }
        }
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
