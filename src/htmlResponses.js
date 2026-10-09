const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'client');

// futureproof if I add pictures populating or other style
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// read every client file into memory once at startup
const files = {};
fs.readdirSync(clientDir).forEach((name) => {
  const type = mimeTypes[path.extname(name)];
  if (type) {
    files[`/${name}`] = { content: fs.readFileSync(path.join(clientDir, name)), type };
  }
});
files['/'] = files['/client.html'];

// sends the static file for this path, returns false if there isn't one
// created this instead of getIndex, getCSS, etc for D.R.Y.
const getStaticFile = (request, response, pathname) => {
  const file = files[pathname];

  if (!file) {
    return false;
  }

  response.writeHead(200, {
    'Content-Type': file.type,
    'Content-Length': file.content.length,
  });

  if (request.method !== 'HEAD') {
    response.write(file.content);
  }

  response.end();
  return true;
};

module.exports = {
  getStaticFile,
};