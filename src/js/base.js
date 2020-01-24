// base.js
'use strict';

const videojs = require('video.js');

export default class App {

  constructor() {
    document.querySelector('#menuleftcontrol').addEventListener('click', event => {
      document.querySelector('#menuleft').classList.toggle('active');
    });
  }
}

const app = new App();
