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
        // When user connects
        socket.on('joinRoom', (msg) => {
          const user = msg.username;
          const { room } = msg;
          // join room
          socket.join(room);

          // Emit a welcome app
          socket.emit(
            'message',
            { username: user, text: `Bienvenido a ${room}` },
          );

          // Broadcoast when user connects
          socket.broadcast
            .to(room)
            .emit(
              'message',
              { username: user, text: `Usuario ${user} se ha unido a ${room}` },
            );
        });

        // Recieve message
        socket.on('chatMessage', async (msg) => {
          const user = msg.username;
          const room = await db.room.findOne({ where: { name: msg.room } });

          // Save to the database
          const message = await db.message.build({
            user,
            message: msg.msg,
            roomId: room.id,
          });
          await message.save({ fields: ['user', 'message', 'roomId'] });

          // Emit the message to other users
          socket.broadcast
            .to(room.name)
            .emit(
              'message',
              { username: user, text: message.message, date: formatDate(message.createdAt) },
            );
        });

        // Handle disconnect
        socket.on('disconnect', (msg) => {
          console.log(msg);
        });
      });

      return app;
    });
  })
  .catch((err) => console.error('Unable to connect to the database:', err));