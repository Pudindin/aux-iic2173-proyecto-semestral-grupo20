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
    let checked = false;
    res.status(status);
    if (req.body.data.type !== 'csses') {
      res.status = 406;
      throw new ValidationError('Not Acceptable', ['Invalid type of request']);
    } else if (!checkRoom) {
      res.status = 409;
      throw new ValidationError('Conflict', [`room with ${name} doesn't exists`]);
    } else {
      const css_new = await orm.css_injection_new.build({ roomId, css, approved, checked});
      await css_new.save({ fields: ['roomId', 'css', 'approved', 'checked'] });
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
            checked: checked,
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
    attributes: ['roomId', 'css', 'approved', 'checked'],
  }).serialize(cssList);

  res.send(responseBody);
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const css_injection_new = await orm.css_injection_new.findByPk(id);
    if (!css_injection_new) {
      throw new ValidationError();
    }
    const responseBody = jsonSerializer('css_injection_new', {
      attributes: ['roomId', 'css', 'approved', 'checked'],
    }).serialize(css_injection_new);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/css_injection_new/${req.params.id}`,
          message: `Css injection with id ${req.params.id} is not registered in the database`,
          error: 'Css injection doesn\'t exists',
        },
      ],
    });
  }
});

module.exports = router;
