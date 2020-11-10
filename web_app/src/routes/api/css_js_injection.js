const express = require('express');

const orm = require('../../models');
const router = express.Router();
const jsonApiSerializer = require('jsonapi-serializer');
const { or, ValidationError } = require('sequelize');

function jsonSerializer(type, options) {
  return new jsonApiSerializer.Serializer(type, options);
}

router.post('/', async (req, res) => {
  console.log(req.body);
  const { roomId, type, code} = req.body.data.attributes;
  console.log(res.status);
  const checkRoom = await orm.room.findOne({ where: { id : roomId }, raw: true });
  console.log(`Room :${checkRoom.id}`);
  console.log(`RoomId :${roomId}`);
  try {
    console.log(req.body);
    const { roomId, type, code} = req.body.data.attributes;
    console.log(res.status);
    const checkRoom = await orm.room.findOne({ where: { id : roomId }, raw: true });
    console.log(`Room :${checkRoom.id}`);
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
      const css_new = await orm.css_injection_new.build({ roomId, type, code, approved, checked});
      await css_new.save({ fields: ['roomId', 'type', 'code', 'approved', 'checked'] });
      // Send the response
      res.statusCode = 201;
      res.send({
        data: {
          type: 'injection',
          id: css_new.id,
          attributes: {
            roomId: roomId,
            type: css_new.type,
            code: css_new.code,
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
  injectionList = await orm.css_injection_new.findAll();
  console.log(injectionList);
  const responseBody = jsonSerializer('css', {
    attributes: ['roomId', 'type', 'code', 'approved', 'checked'],
  }).serialize(injectionList);

  res.send(responseBody);
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log("------------------------")
    console.log(id);
    const css_js_injection = await orm.css_injection_new.findOne({where: {roomId : id, approved : true, checked : true}});
    console.log(css_js_injection);
    if (!css_js_injection) {
      throw new ValidationError();
    }
    const responseBody = jsonSerializer('css_js_injection', {
      attributes: ['roomId', 'type', 'code', 'approved', 'checked'],
    }).serialize(css_js_injection);
    res.send(responseBody);
  } catch (validationError) {
    res.statusCode = 404;
    res.send({
      errors: [
        {
          status: res.status,
          source: `/css_js_injection/${req.params.id}`,
          message: `Css injection for room ${req.params.id} is not registered in the database`,
          error: 'Css injection doesn\'t exists',
        },
      ],
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const injection_id = req.body.id;
    console.log (approved);
    console.log(req.body);
    const css_js_injection = await orm.css_injection_new.findOne({where: {id : injection_id}})
    console.log(css_js_injection);
    if (!css_js_injection) {
      throw new ValidationError();
    }
    css_js_injection.approved = approved; 
    css_js_injection.checked = true;
    await css_js_injection.save();
    res.send(
      {
        "state": `succesfully updated injection to room ${id}`
      }
    );
  } catch (ValidationError){
    res.statusCode = 404;
    res.send({
      errors: [
      {
        status: res.status,
        source: `/css_js_injection/${req.params.id}`,
        message: `Css injection for room ${req.params.id} is not registered in the database`,
        error: 'Css injection doesn\'t exists',
      }
    ],
  });
  }
});

module.exports = router;
