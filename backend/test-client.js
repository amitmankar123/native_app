const http = require('http');
const { PassThrough } = require('stream');

function dispatch(app, method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const socket = new PassThrough();
    socket.remoteAddress = '127.0.0.1';

    const req = new http.IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;

    const payload = body ? JSON.stringify(body) : '';
    req.headers = {
      host: 'localhost',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
      ...headers,
    };

    const res = new http.ServerResponse(req);
    const resStream = new PassThrough();
    res.assignSocket(resStream);

    let rawData = '';
    resStream.on('data', (chunk) => {
      rawData += chunk.toString();
    });

    res.on('finish', () => {
      // The HTTP response stream includes headers then \r\n\r\n then body
      const splitIdx = rawData.indexOf('\r\n\r\n');
      const bodyPart = splitIdx !== -1 ? rawData.substring(splitIdx + 4) : rawData;
      let parsed;
      try {
        parsed = JSON.parse(bodyPart);
      } catch (e) {
        parsed = bodyPart;
      }
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        body: parsed,
      });
    });

    res.on('error', reject);

    app(req, res);

    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

module.exports = { dispatch };

