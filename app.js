const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let tasks = [];
let users = new Map(); // Map pour stocker les identifiants des utilisateurs

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Assigner un identifiant unique à l'utilisateur
  const utilisateurId = generateUserId();
  users.set(socket.id, utilisateurId);

  // Charger les tâches chaque fois qu'un utilisateur se connecte
  tasks = loadTasks();

  // Envoyer les tâches existantes à un nouvel utilisateur avec l'identifiant utilisateur
  socket.emit('initial tasks', { tasks, utilisateurId });

  socket.on('nouvelle tâche', (tache) => {
    const data = {
      tache,
      utilisateurId: users.get(socket.id),
      estMessageEnvoye: true,
    };
    tasks.push(data);
    io.emit('nouvelle tâche', data);

    // Sauvegarder les tâches dans le fichier tasks.json
    saveTasks();
  });
});

server.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});

function loadTasks() {
  try {
    const data = fs.readFileSync('tasks.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors du chargement des tâches :', error.message);
    return [];
  }
}

function saveTasks() {
  try {
    fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2), 'utf8');
    console.log('Tâches sauvegardées avec succès.');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des tâches :', error.message);
  }
}

function generateUserId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
