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

    this.load.spritesheet("adam_idle",
      "assets/spritesheets/adam_idle_16x16.png",
      { frameWidth: 16, frameHeight: 32 }
    );

    this.load.spritesheet("adam_run",
      "assets/spritesheets/adam_run_16x16.png",
      { frameWidth: 16, frameHeight: 32 }
    );
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

    // Animations

    // Adam idle
    this.anims.create({
      key: "adam_idle_right",
      frames: this.anims.generateFrameNumbers("adam_idle", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_idle_up",
      frames: this.anims.generateFrameNumbers("adam_idle", { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_idle_left",
      frames: this.anims.generateFrameNumbers("adam_idle", { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_idle_down",
      frames: this.anims.generateFrameNumbers("adam_idle", { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1
    });

    // Adam run
    this.anims.create({
      key: "adam_run_right",
      frames: this.anims.generateFrameNumbers("adam_run", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_run_up",
      frames: this.anims.generateFrameNumbers("adam_run", { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_run_left",
      frames: this.anims.generateFrameNumbers("adam_run", { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "adam_run_down",
      frames: this.anims.generateFrameNumbers("adam_run", { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1
    });

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
      const { x, y, direction, playerId } = playerInfo;
      scene.otherPlayers.getChildren().forEach(otherActor => {
        if (playerId === otherActor.playerId) {
          otherActor.setPosition(x, y);
          otherActor.nametag.setPosition(otherActor.x, setNametagOffsetY(otherActor));
          otherActor.direction = direction;
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
          otherPlayer.nametag.destroy();
        }
      });
    });
  }

  update() {
    const scene = this;

    if (this.actor) {
      const speed = 225;
      // const prevVelocity = this.actor.body.velocity.clone();

      // Stop previous movment from last frame
      this.actor.body.setVelocity(0);

      // Movement
      if (this.cursors.left.isDown) {
        this.actor.body.setVelocityX(-speed);
        this.actor.anims.play("adam_run_left", true);
        this.actor.direction = Direction.left;
      } else if (this.cursors.right.isDown) {
        this.actor.body.setVelocityX(speed);
        this.actor.anims.play("adam_run_right", true);
        this.actor.direction = Direction.right;
      } else if (this.cursors.up.isDown) {
        this.actor.body.setVelocityY(-speed);
        this.actor.anims.play("adam_run_up", true);
        this.actor.direction = Direction.up;
      } else if (this.cursors.down.isDown) {
        this.actor.body.setVelocityY(speed);
        this.actor.anims.play("adam_run_down", true);
        this.actor.direction = Direction.down;
      }

      // Normalize and scale velocity so actor can't move faster diagonally
      this.actor.body.velocity.normalize().scale(speed);

      let x = this.actor.x;
      let y = this.actor.y;
      let direction = this.actor.direction;
      let prevPosition = this.actor.prevPosition;

      if (prevPosition && (x !== prevPosition.x || y !== prevPosition.y)) {
        this.moving = true;
        this.socket.emit("playerMovement", {
          x: this.actor.x,
          y: this.actor.y,
          direction: this.actor.direction,
          roomKey: scene.state.roomKey,
        });
      } else {
        this.actor.anims.play("adam_idle_down", true);
      }

      // Save previous position data
      this.actor.prevPosition = {
        x: this.actor.x,
        y: this.actor.y,
        direction: this.actor.direction,
      };

      this.actor.nametag.setPosition(this.actor.x, setNametagOffsetY(this.actor));

      this.renderOtherPlayerAnimations(this);
    }
  }

  renderOtherPlayerAnimations(scene) {
    scene.otherPlayers.getChildren().forEach(otherActor => {
      let x = otherActor.x;
      let y = otherActor.y;
      let direction = otherActor.direction;
      let prevPosition = otherActor.prevPosition;

      if (prevPosition && (x !== prevPosition.x || y !== prevPosition.y)) {
        if (x > prevPosition.x) {
          otherActor.anims.play("adam_run_right", true);
        } else if (x < prevPosition.x) {
          otherActor.anims.play("adam_run_left", true);
        } else if (y > prevPosition.y) {
          otherActor.anims.play("adam_run_down", true);
        } else if (y < prevPosition.y) {
          otherActor.anims.play("adam_run_up", true);
        }
      } else {
        otherActor.anims.play("adam_idle_down", true);
      }

      otherActor.prevPosition = {
        x: otherActor.x,
        y: otherActor.y,
        direction: otherActor.direction,
      };
    });
  }

  addPlayer(scene, playerInfo) {
    scene.joined = true;
    scene.actor = scene.physics.add
      .sprite(playerInfo.x, playerInfo.y, "adam_idle")
      .setScale(2.5);

    // Player nametag
    scene.actor.nametag = scene.add.text(playerInfo.x, setNametagOffsetY(scene.actor), playerInfo.username, {
      fill: "#ffffff",
      fontSize: "15px",
    }).setOrigin(0.5, 0.5);

    scene.actor.direction = playerInfo.direction;

    console.log(`Welcome, ${playerInfo.username}.`);
  }

  addOtherPlayers(scene, playerInfo) {
    const otherActor = scene.add
      .sprite(playerInfo.x, playerInfo.y, "adam_idle")
      .setScale(2.5);

    // Other player nametag
    otherActor.nametag = scene.add.text(playerInfo.x, setNametagOffsetY(otherActor), playerInfo.username, {
      fill: "#ffffff",
      fontSize: "15px",
    }).setOrigin(0.5, 0.5);


    otherActor.playerId = playerInfo.playerId;
    otherActor.direction = playerInfo.direction;
    scene.otherPlayers.add(otherActor);

    console.log(`${playerInfo.username} joined the game.`);
  }
}

const Direction = Object.freeze({
  up: "up",
  down: "down",
  left: "left",
  right: "right",
});

function setNametagOffsetY(player) {
  return player.y + player.displayHeight / 1.5;
}