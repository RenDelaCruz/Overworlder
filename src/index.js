/** @type {import("../typings/phaser")} */
// Loads typings/phaser.d.ts for VSCode autocomplete
// `npm install @types/phaser` not yet possible

import Phaser from 'phaser';
import config from './config/config';
import MainScene from './scenes/main-scene';
import WaitingRoom from './scenes/waiting-room';

class Game extends Phaser.Game {
  constructor() {
    super(config);

    // Add scenes
    this.scene.add('MainScene', MainScene);
    this.scene.add('WaitingRoom', WaitingRoom);

    // Start scenes
    this.scene.start('MainScene');
  }
}

window.onload = function () {
  window.game = new Game();
};
