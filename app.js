const express = require('express');
const config = require('./config/config');

const app = express();

let env = 'development';
require('./config/database')(config[env]);
require('./config/express')(app, config[env]);
require('./config/passport')();
require('./config/routes')(app);


module.exports = app;

//The require function is pretty straight forward.
// It's a built-in Node function that imports an object (module.exports) from another file or module.