// base.js
'use strict';

export default class App {

  constructor() {
    console.log('Loading base.js.');
    document.querySelector('#menuleftcontrol').addEventListener('click', event => {
      console.log('click');
      document.querySelector('#menuleft').classList.toggle('active');
    });
    console.log('Loaded base.js.');
  }
}

const app = new App();
