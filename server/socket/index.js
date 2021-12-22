const gameRooms = {
  // [roomKey]: {
  //   users: [],
  //   randomTasks: [],
  //   scores: [],
  //   gameScore: 0,
  //   players: {
  //     [socket.id]: {
  //       x: 100,
  //       y: 100,
  //       rotation: 0,
  //       playerId: socket.id,
  //       username: "Name",
  //     },
  //   },
  //   numPlayers: 0
  // },
};

module.exports = io => {
  io.on("connection", socket => {
    console.log(`A socket connection to the server has been made: ${socket.id}`);

    socket.on("joinRoom", data => {
      const { username, code: roomKey } = data;
      socket.join(roomKey);

      const roomInfo = gameRooms[roomKey];
      roomInfo.players[socket.id] = {
        x: spawnLocation(400),
        y: spawnLocation(300),
        rotation: 0,
        playerId: socket.id,
        username: username ? username : `Player ${socket.id.substring(0, 5)}`,
      };

      // Update number of players
      roomInfo.numPlayers = Object.keys(roomInfo.players).length;

      // Set initial state
      socket.emit("setState", roomInfo);

      // Send the other players' data to the new player
      socket.emit("currentPlayers", {
        players: roomInfo.players,
        numPlayers: roomInfo.numPlayers,
      });

      // Update all other players of the new player
      socket.to(roomKey).emit("newPlayer", {
        playerInfo: roomInfo.players[socket.id],
        numPlayers: roomInfo.numPlayers,
      });
    });

    // Update when a player moves
    socket.on("playerMovement", data => {
      const { x, y, rotation, roomKey } = data;
      gameRooms[roomKey].players[socket.id].x = x;
      gameRooms[roomKey].players[socket.id].y = y;
      gameRooms[roomKey].players[socket.id].rotation = rotation;

      // Emit moving player's position to other players
      socket.to(roomKey).emit("playerMoved", gameRooms[roomKey].players[socket.id]);
    });

    // Player disconnect
    socket.on("disconnect", () => {
      // Find player room
      let roomKey = 0;
      for (const currentRoomKey in gameRooms) {
        const currentRoom = gameRooms[currentRoomKey];
        if (currentRoom.players.hasOwnProperty(socket.id)) {
          roomKey = currentRoomKey;
          break;
        }
      }

      const roomInfo = gameRooms[roomKey];

      if (roomInfo) {
        console.log(`User ${socket.id} disconnected from room: ${roomKey}`);
        // Remove player
        delete roomInfo.players[socket.id];
        // Update number of players
        roomInfo.numPlayers = Object.keys(roomInfo.players).length;
        // Emit to all players to remove this player
        socket.to(roomKey).emit("disconnected", {
          playerId: socket.id,
          numPlayers: roomInfo.numPlayers,
        });
      }
    });

    socket.on("isKeyValid", data => {
      const { username, code } = data;
      Object.keys(gameRooms).includes(code)
        ? socket.emit("keyIsValid", data)
        : socket.emit("keyNotValid");
    });

    // Get random code for the room
    socket.on("getRoomCode", async () => {
      const key = codeGenerator(Object.keys(gameRooms));
      gameRooms[key] = {
        roomKey: key,
        randomTasks: [],
        gameScore: 0,
        scores: {},
        players: {},
        numPlayers: 0,
      };
      socket.emit("roomCreated", key);
    });
  });
};

const codeChars = "ABCDEF0123456789";

function codeGenerator(keys) {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
  }

  if (keys.includes(code)) {
    return codeGenerator(keys);
  }
  return code;
}

function spawnLocation(point, range = 40) {
  const max = point + range;
  const min = point - range;
  return Math.floor(Math.random() * (max - min + 1) + min);
}