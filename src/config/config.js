export default {
  type: Phaser.AUTO,
  width: 880,
  height: 660,
  render: {
    pixelArt: true,
  },
  scale: {
    parent: "game",
    autoCenter: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  dom: {
    createContainer: true,
  },
  scene: [],
};