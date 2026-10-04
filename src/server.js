const http = require('http'); // pull in http module

// querystring module for parsing querystrings from url
const query = require('querystring');

// pull in our custom files
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;


const parseBody = (request, response, handler) => {

  const body = [];

  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });


  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    console.log(request.headers['content-type']);
    const bodyString = Buffer.concat(body).toString();
    const type = request.headers['content-type'];
    if (type.includes('application/x-www-form-urlencoded')) {
      request.body = query.parse(bodyString);
    } else if (type.includes('application/json')) { 
      request.body = JSON.parse(bodyString);
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ error: 'invalid data format' }));
      return response.end();
    }

    handler(request, response);
  });
};

// handle GET requests
const handleGet = (request, response, parsedUrl) => {
  console.log(`handleGet pathname: ${parsedUrl.pathname}`);
  // route to correct method based on url
  if (parsedUrl.pathname === '/style.css') {
    htmlHandler.getCSS(request, response);
  } else if (parsedUrl.pathname.substring(0, 8) === '/pokedex') {
    jsonHandler.getData(request, response, parsedUrl);
  }

  else {
    htmlHandler.getIndex(request, response);
  }
};

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
  console.log("handlePost");
  if (parsedUrl.pathname === '/pokedex/changePokemonName') {
    // paresebody with a handler function
    parseBody(request, response, jsonHandler.changeName);
  }
  else if(parsedUrl.pathname === '/pokedex/addPokemon'){
    parseBody(request, response, jsonHandler.addPokemon);

  }
};

const onRequest = (request, response) => {
  console.log(request.method);

  // returns an object of url parts by name
  const protocol = request.connection.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

  // check the method
  if (request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  } else {
    handleGet(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1:${port}`);
});
