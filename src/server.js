const http = require('http');

// module for parsing querystrings 
const query = require('querystring');

// grab custom files
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// POST endpoints and the handler that runs
const postHandlers = {
  '/pokedex/changePokemonName': jsonHandler.changeName,
  '/pokedex/addPokemon': jsonHandler.addPokemon,
};

// runs an action and sends an error response instead of crashing the server if it throws
const runSafely = (request, response, action) => {
  try {
    action();
  } catch (err) {
    console.dir(err);
    if (!response.headersSent) {
      jsonHandler.respondError(request, response, 400, 'serverError', 'Something went wrong on the server.');
    }
  }
};

// Credit: adapted from class example code
// reads the body, parses it based on Content-Type, then calls the handler
const parseBody = (request, response, handler) => {
  const body = [];

  request.on('error', (err) => {
    console.dir(err);
    jsonHandler.respondError(request, response, 400, 'badRequest', 'There was a problem reading the request.');
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const type = request.headers['content-type'] || '';

    if (type.includes('application/x-www-form-urlencoded')) {
      request.body = query.parse(bodyString);
    } else if (type.includes('application/json')) {
      try {
        request.body = JSON.parse(bodyString);
      } catch {
        return jsonHandler.respondError(request, response, 400, 'invalidJSON', 'The request body is not valid JSON.');
      }
    } else {
      return jsonHandler.respondError(request, response, 400, 'unsupportedType', 'Content-Type must be application/json or application/x-www-form-urlencoded.');
    }

    // the handlers expect an object of params
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return jsonHandler.respondError(request, response, 400, 'invalidBody', 'The request body must be an object of params.');
    }

    return runSafely(request, response, () => handler(request, response));
  });
};

// handle GET and HEAD requests
const handleGetOrHead = (request, response, parsedUrl) => {
  const { pathname } = parsedUrl;

  if (pathname.startsWith('/pokedex')) {
    jsonHandler.getData(request, response, parsedUrl);
  } else if (!htmlHandler.getStaticFile(request, response, pathname)) {
    jsonHandler.notFound(request, response);
  }
};

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
  const handler = postHandlers[parsedUrl.pathname];

  if (handler) {
    parseBody(request, response, handler);
  } else {
    jsonHandler.notFound(request, response);
  }
};

const onRequest = (request, response) => {
  runSafely(request, response, () => {
    // returns an object of url parts by name
    const protocol = request.socket.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    // check the method
    if (request.method === 'POST') {
      handlePost(request, response, parsedUrl);
    } else if (request.method === 'GET' || request.method === 'HEAD') {
      handleGetOrHead(request, response, parsedUrl);
    } else {
      jsonHandler.respondError(request, response, 400, 'unsupportedMethod', 'Only GET, HEAD and POST are supported.');
    }
  });
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1:${port}`);
});