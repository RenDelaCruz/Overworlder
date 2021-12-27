const path = require('path');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const socketio = require('socket.io');

const PORT = process.env.PORT || 8080;
const app = express();

module.exports = app;

const createApp = function () {
  // Logging middleware
  app.use(morgan('dev'));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Compression middleware
  app.use(compression());

  // Static file-serving middleware
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Remaining requests with an extension (.js, .css, etc.) return 404
  app.use((req, res, next) => {
    if (path.extname(req.path).length) {
      const err = new Error('Not found');
      err.status = 404;
      next(err);
    } else {
      next();
    }
  });

  // Serve index.html
  app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public/index.html'));
  });

  // Server error handling endware
  app.use((err, req, res, next) => {
    console.error(err);
    console.error(err.stack);
    res.status(err.status || 500).send(err.message || 'Internal server error');
  });
};

function startListening() {
  // Create and listen to the server
  const server = app.listen(PORT, () => console.log(`\n\nListening on port ${PORT}\nhttp://localhost:${PORT}/\n`));

  const io = socketio(server);
  require('./socket')(io);
}

async function bootApp() {
  await createApp();
  await startListening();
}

// True if run by node, false if required by another module
if (require.main === module) {
  bootApp();
} else {
  createApp();
}
