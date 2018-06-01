var Libvoikko = require('./lib/libvoikko.js')();
var voikko = Libvoikko.init('fi');
var express = require('express');
try {
  var config = require('./config.js');
} catch (ex) {
  console.error('Failed to open config file. Make sure config.js exists.');
  process.exit(1);
}

var app = express();

app.get('/analyze/:word', (req, res) => {
  res.send(JSON.stringify(voikko.analyze(req.params.word)));
});

app.listen(config.port, () =>
  console.log('Server started at port ' + config.port)
);
