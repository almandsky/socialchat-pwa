#!/usr/bin/env node

const express = require('express');
const fs = require('mz/fs');
const handlebars = require('handlebars');
const crypto = require('crypto')

const port = 8081;
const app = express();

handlebars.registerHelper('ifNotEq', function(a, b, opts) {
  if (a !== b) {
    return opts.fn(this);
  }
});
// Matches paths like `/`, `/index.html`, `/about/` or `/about/index.html`.
const toplevelSection = /([^/]*)(\/|\/index.html)$/;

app.get(toplevelSection, (req, res) => {
  req.item = req.params[0] || '';
  let files;
  if ('partial' in req.query) {
    files = [fs.readFile(`app/${req.item}/index.html`)]
  } else {
    files = [
      fs.readFile('app/header.partial.html'),
      fs.readFile(`app/${req.item}/index.html`),
      fs.readFile('app/footer.partial.html')
    ]
  }

  Promise.all(files)
  .then(files => files.map(f => f.toString('utf-8')))
  .then(files => files.map(f => handlebars.compile(f)(req)))
  .then(files => {
      const content = files.join('');
      const hash = crypto
                      .createHash('sha256')
                      .update(content)
                      .digest('hex');
      res.set({
        'ETag': hash,
        'Cache-Control': 'public, no-cache'
      })
      res.send(content);
  })
  .catch(error => res.status(500).send(error.toString()));

});

app.use(express.static('app'));

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}

require('spdy').createServer(options,app).listen(port);

console.log('server started at port ' + port);