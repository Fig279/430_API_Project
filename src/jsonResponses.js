
const fs = require('fs');

// Load and parse at startup
const rawData = fs.readFileSync('./pokedex.json', 'utf8');
const pokedexData = JSON.parse(rawData);



// function to respond with a json object
// takes request, response, status code and object to send
const respondJSON = (request, response, status, object) => {

  const content = JSON.stringify(object);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });


  //  no response body.
  if (request.method !== 'HEAD' && status !== 204) {
    response.write(content);
  }

  response.end();
};


const changeName = (request, response) => {
  // default json message
  const responseJSON = {
    message: 'Name and id are both required.',
  };

  const { name, pokedexNum } = request.body;


  // check that we have both required params
  if (!name || !pokedexNum) {
    responseJSON = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // default status code to 204 updated
  let responseCode = 204;

  // If the pokemon doesn't exist
  if (!pokedexData[pokedexNum - 1]) {
    responseCode = 404;
  }
  else {

    // update pokemons name
    pokedexData[pokedexNum - 1].name = name;
  }

  // no response needed, send empty object
  return respondJSON(request, response, responseCode, {});
};

const addPokemon = (request, response) => {
  // default json message
  const responseJSON = {
    message: 'Name and type are both required.',
  };

  const { name, pokemonType } = request.body;


  // check that we have both required params
  if (!name || !pokemonType) {
    responseJSON = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }


  // Set the status code to 201 (created)
  responseCode = 201;

  // create a pokemon object
  var newPokemon = {
    "id": pokedexData.length,
    "name": name,
  "type": pokemonType};

  // add the object to the dataset
  pokedexData.push(newPokemon);


  // no response needed, send empty object
  return respondJSON(request, response, responseCode, {});

}

/// finds uses the pathname to call the correct handler for this endpoint
const getData = (request, response, parsedUrl) => {
  endpointHandlers[parsedUrl.pathname](request, response, parsedUrl);
};

const getPokemonByID = (request, response, parsedUrl) => {
  const pokemon = pokedexData[parsedUrl.searchParams.get('pokedexNum') - 1];

  const responseJSON = {
    pokemon
  };

  respondJSON(request, response, 200, responseJSON);

};

const getPokemonByType = (request, response, parsedUrl) => {
  const desiredType = parsedUrl.searchParams.get('pokemonType');

  var pokemon = [];

  for (var i = 0; i < pokedexData.length; i++) {

    // if the pokemon has the required type, add them to the dataset
    if (pokedexData[i]["type"].includes(desiredType)) {
      pokemon.push(pokedexData[i]);
    }
  }

  const responseJSON = {
    pokemon
  };

  respondJSON(request, response, 200, responseJSON);

};

const getPokemonByWeakness = (request, response, parsedUrl) => {
  const typeWeakness = parsedUrl.searchParams.get('pokemonType');

  var pokemon = [];

  for (var i = 0; i < pokedexData.length; i++) {

    // if the pokemon has the required type, add them to the dataset
    if (pokedexData[i]["weaknesses"].includes(typeWeakness)) {
      pokemon.push(pokedexData[i]);
    }
  }

  const responseJSON = {
    pokemon
  };

  respondJSON(request, response, 200, responseJSON);

};

const getAll = (request, response, parsedUrl) => {
  parsedUrl;
  const responseJSON = {
    pokedexData
  };

  respondJSON(request, response, 200, responseJSON);
}

const endpointHandlers = {
  "/pokedex/getPokemonByNum": getPokemonByID,
  "/pokedex/getAll": getAll,
  "/pokedex/getPokemonByType": getPokemonByType,
  "/pokedex/getPokemonByWeakness": getPokemonByWeakness
};

// public exports
module.exports = {
  changeName,
  getData,
  addPokemon
};
