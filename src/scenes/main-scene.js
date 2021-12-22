import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.state = {};
  }

  preload() {
    this.load.spritesheet("astronaut",
      "assets/spritesheets/astronaut3.png",
      { frameWidth: 29, frameHeight: 37 });
    this.load.image("mainroom", "assets/backgrounds/mainroom.png");
  }

  create() {
    const scene = this;

    // Cursors
    this.cursors = this.input.keyboard.createCursorKeys();

    // Background
    this.add.image(0, 0, "mainroom").setOrigin(0);

    // Create socket
    this.socket = io();

    // Launch waiting room
    scene.scene.launch("WaitingRoom", { socket: scene.socket });

    // Create other players group
    this.otherPlayers = this.physics.add.group();

    // Join room - set state
    this.socket.on("setState", state => {
      const { roomKey, players, numPlayers } = state;
      scene.physics.resume();

      // State
      scene.state.roomKey = roomKey;
      scene.state.players = players;
      scene.state.numPlayers = numPlayers;
    });

    // Retrieve player info upon join
    this.socket.on("currentPlayers", data => {
      const { players, numPlayers } = data;
      scene.state.numPlayers = numPlayers;

      Object.keys(players).forEach(id => {
        if (players[id].playerId === scene.socket.id) {
          scene.addPlayer(scene, players[id]);
        } else {
          scene.addOtherPlayers(scene, players[id]);
        }
      });
    });

    this.socket.on("newPlayer", data => {
      const { playerInfo, numPlayers } = data;
      scene.addOtherPlayers(scene, playerInfo);
      scene.state.numPlayers = numPlayers;
    });

    this.socket.on("playerMoved", playerInfo => {
      const { x, y, rotation, playerId } = playerInfo;
      scene.otherPlayers.getChildren().forEach(otherActor => {
        if (playerId === otherActor.playerId) {
          otherActor.setPosition(x, y);
          otherActor.rotation = rotation;
        }
      });
    });

    // Disconnection
    this.socket.on("disconnected", data => {
      const { playerId, numPlayers } = data;
      scene.state.numPlayers = numPlayers;
      scene.otherPlayers.getChildren().forEach(otherActor => {
        if (playerId === otherActor.playerId) {
          otherActor.destroy();
        }
      });
    });
  }

  update() {
    const scene = this;

    // Movement
    if (this.actor) {
      const speed = 225;
      // const prevVelocity = this.actor.body.velocity.clone();

      // Stop previous movment from last frame
      this.actor.body.setVelocity(0);

      // Horizontal movment
      if (this.cursors.left.isDown) {
        this.actor.body.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.actor.body.setVelocityX(speed);
      }

      // Vertical movement
      if (this.cursors.up.isDown) {
        this.actor.body.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.actor.body.setVelocityY(speed);
      }

      // Normalize and scale velocity so actor can't move faster diagonally
      this.actor.body.velocity.normalize().scale(speed);

      let x = this.actor.x;
      let y = this.actor.y;
      let rotation = this.actor.rotation;
      let prevPosition = this.actor.prevPosition;

      if (prevPosition && (x !== prevPosition.x || y !== prevPosition.y)) {
        this.moving = true;
        this.socket.emit("playerMovement", {
          x: this.actor.x,
          y: this.actor.y,
          rotation: this.actor.rotation,
          roomKey: scene.state.roomKey,
        });
      }

      // Save previous position data
      this.actor.prevPosition = {
        x: this.actor.x,
        y: this.actor.y,
        rotation: this.actor.rotation,
      };

      // this.actorNametag.setPosition(this.actor.x, this.actor.y - 20);
    }
  }

  addPlayer(scene, playerInfo) {
    scene.joined = true;
    scene.actor = scene.physics.add
      .sprite(playerInfo.x, playerInfo.y, "astronaut")
      .setOrigin(0.5, 0.5)
      .setSize(30, 40)
      .setOffset(0, 24)
      .setTint(0xd71e22);;

    // Player nametag
    // scene.actorNametag = scene.add.text(400, 300, "HELLOOOOO", {
    //   fill: "#ff0000",
    //   fontSize: "15px",
    // });
    console.log("YEFHSJDFH");

    // scene.cameras.main.startFollow(scene.actor);
    // scene.cameras.main.setBounds(0, 0, 1000, 8000);

    console.log(`Welcome, ${playerInfo.username}.`);
  }

  addOtherPlayers(scene, playerInfo) {
    const otherActor = scene.add.sprite(
      playerInfo.x,
      playerInfo.y,
      "astronaut",
    );

    console.log(`${playerInfo.username} joined the game.`);

    otherActor.playerId = playerInfo.playerId;
    scene.otherPlayers.add(otherActor);
  }
}