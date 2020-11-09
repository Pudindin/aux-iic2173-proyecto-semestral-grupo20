const express = require('express');

const orm = require('../../models');
const router = express.Router();
const jsonApiSerializer = require('jsonapi-serializer');

function jsonSerializer(type, options) {
  return new jsonApiSerializer.Serializer(type, options);
}

router.post('/', async (req, res) => {
  const { name, css } = req.body.data.attributes;
  console.log(res.status);
  console.log(name, css);
  const checkRoom = await orm.room.findOne({ where: { name }, raw: true });
  console.log(`Room :${checkRoom.id}`);
  let roomId = checkRoom.id;
  console.log(`RoomId :${roomId}`);
  try {
    const { name, css } = req.body.data.attributes;
    console.log(res.status);
    console.log(name, css);
    const checkRoom = await orm.room.findOne({ where: { name }, raw: true });
    console.log(`Room :${checkRoom.id}`);
    let roomId = checkRoom.id;
    console.log(`RoomId :${roomId}`);
    let status = 500;
    let approved = false;
    res.status(status);
    if (req.body.data.type !== 'csses') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (!checkRoom) {
      res.status = 409;
      throw new ValidationError('Conflict', [`room with ${name} doesn't exists`]);
    } else {
      const css_new = await orm.css_injection_new.build({ roomId, css, approved});
      await css_new.save({ fields: ['roomId', 'css', 'approved'] });
      // Send the response
      res.statusCode = 201;
      res.send({
        data: {
          type: 'csses',
          id: css_new.id,
          attributes: {
            roomId: roomId,
            css: css_new.css,
            approved: approved,
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
          source: '/api/css_injection_new/',
          message: validationError.message,
          error: validationError.errors,
        },
      ],
    });
  }
});

router.get('/', async (req, res) => {

  cssList = await orm.css_injection_new.findAll();
  console.log(cssList);
  const responseBody = jsonSerializer('css', {
    attributes: ['room_id', 'css'],
  }).serialize(cssList);

  res.send(responseBody);
});

module.exports = router;
