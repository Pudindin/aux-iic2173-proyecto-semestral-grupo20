const express = require('express');
const jwtgenerator = require('jsonwebtoken');
const Hashids = require('hashids/cjs');
const jsonApiSerializer = require('jsonapi-serializer');
const { ValidationError } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const orm = require('../../models');

const hashids = new Hashids(process.env.HASH_ID, 10);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  let JWT_result = true;
  let Google_result = true;

  jwtgenerator.verify(token, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      JWT_result = false;
    } else {
      JWT_result = Buffer(hashids.decodeHex(data.userEmail), 'hex').toString(
        'utf8'
      );
    }
  });

  // GoogleVerification
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email } = payload;
    Google_result = email;
  } catch (error) {
    Google_result = false;
  }
  if (!JWT_result && !Google_result) {
    return res.sendStatus(401);
  } else if (JWT_result) {
    req.userEmail = JWT_result;
    next();
  } else {
    req.userEmail = Google_result;
    next();
  }
}

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

router.get('/users', authenticateToken, async (req, res) => {
  const user = await orm.user.findByPk(req.userId[0]);
  const userList = await orm.user.findAll();
  const responseBody = jsonSerializer('user', {
    attributes: ['username', 'password', 'email', 'id'],
  }).serialize(userList);

  res.send(responseBody);
});

router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await orm.user.findByPk(id);
    if (!user) {
      throw new ValidationError();
    }
    const responseBody = jsonSerializer('user', {
      attributes: ['id', 'username', 'email'],
    }).serialize(user);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/admin/users/${req.params.id}`,
          message: `User with id ${req.params.id} is not registered in the database`,
          error: "User doesn't exists",
        },
      ],
    });
  }
});

router.patch('/users/:id', authenticateToken, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      passwordConfirm,
    } = req.body.data.attributes;
    if (req.body.data.type !== 'users') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else {
      const user = await orm.user.findByPk(req.params.id);
      if (password !== '') {
        await user.update({ username, email, password });
      } else {
        await user.update({ username, email });
      }
      res.statusCode = 201;
      res.send({
        data: {
          type: 'users',
          id: user.id,
          attributes: {
            username: user.username,
            email: user.email,
            id: user.id,
          },
        },
      });
    }
  } catch (validationError) {
    if (
      validationError.message ===
      "Cannot read property 'attributes' of undefined"
    ) {
      res.status = 400;
      validationError.message = 'Bad Request';
      validationError.errors = ['Empty or invalid request data'];
    }
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/admin/users/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await orm.user.findByPk(id);
    if (!user) {
      throw new ValidationError();
    }
    await user.destroy();
    res.sendStatus(200);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/admin/users/${req.params.id}`,
          message: `User with id ${req.params.id} is not registered in the database`,
          error: "User doesn't exists",
        },
      ],
    });
  }
});

router.get('/rooms', authenticateToken, async (req, res) => {
  roomsList = await orm.room.findAll();
  const responseBody = jsonSerializer('room', {
    attributes: ['name', 'id'],
  }).serialize(roomsList);

  res.send(responseBody);
});

router.get('/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await orm.room.findByPk(id);
    if (!room) {
      throw new ValidationError();
    }
    const responseBody = jsonSerializer('room', {
      attributes: ['id', 'name'],
    }).serialize(room);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/admin/rooms/${req.params.id}`,
          message: `Room with id ${req.params.id} is not registered in the database`,
          error: "Room doesn't exists",
        },
      ],
    });
  }
});

router.patch('/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body.data.attributes;
    if (req.body.data.type !== 'rooms') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else {
      const room = await orm.room.findByPk(req.params.id);
      await room.update({ name });
      res.statusCode = 201;
      res.send({
        data: {
          type: 'rooms',
          id: room.id,
          attributes: {
            name: room.name,
            id: room.id,
          },
        },
      });
    }
  } catch (validationError) {
    if (
      validationError.message ===
      "Cannot read property 'attributes' of undefined"
    ) {
      res.status = 400;
      validationError.message = 'Bad Request';
      validationError.errors = ['Empty or invalid request data'];
    }
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/admin/rooms/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

router.delete('/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await orm.room.findByPk(id);
    if (!room) {
      throw new ValidationError();
    }
    await room.destroy();
    res.sendStatus(200);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/admin/rooms/${req.params.id}`,
          message: `Room with id ${req.params.id} is not registered in the database`,
          error: "Room doesn't exists",
        },
      ],
    });
  }
});

