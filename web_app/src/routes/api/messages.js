const express = require('express');
const jwtgenerator = require('jsonwebtoken');
const Hashids = require('hashids/cjs');
const jsonApiSerializer = require('jsonapi-serializer');
const { ValidationError } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const orm = require('../../models');

// AWS configuration
const aws = require('aws-sdk');
const ses = new aws.SES({
  accessKeyId: process.env.AWS_ACCES_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: 'us-east-2'
})

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
      'ToAddresses': [reciever_email]
    },
    Template: 'UserMention',
    TemplateData: JSON.stringify(templateData)
  };
  // Send email
  const response = await ses.sendTemplatedEmail(template_params).promise();
  return response;
}

//const params = {
//  user_name: 'Bruce Wayne',
//  reciever_name: 'Diego',
//  reciever_email: 'chatapp.ass.grupo20@gmail.com',
//  room_name: 'Comicon'
//};
//sendEmail(params);


const hashids = new Hashids(process.env.HASH_ID);
const router = express.Router({ mergeParams: true });
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      JWT_result = Buffer(hashids.decodeHex(data.userEmail), 'hex').toString('utf8');
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
    console.log('declinados');
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

function checkMention(message) {
  const re = /^@.*#[0-9]*/g;
  return re.test(message);
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    let roomId;
    if (req.query.roomId) {
      roomId = req.query.roomId;
    } else if (req.params.roomId) {
      roomId = req.params.roomId;
    }
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

router.get('/fast', authenticateToken, async (req, res) => {
  try {
    let roomId;
    if (req.query.roomId) {
      roomId = req.query.roomId;
    } else if (req.params.roomId) {
      roomId = req.params.roomId;
    }
    if (!roomId) {
      res.status = 422;
      throw new ValidationError('Unprocessable Entity', ['No room provided']);
    }
    let messagesList = [];
    await new Promise((resolve, reject) => {
      redisClient.get(`${roomId}`, (err, reply) => {
        messagesList = JSON.parse(reply);
        resolve();
      });
    });
    if (!messagesList) {
      messagesList = [];
    }
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
  const user = await orm.user.findOne({ where: { email: req.userEmail } });
  try {
    let checkRoom = await orm.room.findByPk(req.body.data.attributes.roomId);
    if (req.params.roomId) {
      checkRoom = await orm.room.findByPk(req.params.roomId);
    }
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
      }
      const message = await orm.message.build(req.body.data.attributes);
      message.userId = user.id;
      message.roomId = checkRoom.id;
      await message.save({ fields: ['message', 'roomId', 'userId'] });
      // save on redis
      const messagesList = await orm.message.findAll(
        {
          limit: 10,
          where: { roomId: checkRoom.id },
          include: {
            model: orm.user,
            attributes: ['id', 'username', 'email'],
          },
          order: [[ 'createdAt', 'DESC' ]],
        },
      );
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
          room_name: checkRoom.name
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
