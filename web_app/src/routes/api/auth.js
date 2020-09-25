const express = require('express');
const jwtgenerator = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Hashids = require('hashids/cjs');
const hashids = new Hashids(process.env.HASH_ID, 10);
const { ValidationError } = require('sequelize');
require('dotenv').config();
const orm = require('../../models');

const router = express.Router();

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
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
    } else if (user && await user.checkPassword(password)) {
      const token = await new Promise((resolve, reject) => {
        jwtgenerator.sign(
          { userId: hashids.encode(user.id) },
          process.env.JWT_SECRET, { expiresIn: '14d' },
          (err, tokenResult) => (err ? reject(err) : resolve(tokenResult)),
        );
      });
      res.send({
        data: null,
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
    if (validationError.message === 'Cannot read property \'attributes\' of undefined') {
      res.status = 400;
    }
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
      username, email, password, confirmPassword,
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
      throw new ValidationError('Unprocessable Entity', [`${email} is invalid`]);
    } else if (password === confirmPassword) {
      // Set user and we save it to the database
      let user = await orm.user.build(req.body.data.attributes);
      await user.save({ fields: ['username', 'email', 'password'] });
      user = await orm.user.findOne({ where: { email } });
      user.username = username + user.id;
      await user.save({ fields: ['username'] });
      // We create the cookie containing the access token
      const token = await new Promise((resolve, reject) => {
        jwtgenerator.sign(
          { userId: hashids.encode(user.id) },
          process.env.JWT_SECRET, { expiresIn: '14d' },
          (err, tokenResult) => (err ? reject(err) : resolve(tokenResult)),
        );
      });
      res.status = 201;
      res.send({
        data: null,
        meta: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: Math.floor((Date.now() + 12096e5) / 1000),
        },
      });
    } else {
      res.status = 401;
      throw new ValidationError('Unauthorized', ['Passwords doesn\'t match']);
    }
  } catch (validationError) {
    if (validationError.message === 'Cannot read property \'attributes\' of undefined') {
      res.status = 400;
      validationError.message = 'Bad Request';
      validationError.errors = ['Empty or invalid request data'];
    }
    res.status = res.status;
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

module.exports = router;
