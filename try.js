const {Hs, ShouldContinueError} = require('./index');
const Promise = require('bluebird');

const hs = new Hs({
  routes: [{
    pattern: /^\/user\/(\d+)\/stars$/,
    fn: ({match: {1: userId}}) => {
      return `User ${userId} has no stars!`;
    }
  }]
});

hs.up({port: 8080})
  .then(() => {
    const {address, port} = hs.server.address();
    console.log(`listening on //${address}:${port}/`);
  });
