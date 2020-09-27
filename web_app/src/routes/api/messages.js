const express = require('express');
const jwtgenerator = require('jsonwebtoken');
const Hashids = require('hashids/cjs');
const jsonApiSerializer = require('jsonapi-serializer');
const { ValidationError } = require('sequelize');
require('dotenv').config();
const orm = require('../../models');

const hashids = new Hashids(process.env.HASH_ID, 10);
const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwtgenerator.verify(token, process.env.JWT_SECRET, (err, data) => {
    console.log(err);
    console.log('---------------');
    if (err) return res.sendStatus(403);
    console.log(data.userId);
    req.userId = hashids.decode(data.userId);
    next();
  });
}

function jsonSerializer(type, options) {
  return new jsonApiSerializer.Serializer(type, options);
}

function checkMention(message) {
  const re = /^@.*#[0-9]*/g;
  return re.test(message);
}

router.get('/', authenticateToken, async (req, res) => {
  const user = await orm.user.findByPk(req.userId[0]);
  try {
    const { roomId } = req.query;
    if (!roomId) {
      res.status = 422;
      throw new ValidationError('Unprocessable Entity', ['No room provided']);
    }
    const messagesList = await orm.message.findAll(
      {
        where: { roomId },
        include: {
          model: orm.user,
        },
      },
    );
    const responseBody = jsonSerializer('message', {
      attributes: ['message', 'createdAt', 'user'],
      user: {
        ref: 'id',
        attributes: ['username'],
      },
      topLevelLinks: {
        self: '/api/messages',
      },
    }).serialize(messagesList);
    res.send(responseBody);
  } catch (validationError) {
    if (validationError.message === 'Cannot read property \'attributes\' of undefined') {
      res.status = 400;
      validationError.message = 'Bad Request';
      validationError.errors = ['Empty or invalid request data'];
    }
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/messages/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

/*
{
  "data": {
    "type": "messages",
    "attributes": {
        "roomId": "sala1",
        "message": "<message text>"
    }
  }
}
*/
router.post('/', authenticateToken, async (req, res) => {
  const user = await orm.user.findByPk(req.userId[0]);
  try {
    const checkRoom = await orm.room.findByPk(req.body.data.attributes.roomId);
    if (req.body.data.type !== 'messages') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (!checkRoom) {
      res.status = 404;
      throw new ValidationError('Not Found', ['room provided doesn\'t exist']);
    } else {
      let mentionedUser = null;
      if (checkMention(req.body.data.attributes.message)) {
        const myRegexp = /^@.*#[0-9]*/g;
        const match = myRegexp.exec(req.body.data.attributes.message);
        mentionedUser = await orm.user.findOne(
          {
            where: { username: match[0].replace('@', '') },
          },
        );
        console.log(mentionedUser);
      }
      const message = await orm.message.build(req.body.data.attributes);
      message.userId = user.id;
      await message.save({ fields: ['message', 'roomId', 'userId'] });
      // Send the response
      message.user = user;
      res.statusCode = 201;
      let responseBody = jsonSerializer('message', {
        attributes: ['message', 'createdAt', 'user'],
        user: {
          ref: 'id',
          attributes: ['username'],
        },
      }).serialize(message);

      // Here we should manage email sender
      if (mentionedUser) {
        message.mentionUser = `Sending email to ${mentionedUser.username}`;
        responseBody = jsonSerializer('message', {
          attributes: ['message', 'createdAt', 'user', 'mentionUser'],
          user: {
            ref: 'id',
            attributes: ['username'],
          },
        }).serialize(message);
      }
      res.send(responseBody);
    }
  } catch (validationError) {
    if (validationError.message === 'Cannot read property \'attributes\' of undefined') {
      res.status = 400;
      validationError.message = 'Bad Request';
      validationError.errors = ['Empty or invalid request data'];
    }
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/messages/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

module.exports = router;
