
const fs = require('fs');

// Load and parse at startup
const rawData = fs.readFileSync('./pokedex.json', 'utf8');
const pokedexData = JSON.parse(rawData);

// Note this object is purely in memory
// When node shuts down this will be cleared.
// Same when your heroku app shuts down from inactivity
// We will be working with databases in the next few weeks.
const users = {};


// function to respond with a json object
// takes request, response, status code and object to send
const respondJSON = (request, response, status, object) => {

  const content = JSON.stringify(object);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });

  // HEAD requests don't get a body with their response.
  // Similarly, 204 status codes are "no content" responses
  // so they also do not get a response body.
  if (request.method !== 'HEAD' && status !== 204) {
    response.write(content);
  }

  response.end();
};


const changeName = (request, response) => {
  console.log("CHANGENAME TRIGGERED");
  // default json message
  const responseJSON = {
    message: 'Name and id are both required.',
  };

  const { name, pokedexNum  } = request.body;


  // check that we have both required params
  if (!name || !pokedexNum ) {
    responseJSON.pokedexNum  = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // default status code to 204 updated
  let responseCode = 204;

  // If the pokemon doesn't exist
  if (!pokedexData[pokedexNum  - 1]) {
    responseCode = 404;
  }
  else {

    // update pokemons name
    pokedexData[pokedexNum  - 1].name = name;
  }

  // no response needed, send empty object
  return respondJSON(request, response, responseCode, {});
};

const getData = (request, response, parsedUrl) => {
  console.log("GET DATA");
  endpointHandlers[parsedUrl.pathname](request, response, parsedUrl);
};

const getPokemon = (request, response, parsedUrl) => {
  const pokemon = pokedexData[parsedUrl.searchParams.get('pokedexNum') - 1];

  const responseJSON = {
    pokemon
  };

  respondJSON(request, response, 200, responseJSON);

};

const getAll = (request, response, parsedUrl) => {
  const responseJSON = {
    pokedexData
  };

  respondJSON(request, response, 200, responseJSON);
}

const endpointHandlers = {
  "/pokedex/getPokemonByNum": getPokemon,
  "/pokedex/getAll": getAll
};

// public exports
module.exports = {
  changeName,
  getData
};
