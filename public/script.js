const socket = io();

let roomCode;

// Show the start page
document.getElementById('start-page').classList.remove('hidden');

// Generate a unique code
document.getElementById('generate-code').addEventListener('click', () => {
    socket.emit('generateCode');
    document.getElementById('start-page').classList.add('hidden');
    document.getElementById('waiting-page').classList.remove('hidden');
});

// Receive the generated code
socket.on('codeGenerated', (code) => {
    roomCode = code;
    document.getElementById('room-code').textContent = code;
});

// Enter a code manually
document.getElementById('enter-code').addEventListener('click', () => {
    const enteredCode = prompt('Enter the code:');
    if (enteredCode) {
        socket.emit('joinRoom', enteredCode);
    }
});

// Handle invalid code
socket.on('invalidCode', () => {
    alert('Invalid code. Please try again.');
});

// Start the chat
socket.on('chatStarted', () => {
    document.getElementById('waiting-page').classList.add('hidden');
    document.getElementById('chat-page').classList.remove('hidden');
});

// Send a message
document.getElementById('send-message').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('sendMessage', { roomCode, message });
        addMessage('You', message);
        messageInput.value = '';
    }
});

// Receive a message
socket.on('receiveMessage', (message) => {
    addMessage('Other', message);
});

// Add a message to the chat UI
function addMessage(sender, message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// End the chat
document.getElementById('end-chat').addEventListener('click', () => {
    socket.emit('endChat', roomCode);
    alert('Chat ended.');
    location.reload(); // Reload the page
});

// Handle chat ended by the other user
socket.on('chatEnded', () => {
    alert('The other user ended the chat.');
    location.reload(); // Reload the page
});
