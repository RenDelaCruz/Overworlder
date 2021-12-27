import Phaser from 'phaser';

export default class WaitingRoom extends Phaser.Scene {
  constructor() {
    super('WaitingRoom');
    this.state = {};
    this.hasBeenSet = false;
  }

  init(data) {
    this.socket = data.socket;
  }

  preload() {
    this.load.html('codeform', 'assets/text/codeform.html');
  }

  create() {
    const scene = this;

    scene.popUp = scene.add.graphics();
    scene.boxes = scene.add.graphics();

    // Popup window
    scene.popUp.lineStyle(1, 0xffffff);
    scene.popUp.fillStyle(0xffffff, 0.5);

    // Boxes
    scene.boxes.lineStyle(1, 0xffffff);
    scene.boxes.fillStyle(0xa9a9a9, 1);

    // Popup window
    scene.popUp.strokeRect(25, 25, 750, 500);
    scene.popUp.fillRect(25, 25, 750, 500);

    // Title
    scene.title = scene.add.text(100, 75, 'Overworlder', {
      fill: '#000000',
      fontSize: '66px',
      fontStyle: 'bold',
    });

    // Left popup
    scene.boxes.strokeRect(100, 200, 275, 100);
    scene.boxes.fillRect(100, 200, 275, 100);
    scene.requestButton = scene.add.text(140, 215, 'Request Room Key', {
      fill: '#000000',
      fontSize: '20px',
      fontStyle: 'bold',
    });

    // Right popup
    scene.boxes.strokeRect(425, 200, 275, 100);
    scene.boxes.fillRect(425, 200, 275, 100);
    scene.inputElement = scene.add.dom(562.5, 250).createFromCache('codeform');
    scene.inputElement.addListener('click');
    scene.inputElement.on('click', (event) => {
      if (event.target.name === 'enterRoom') {
        const username = scene.inputElement.getChildByName('username-form').value;
        const code = scene.inputElement.getChildByName('code-form').value.toUpperCase();
        const sprite = scene.inputElement.getChildByName('character-sprite').value;
        scene.socket.emit('isKeyValid', { username, code, sprite });
      }
    });

    // Request button
    scene.requestButton.setInteractive();
    scene.requestButton.on('pointerdown', () => {
      scene.socket.emit('getRoomCode');
    });

    // Text
    scene.notValidText = scene.add.text(465, 202, '', {
      fill: '#ff0000',
      fontSize: '15px',
    });
    scene.roomKeyText = scene.add.text(210, 250, '', {
      fill: '#00ff00',
      fontSize: '20px',
      fontStyle: 'bold',
    });

    // Socket listeners
    scene.socket.on('roomCreated', (roomKey) => {
      console.log(`Created room: ${roomKey}`);
      scene.roomKey = roomKey;
      scene.roomKeyText.setText(scene.roomKey);
    });

    scene.socket.on('keyNotValid', () => {
      scene.notValidText.setText('Invalid Room Key');
    });

    scene.socket.on('keyIsValid', (data) => {
      scene.socket.emit('joinRoom', data);
      scene.scene.stop('WaitingRoom');
    });
  }

  update() { }
}