router.get('/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await orm.room.findByPk(id);
    if (!room) {
      throw new ValidationError();
    }
    const messagesList = await orm.message.findAll({
      where: { roomId: id },
      include: {
        model: orm.user,
      },
    });
    const responseBody = jsonSerializer('message', {
      attributes: ['message', 'createdAt', 'id', 'visible', 'user'],
      user: {
        ref: 'id',
        attributes: ['username'],
      },
    }).serialize(messagesList);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/api/admin/rooms/${req.params.id}/messages`,
          message: `Room with id ${req.params.id} is not registered in the database`,
          error: "Room doesn't exists",
        },
      ],
    });
  }
});

router.get(
  '/rooms/:roomId/messages/:id/manageCensor',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const message = await orm.message.findByPk(id);
      if (!message) {
        throw new ValidationError();
      }
      message.visible = !message.visible;
      await message.save();
      res.send({
        data: {
          type: 'messages',
          id: message.id,
          attributes: {
            message: message.message,
            id: message.id,
            ['created-at']: message.createdAt,
            visible: message.visible,
          },
        },
      });
    } catch (validationError) {
      res.statusCode = 404;
      res.send({
        errors: [
          {
            status: res.status,
            source: `/api/admin/rooms/${req.params.roomId}/messages/${req.params.id}/censor`,
            message: `Message with id ${req.params.id} is not registered in the database`,
            error: "Message doesn't exists",
          },
        ],
      });
    }
  }
);

router.get(
  '/rooms/:roomId/messages/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId, id } = req.params;
      const message = await orm.message.findByPk(id);
      if (!message) {
        throw new ValidationError();
      }
      res.send({
        data: {
          type: 'messages',
          id: message.id,
          attributes: {
            message: message.message,
            id: message.id,
            ['created-at']: message.createdAt,
            visible: message.visible,
            originalMessage: message.originalMessage,
          },
        },
      });
    } catch (validationError) {
      res.statusCode = 404;
      res.send({
        errors: [
          {
            status: res.status,
            source: `/api/admin/rooms/${req.params.roomId}/messages/${req.params.id}`,
            message: `Message with id ${req.params.id} is not registered in the database`,
            error: "Message doesn't exists",
          },
        ],
      });
    }
  }
);

router.patch(
  '/rooms/:roomId/messages/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const newContent = req.body.data.attributes.message;
      if (req.body.data.type !== 'messages') {
        res.status = 406;
        throw new ValidationError('Not Acceptable', [
          'Invalid type of request',
        ]);
      } else {
        const message = await orm.message.findByPk(req.params.id);
        await message.update({ message: newContent });
        res.statusCode = 201;
        res.send({
          data: {
            type: 'messages',
            id: message.id,
            attributes: {
              message: message.message,
              id: message.id,
              originalMessage: message.originalMessage,
              ['created-at']: message.createdAt,
              visible: message.visible,
            },
          },
        });
      }
    } catch (validationError) {
      if (
        validationError.message ===
        "Cannot read property 'attributes' of undefined"
      ) {
        res.status = 400;
        validationError.message = 'Bad Request';
        validationError.errors = ['Empty or invalid request data'];
      }
      res.statusCode = res.status;
      res.send({
        errors: [
          {
            status: res.status,
            source: '/api/admin/rooms/',
            message: validationError.message,
            error: validationError.errors,
          },
        ],
      });
    }
  }
);

module.exports = router;
