// image-gallery.js
'use strict';

// const PhotoSwipe = require('photoswipe');
// const PhotoSwipeUI_Default = require('photoswipe-ui-default');


export default class App {

  constructor() {
    const pswpElement = document.querySelectorAll('.pswp')[0];

    const data = document.querySelectorAll('.pswp-data .slide img');

    // build items array
    const items = [];

    data.forEach(item => {
      const dimensions = item.getAttribute('data-dimensions').split(',');
      items.push({src: item.src, w: dimensions[0], h: dimensions[1]})
    });

    // define options (if needed)
    const options = {
        // optionName: 'option value'
        // for example:
        index: 0 // start at first slide
    };

    // Initializes and opens PhotoSwipe
    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();

    // @TODO Hide the data block.
  }
}

const app = new App();
