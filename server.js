const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

// Servir les fichiers statiques (index.html, css, js)
app.use(express.static(path.join(__dirname, '/')));

// Route par défaut
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// État du jeu : Liste des joueurs
const players = {};

io.on('connection', (socket) => {
  console.log('Un joueur est connecté : ' + socket.id);

  // Création d'un nouveau joueur avec des données aléatoires pour le spawn
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 10) - 5,
    y: 0,
    z: Math.floor(Math.random() * 10) - 5,
    playerId: socket.id,
    color: Math.random() * 0xffffff // Couleur aléatoire pour l'avatar
  };

  // 1. Envoyer la liste des joueurs actuels au nouveau connecté
  socket.emit('currentPlayers', players);

  // 2. Informer les autres joueurs de l'arrivée du nouveau
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // 3. Gestion de la déconnexion
  socket.on('disconnect', () => {
    console.log('Joueur déconnecté : ' + socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  // 4. Gestion du mouvement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotation = movementData.rotation;
      
      // Broadcast aux autres SAUF l'émetteur
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 5. Gestion du Chat 3D
  socket.on('chatMessage', (msg) => {
    // On renvoie le message et l'ID de l'émetteur à tout le monde
    io.emit('chatMessage', { id: socket.id, text: msg });
  });
});

const PORT = process.n_env?.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur écoute sur le port ${PORT}`);
});
