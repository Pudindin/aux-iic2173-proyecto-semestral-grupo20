/* eslint no-console: "off" */

const http = require('http');
const socketio = require('socket.io');
const app = require('./src/app');
const db = require('./src/models');

const PORT = process.env.PORT || 3000;
let server;

function formatDate(dateParam) {
  // Get date
  const date = dateParam;
  // get day month year
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Get hours
  let minutes = date.getMinutes();
  let hour = date.getHours();

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (hour < 10) {
    hour = `0${hour}`;
  }
  if (month < 10) {
    return `${day}-0${month}-${year}  ${hour}:${minutes}`;
  }
  return `${day}-${month}-${year} ${hour}:${minutes}`;
}

db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established succesfully');
    server = http.createServer(app);
    server.listen(PORT, (err) => {
      if (err) {
        return console.error('Failed', err);
      }
      console.log(`Listening on port ${PORT}`);
      const io = socketio(server);

      // Work with sockets
      io.on('connection', (socket) => {
        console.log('---------------');
        console.log('New client connected');
        // Client connection
        socket.on('joinRoom', (msg) => {
          const { user, room } = msg;
          console.log('-----------');
          console.log(`${user.username} se ha conectado a la sala ${room.name}`);
          // Join room
          socket.join(room.name);
        });

        // Recieve message
        socket.on('chatMessage', async (msg) => {
          console.log('-----------');
          console.log(`message recieve, broadcasting to ${msg.room.name}`);
          // broadcast message to same room
          socket.broadcast
            .to(msg.room.name)
            .emit(
              'message',
              { user: msg.user, message: msg.message },
            );
        });

        // Client disconnect
        socket.on('disconnect', () => {
          console.log('-------------');
          console.log('Client disconnected');
        });
      });

      return app;
    });
  })
  .catch((err) => console.error('Unable to connect to the database:', err));

module.exports = server;
