// Import des modules nécessaires
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
// Création du serveur Socket.io en se basant sur le serveur HTTP
const io = new Server(server);

// Stockage des informations des joueurs
const players = {}; 

// Configuration d'Express pour servir les fichiers statiques (index.html, CSS, JS)
// Le dossier courant (où se trouve server.js) est utilisé pour servir les fichiers clients.
app.use(express.static(__dirname));

// Route principale pour servir le fichier index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// --- GESTION DES CONNEXIONS SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté :', socket.id);

  // --- 1. AJOUT D'UN NOUVEAU JOUEUR ---
  // On ajoute un nouveau joueur à la liste, avec une position initiale et une couleur aléatoire
  players[socket.id] = {
    rotation: 0,
    x: 0,
    z: 0,
    color: Math.floor(Math.random() * 0xffffff) // Couleur aléatoire pour le robot
  };

  // Envoi de la liste des joueurs actuels au nouveau joueur
  socket.emit('currentPlayers', players);

  // Informe tous les autres joueurs qu'un nouveau joueur s'est connecté
  socket.broadcast.emit('newPlayer', {
    id: socket.id,
    player: players[socket.id]
  });

  // --- 2. GESTION DES MOUVEMENTS DES JOUEURS ---
  socket.on('playerMovement', (movementData) => {
    // Mise à jour des données du joueur
    if (players[socket.id]) {
        players[socket.id].x = movementData.x;
        players[socket.id].z = movementData.z;
        players[socket.id].rotation = movementData.rotation;
        
        // Envoi de la nouvelle position à tous les autres clients
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x: players[socket.id].x,
            z: players[socket.id].z,
            rotation: players[socket.id].rotation
        });
    }
  });

  // --- 3. GESTION DE LA DISCONNEXION ---
  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté :', socket.id);
    // Suppression des données du joueur
    delete players[socket.id];
    // Envoi de l'ID du joueur déconnecté à tous les autres clients
    io.emit('playerDisconnected', socket.id);
  });

  // --- 4. GESTION DU CHAT (NOUVEAUTÉ) ---
  socket.on('sendMessage', (messageData) => {
    // Le message doit être valide
    if (messageData.message && messageData.message.trim() !== '') {
        // Envoie le message à TOUS les joueurs (y compris l'expéditeur)
        io.emit('receiveMessage', {
            id: socket.id, // L'ID du joueur qui parle
            message: messageData.message
        });
    }
  });

});

// --- DÉMARRAGE DU SERVEUR ---
// Utilisation du port fourni par l'environnement d'hébergement (Render) ou du port 3000 par défaut
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`LE JEU TOURNE SUR : http://localhost:${PORT}`);
});
