// image-gallery.js
'use strict';

// const PhotoSwipe = require('photoswipe');
// const PhotoSwipeUI_Default = require('photoswipe-ui-default');


export default class App {

  constructor() {
    const self = this;

    const data = document.querySelectorAll('.pswp-data .slide img');
    if ( ! data.length ) return;

    self.items = [];

    // build items array
    data.forEach((item, index) => {
      const dimensions = item.getAttribute('data-dimensions').split(',');
      self.items.push({src: item.src, w: dimensions[0], h: dimensions[1]});
      item.addEventListener('click', e => {
        self.openGallery(index);
      });
    });

    self.openGallery(0);
  }


  openGallery(index) {
    const self = this;

    const pswpElement = document.querySelectorAll('.pswp')[0];

    const options = {
      index: index,
    };

    // Initializes and opens PhotoSwipe
    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, self.items, options);
    gallery.init();
  }
}

const app = new App();
