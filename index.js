const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('messages.db');

// Criar tabela de mensagens se não existir
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, message TEXT)");
});

app.use(express.static('public'));

// Rota para redirecionar para o index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Evento de conexão do socket.io
io.on('connection', (socket) => {
  console.log('a user connected');

  // Carregar mensagens do banco de dados e enviar para o cliente
  db.all("SELECT * FROM messages", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      socket.emit('load messages', rows);
    }
  });

  // Evento de desconexão do socket.io
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // Evento de recebimento de mensagem do cliente
  socket.on('chat message', (msg) => {
    // Emitir mensagem para todos os clientes
    io.emit('chat message', msg);

    // Salvar mensagem no banco de dados
    db.run("INSERT INTO messages (message) VALUES (?)", [msg], (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Message saved to database:', msg);
    });
  });
});

http.listen(80, () => {
  console.log('listening on *:80');
});