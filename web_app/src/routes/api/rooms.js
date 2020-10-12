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
    if (err) return res.sendStatus(403);
    req.userId = hashids.decode(data.userId);
    next();
  });
}

function jsonSerializer(type, options) {
  return new jsonApiSerializer.Serializer(type, options);
}

router.get('/', authenticateToken, async (req, res) => {
  const user = await orm.user.findByPk(req.userId[0]);
  let redisResponse;
  let roomsList;
  await new Promise((resolve, reject) => {
    redisClient.get('rooms', function(err, reply) {
      redisResponse = reply;
      resolve();
    });
  });
  if (redisResponse != null) {
    roomsList = JSON.parse(redisResponse);
    console.log("Redis tiene los rooms !");
  }
  else{
    roomsList = await orm.room.findAll();
    redisClient.set('rooms', JSON.stringify(roomsList), 'EX', 10, function(err, reply) {
    });
    console.log("Redis NO tiene los rooms ! :(");
  }
  const responseBody = jsonSerializer('room', {
    attributes: ['name'],
    topLevelLinks: {
      self: '/api/rooms',
    },
  }).serialize(roomsList);

  res.send(responseBody);
});

/*
{
  "data": {
    "type": "rooms",
    "attributes": {
        "name": "sala1"
    }
  }
}
*/
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body.data.attributes;
    const checkRoom = await orm.room.findOne({ where: { name } });
    if (req.body.data.type !== 'rooms') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (checkRoom) {
      res.status = 409;
      throw new ValidationError('Conflict', [`room with ${name} is already registered`]);
    } else {
      const room = await orm.room.build({ name });
      await room.save({ fields: ['name'] });
      // Send the response
      res.statusCode = 201;
      res.send({
        links: {
          self: '/api/rooms/',
        },
        data: {
          type: 'rooms',
          id: room.id,
          attributes: {
            name: room.name,
          },
        },
      });
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
          source: '/api/rooms/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await orm.room.findByPk(id);
    if (!room) {
      throw new ValidationError();
    }
    const responseBody = jsonSerializer('room', {
      attributes: ['name'],
      topLevelLinks: {
        self: `/api/rooms/${req.params.id}`,
      },
    }).serialize(room);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/rooms/${req.params.id}`,
          message: `Room with id ${req.params.id} is not registered in the database`,
          error: 'Room doesn\'t exists',
        },
      ],
    });
  }
});

module.exports = router;
