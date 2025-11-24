const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Liste des joueurs connectés
let players = {};

io.on('connection', (socket) => {
  console.log('Un joueur est connecté : ' + socket.id);

  // Créer un nouveau joueur avec une couleur aléatoire
  players[socket.id] = {
    x: 0,
    z: 0,
    rotation: 0,
    color: Math.random() * 0xffffff
  };

  // Envoyer la liste actuelle des joueurs au nouveau venu
  socket.emit('currentPlayers', players);

  // Avertir les autres qu'un nouveau joueur est là
  socket.broadcast.emit('newPlayer', { 
    id: socket.id, 
    player: players[socket.id] 
  });

  // Quand un joueur bouge
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
        players[socket.id].x = movementData.x;
        players[socket.id].z = movementData.z;
        players[socket.id].rotation = movementData.rotation;
        // Relayer l'info aux autres
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x: players[socket.id].x,
            z: players[socket.id].z,
            rotation: players[socket.id].rotation
        });
    }
  });

  // Quand un joueur part
  socket.on('disconnect', () => {
    console.log('Joueur déconnecté : ' + socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`LE JEU TOURNE SUR : http://localhost:${PORT}`);
});