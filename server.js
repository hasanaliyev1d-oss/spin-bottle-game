const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    console.log('Bir oyunçu qoşuldu:', socket.id);

    socket.on('join_room', (data) => {
        const { roomId, user } = data;
        socket.join(roomId);
        
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push({ id: socket.id, ...user });

        io.to(roomId).emit('update_players', rooms[roomId]);
    });

    socket.on('spin_bottle', (data) => {
        io.to(data.roomId).emit('bottle_spinning', data.angle);
    });

    socket.on('send_gift', (data) => {
        io.to(data.roomId).emit('receive_gift', data);
    });

    socket.on('send_message', (data) => {
        io.to(data.roomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(p => p.id !== socket.id);
            io.to(roomId).emit('update_players', rooms[roomId]);
        }
        console.log('Oyunçu ayrıldı:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server işləyir: port ${PORT}`);
});
