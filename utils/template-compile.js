'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const helpers = require('handlebars-helpers');
const comparison = helpers.comparison({
  handlebars: Handlebars
});

const default_data = {
  title: "Biennale Of Sydney 2008 Online Venue",
};

function compile(args) {
  const data_path = args[2];
  const source_dir = args[3];
  const destination_dir = args[4];
  const ext = args[5] || 'html';

  // Load the data
  const data = JSON.parse(fs.readFileSync(data_path, 'utf8'));

  registerPartials();

  const infile = path.join(source_dir, 'record.hbs');

  // Iterate the data.
  data.record.forEach(record => {
    const filename = `index.${ext}`;
    const outpath = path.join(destination_dir, record.id+"");
    const outfile = path.join(outpath, filename);

    console.log(`Rendering "${record.title}" to ${outfile}.`);
    const result = render(infile, {default: default_data, record: record});

    try {
      fs.mkdirSync(outpath);
    } catch(err) {
      // Fail silently.
    }

    fs.writeFileSync(outfile, result);
  });

}


// Iterate the partials directory.
function registerPartials() {
  const partials_dir = `${__dirname}/../src/templates/partials/`
  console.log(`Registering partials in ${partials_dir}.`);

  fs.readdirSync(partials_dir).forEach(function (filename, index) {
    if ( filename && filename.substr(0,1) !== '.' ) {
      const key = filename.replace(/^_/, '').replace(/\.hbs/, '');

      const value = fs.readFileSync(path.join(partials_dir, filename), 'utf8').toString();
      if ( value ) {
        console.log(`Registering "${key}" partial.`);
        Handlebars.registerPartial(key, value);
      }
    }
  });
}


function render(filename, data) {
  console.log(JSON.stringify(data, null, 2));
  const source = fs.readFileSync(filename, 'utf8').toString();
  const template = Handlebars.compile(source);
  const output = template(data);

  return output;
}


compile(process.argv);

