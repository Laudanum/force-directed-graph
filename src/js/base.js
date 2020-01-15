// base.js
'use strict';

export default class App {

  constructor() {
    document.querySelector('#menuleftcontrol').addEventListener('click', event => {
      document.querySelector('#menuleft').classList.toggle('active');
    });
  }
}

const app = new App();