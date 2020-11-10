// save on redis
    const roomsList = await orm.room.findAll();
    for (room in roomsList) {
      const messagesList = await orm.message.findAll({
        limit: 10,
        where: { roomId: room.id },
        include: {
          model: orm.user,
          attributes: ['id', 'username', 'email'],
        },
        order: [['createdAt', 'DESC']],
      });
      redisClient.set(`${room.id}`, JSON.stringify(messagesList));
    }