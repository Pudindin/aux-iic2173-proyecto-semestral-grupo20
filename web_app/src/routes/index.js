const express = require('express');
const url = require('url');
const orm = require('../models');

const router = express.Router();

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

router.get('/', async (req, res) => {
  res.render('index');
});

router.post('/join', async (req, res) => {
  try {
    // First validate data is correct, else throw error
    if (!req.body.username
      || req.body.username === ''
      || (req.body.newroomvalue === 'true' && req.body.newroomname === '')
      || (req.body.newroomvalue === 'false' && req.body.room === '')
    ) {
      throw new Error();
    }
    // Create or find room
    let room;
    if (req.body.newroomvalue === 'true') {
      room = await orm.room.build({
        name: req.body.newroomname,
      });
      await room.save({ fields: ['name'] });
    } else {
      room = await orm.room.findOne({ where: { name: req.body.room } });
    }
    // check again if the rooom exists
    if (!room) {
      throw new Error();
    }
    // Creates unique user
    const username = await orm.user.build({ name: req.body.username });
    await username.save({ fields: ['name'] });
    // redirect to chat with new parameters
    res.redirect(url.format({
      pathname: '/chat',
      query: {
        username: `${username.name}#${username.id}`,
        room: room.name,
      },
    }));
  } catch (error) {
    console.log(error);
    // Redirect to the landing page
    res.redirect('/');
  }
});

router.get('/chat', async (req, res) => {
  try {
    const { username, room } = req.query;
    if (!username || !room || (username === '') || (room === '')) {
      throw new Error();
    }
    // find a room
    const roomChat = await orm.room.findOne({
      where: { name: room },
    });
    // find messages
    const messagesList = await orm.message.findAll({
      where: { roomId: roomChat.id },
    });

    // Format messages
    const messagesListV2 = await Promise.all(
      messagesList.map((element) => {
        const message = element;
        message.date = formatDate(message.createdAt);
        return message;
      }),
    );

    // render a picture
    res.render('room/index', {
      messagesListV2,
      user: username,
      room: roomChat,
    });
  } catch (error) {
    // redirect
    res.redirect('/');
  }
});

module.exports = router;
