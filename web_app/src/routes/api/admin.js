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

// AWS configuration
const aws = require('aws-sdk');
const ses = new aws.SES({
  accessKeyId: process.env.AWS_ACCES_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: 'us-east-2',
});

async function sendEmail(data) {
  const { reciever_name, reciever_email, user_name, room_name } = data;
  const templateData = {
    reciever_name: reciever_name,
    user_name: user_name,
    room_name: room_name,
  };
  const template_params = {
    Source: 'chatapp.ass.grupo20@gmail.com',
    Destination: {
      ToAddresses: [reciever_email],
    },
    Template: 'UserMention',
    TemplateData: JSON.stringify(templateData),
  };
  // Send email
  const response = await ses.sendTemplatedEmail(template_params).promise();
  return response;
}

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function checkMention(message) {
  const re = /^@.*#[0-9]*/g;
  return re.test(message);
}

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

function jsonSerializer(type, options) {
  return new jsonApiSerializer.Serializer(type, options);
}

router.get('/users', authenticateToken, async (req, res) => {
  const userList = await orm.user.findAll();
  const responseBody = jsonSerializer('user', {
    attributes: ['username', 'password', 'email', 'id'],
  }).serialize(userList);

  res.send(responseBody);
});

router.post('/users', async (req, res) => {
  try {
    // Get the data
    const {
      username,
      email,
      password,
      confirmPassword,
    } = req.body.data.attributes;
    const checkUser = await orm.user.findOne({ where: { email } });
    if (req.body.data.type !== 'users') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (checkUser) {
      res.status = 409;
      throw new ValidationError('Conflict', [`${email} is already registered`]);
    } else if (!validateEmail(email)) {
      res.status = 422;
      throw new ValidationError('Unprocessable Entity', [
        `${email} is invalid`,
      ]);
    } else if (password === confirmPassword) {
      // Set user and we save it to the database
      let user = await orm.user.build(req.body.data.attributes);
      await user.save({ fields: ['username', 'email', 'password', 'google'] });
      user = await orm.user.findOne({ where: { email } });
      user.username = `${username}#${user.id}`;
      await user.save({ fields: ['username'] });
      // We create the cookie containing the access token
      res.statusCode = 201;
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: user.username,
            email: user.email,
            id: user.id,
          },
        },
      });
    } else {
      res.status = 401;
      throw new ValidationError('Unauthorized', ["Passwords doesn't match"]);
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
          source: '/api/admin/users',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
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

router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body.data.attributes;
    const checkRoom = await orm.room.findOne({ where: { name } });
    if (req.body.data.type !== 'rooms') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (checkRoom) {
      res.status = 409;
      throw new ValidationError('Conflict', [
        `room with ${name} is already registered`,
      ]);
    } else {
      const room = await orm.room.build({ name });
      await room.save({ fields: ['name'] });
      // Send the response
      res.statusCode = 201;
      res.send({
        links: {
          self: '/api/admin/rooms/',
        },
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
          source: '/api/rooms/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
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

router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const user = await orm.user.findOne({ where: { email: req.userEmail } });
    const checkRoom = await orm.room.findByPk(req.params.roomId);
    if (req.body.data.type !== 'messages') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (!checkRoom) {
      res.status = 404;
      throw new ValidationError('Not Found', ["room provided doesn't exist"]);
    } else {
      let mentionedUser = null;
      if (checkMention(req.body.data.attributes.message)) {
        const myRegexp = /^@.*#[0-9]*/g;
        const match = myRegexp.exec(req.body.data.attributes.message);
        mentionedUser = await orm.user.findOne({
          where: { username: match[0].replace('@', '') },
        });
      }
      const message = await orm.message.build(req.body.data.attributes);
      message.userId = user.id;
      message.originalMessage = message.message;
      await message.save({
        fields: ['message', 'roomId', 'userId', 'originalMessage'],
      });
      // save on redis
      const messagesList = await orm.message.findAll({
        limit: 10,
        where: { roomId: checkRoom.id },
        include: {
          model: orm.user,
          attributes: ['id', 'username', 'email'],
        },
        order: [['createdAt', 'DESC']],
      });
      redisClient.set(`${checkRoom.id}`, JSON.stringify(messagesList));
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
        const email_params = {
          user_name: user.username,
          reciever_name: mentionedUser.username,
          reciever_email: mentionedUser.email,
          room_name: checkRoom.name,
        };
        await sendEmail(email_params);
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
          source: `/api/admin/rooms/${req.params.roomId}/messages`,
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

module.exports = router;
