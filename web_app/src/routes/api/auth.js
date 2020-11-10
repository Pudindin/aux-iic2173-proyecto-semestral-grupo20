const express = require('express');
const jwtgenerator = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Hashids = require('hashids/cjs');
const { OAuth2Client } = require('google-auth-library');

const hashids = new Hashids(process.env.HASH_ID);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { ValidationError } = require('sequelize');
require('dotenv').config();
const orm = require('../../models');

const router = express.Router();

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

async function authenticateGoogleToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  // GoogleVerification
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    req.userObject = { sub, email, fullName: name, photoUrl: picture };
  } catch (error) {
    return res.sendStatus(401);
  }
  next();
}

/*
{
  "data": {
    "type": "users",
    "attributes": {
        "email": "test@subject.cl",
        "password": "test123"
    }
  }
}
*/
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body.data.attributes;
    const user = await orm.user.findOne({ where: { email } });
    if (req.body.data.type !== 'users') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (!user) {
      res.status = 404;
      throw new ValidationError('Unauthorized', ['No user with email']);
    } else if (user && (await user.checkPassword(password))) {
      const token = await new Promise((resolve, reject) => {
        const userEmailHex = Buffer(user.email).toString('hex');
        jwtgenerator.sign(
          { userEmail: hashids.encodeHex(userEmailHex) },
          process.env.JWT_SECRET,
          { expiresIn: '14d' },
          (err, tokenResult) => (err ? reject(err) : resolve(tokenResult))
        );
      });
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: user.username,
            email: user.email,
            admin: user.admin,
          },
        },
        meta: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: Math.floor((Date.now() + 12096e5) / 1000),
        },
      });
    } else {
      res.status = 401;
      throw new ValidationError('Unauthorized', ['Wrong password or email']);
    }
  } catch (validationError) {
    if (
      validationError.message ===
      "Cannot read property 'attributes' of undefined"
    ) {
      res.status = 400;
    }
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/auth/signin',
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
    "type": "users",
    "attributes": {
        "username": "<name>",
        "email": "test@subject.cl",
        "password": "test123",
        "confirmPassword": "test1234"
    }
  }
}
*/
router.post('/signup', async (req, res) => {
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
      const token = await new Promise((resolve, reject) => {
        const userEmailHex = Buffer(user.email).toString('hex');
        jwtgenerator.sign(
          { userId: hashids.encodeHex(userEmailHex) },
          process.env.JWT_SECRET,
          { expiresIn: '14d' },
          (err, tokenResult) => (err ? reject(err) : resolve(tokenResult))
        );
      });
      res.statusCode = 201;
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: user.username,
            email: user.email,
          },
        },
        meta: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: Math.floor((Date.now() + 12096e5) / 1000),
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
          source: '/api/auth/signup',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

router.get('/google-signin', authenticateGoogleToken, async (req, res) => {
  try {
    const user = await orm.user.findOne({
      where: { email: req.userObject.email },
    });
    if (!user) {
      res.status = 401;
      throw new ValidationError('Unauthorized', [
        `No user with ${req.userObject.email}`,
      ]);
    } else {
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: user.username,
            email: user.email,
          },
        },
      });
    }
  } catch (validationError) {
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/auth/google-signin',
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
    "type": "users",
    "attributes": {
        "googleToken": "<token>"
    }
  }
}
*/
router.post('/google-signup', async (req, res) => {
  try {
    const { googleToken } = req.body.data.attributes;
    if (!googleToken) {
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    }
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email } = payload;
    const username = email.split('@')[0];
    // Check data
    const checkUser = await orm.user.findOne({ where: { email } });
    if (req.body.data.type !== 'users') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (checkUser) {
      checkUser.google = true;
      await checkUser.save({ fields: ['google'] });
      // Send user back
      res.status = 200;
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: checkUser.username,
            email: checkUser.email,
          },
        },
      });
    } else {
      // Save user to database
      let user = await orm.user.build({
        username,
        email,
        password: sub,
        google: true,
      });
      await user.save({ fields: ['username', 'email', 'password', 'google'] });
      user = await orm.user.findOne({ where: { email } });
      user.username = `${username}#${user.id}`;
      await user.save({ fields: ['username'] });
      // Send user back
      res.status = 201;
      res.send({
        data: {
          type: 'users',
          attributes: {
            username: user.username,
            email: user.email,
          },
        },
      });
    }
  } catch (error) {
    res.statusCode = res.status;
    res.send({
      errors: [
        {
          status: res.status,
          source: '/api/auth/google-signup',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

module.exports = router;
