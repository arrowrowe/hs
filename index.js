const http = require('http');
const Promise = require('bluebird');

class AlreadyResolvedError extends Error {
  constructor(data) {
    super();
    this.data = data;
  }
}

class ShouldContinueError extends Error {}

class Hs {
  constructor({routes}) {
    this.server = http.createServer((req, res) => {
      const end = ({statusCode=200, data}) => {
        res.writeHead(statusCode, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(typeof data === 'string' ? {message: data} : data));
      };
      const go404 = () => end({
        data: 'no service for requested',
        statusCode: 404
      });
      this.constructor.receive(req)
        .then(body =>
          Promise.mapSeries(routes, ({pattern, fn}) => {
            const match = req.url.match(pattern);
            if (match === null) {
              return;
            }
            return Promise.try(() => fn({req, res, match, body}))
              .then(data => {
                throw new AlreadyResolvedError(data);
              })
              .catchReturn(ShouldContinueError, null);
          })
            .then(go404)
            .catch(ShouldContinueError, go404)
            .catch(AlreadyResolvedError, ({data}) => end({data}))
            .catch(rea => end({
              data: typeof rea === 'string' ? rea : rea && rea.message || 'unknown error',
              statusCode: 500
            }))
        );
    });
  }

  static receive({method, on}) {
    return new Promise(resolve => {
      if (method === 'POST') {
        let data = '';
        on('data', chunk => data += chunk);
        on('end', () => resolve(data));
      } else {
        resolve();
      }
    });
  }

  up({port}) {
    return new Promise(resolve => this.server.listen(port, resolve));
  }
}

module.exports = {
  Hs,
  AlreadyResolvedError,
  ShouldContinueError,
};
