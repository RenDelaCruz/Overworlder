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

    // Load tiles
    this.load.image("tiles", "assets/tiles/serene_tile_set.png");
    this.load.tilemapTiledJSON("map", "assets/tiles/serene_tile_map.json");
  }

  create() {
    const scene = this;

    // Cursors
    scene.cursors = this.input.keyboard.createCursorKeys();

    // Create socket
    scene.socket = io();

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
    scene.otherPlayers = this.physics.add.group();

    // Map
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("sereneTileset", "tiles", 16, 16, 1, 2);
    scene.worldLayerGround = map
      .createLayer("backGround", tileset, 0, 0)
      .setCollisionByProperty({ collision: true })
      .setScale(3);
    scene.worldLayerMid = map
      .createLayer("midGround", tileset, 0, 0)
      .setCollisionByProperty({ collision: true })
      .setScale(3);
    scene.worldLayerFore = map
      .createLayer("foreGround", tileset, 0, 0)
      .setCollisionByProperty({ collision: true })
      .setScale(3);

    // Define player in between map layers to create overlap hierarchy
    scene.actor = scene.physics.add.sprite(384, 1711);

    scene.worldLayerFloat = map
      .createLayer("hoverGround", tileset, 0, 0)
      .setCollisionByProperty({ collision: true })
      .setScale(3);
    scene.worldLayerFloat = map
      .createLayer("floatGround", tileset, 0, 0)
      .setCollisionByProperty({ collision: true })
      .setScale(3);

    // const debugGraphics = this.add.graphics().setAlpha(0.75);
    // this.worldLayerFore.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });
    // this.worldLayerMid.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });
    // this.worldLayerGround.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });

    // Set camera
    scene.cameras.main.startFollow(scene.actor);
    scene.cameras.main.setBounds(0, 0, 1088 * 3, 640 * 3);
    scene.physics.world.setBounds(0, 0, 1088 * 3, 640 * 3, true, true, true, true);

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
          otherActor.nametag.destroy();
        }
      });
    });
  }

  update() {
    const scene = this;

    if (this.joined) {
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
    scene.actor.setPosition(playerInfo.x, playerInfo.y)
      .setTexture("adam_idle")
      .setCollideWorldBounds(true)
      .setSize(10, 8)
      .setOffset(3, 24)
      .setScale(3);

    // Player nametag
    scene.actor.nametag = scene.add.text(playerInfo.x, setNametagOffsetY(scene.actor), playerInfo.username, {
      fill: "#ffffff",
      fontSize: "15px",
    }).setOrigin(0.5, 0.5);

    scene.actor.direction = playerInfo.direction;

    // Collisions
    scene.physics.add.collider(scene.actor, scene.worldLayerGround);
    scene.physics.add.collider(scene.actor, scene.worldLayerMid);
    scene.physics.add.collider(scene.actor, scene.worldLayerFore);

    console.log(`Welcome, ${playerInfo.username}.`);
  }

  addOtherPlayers(scene, playerInfo) {
    const otherActor = scene.add
      .sprite(playerInfo.x, playerInfo.y, "adam_idle")
      .setScale(3);

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