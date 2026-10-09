const fs = require('fs');
const path = require('path');

// Load and parse at startup
const rawData = fs.readFileSync(path.join(__dirname, '..', 'pokedex.json'), 'utf8');
const pokedexData = JSON.parse(rawData);

// function to respond with a json object
// takes request, response, status code and object to send
// Credit: adapted from class example code
const respondJSON = (request, response, status, object) => {
  const content = status === 204 ? '' : JSON.stringify(object);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });

  // HEAD and 204 responses have no body
  if (request.method !== 'HEAD' && status !== 204) {
    response.write(content);
  }

  response.end();
};

// responds with an id and a message about what went wrong
const respondError = (request, response, status, id, message) => {
  respondJSON(request, response, status, { id, message });
};

const notFound = (request, response) => {
  respondError(request, response, 404, 'notFound', 'The page or endpoint you requested was not found.');
};

// sends the pokemon that pass the filter, using limit and offset from the url
const sendList = (request, response, parsedUrl, filter) => {
  const list = pokedexData.filter(filter);
  const limit = Number(parsedUrl.searchParams.get('limit') || list.length);
  const offset = Number(parsedUrl.searchParams.get('offset') || 0);

  if (Number.isNaN(limit) || Number.isNaN(offset) || limit < 0 || offset < 0) {
    return respondError(request, response, 400, 'invalidParams', 'limit and offset must be numbers.');
  }

  const pokemon = list.slice(offset, offset + limit);
  return respondJSON(request, response, 200, { total: list.length, count: pokemon.length, pokemon });
};

const getAll = (request, response, parsedUrl) => {
  sendList(request, response, parsedUrl, () => true);
};

const getPokemonByID = (request, response, parsedUrl) => {
  const pokedexNum = parsedUrl.searchParams.get('pokedexNum');

  if (!pokedexNum || Number.isNaN(Number(pokedexNum))) {
    return respondError(request, response, 400, 'invalidParams', 'pokedexNum is required and must be a number.');
  }

  const pokemon = pokedexData.find((entry) => entry.id === Number(pokedexNum));
  if (!pokemon) {
    return respondError(request, response, 404, 'notFound', 'No pokemon with that pokedexNum.');
  }

  return respondJSON(request, response, 200, { pokemon });
};

// used by both getPokemonByType and getPokemonByWeakness, field is 'type' or 'weaknesses'
const getByTypeField = (request, response, parsedUrl, field) => {
  const type = parsedUrl.searchParams.get('pokemonType');

  if (!type) {
    return respondError(request, response, 400, 'invalidParams', 'pokemonType is required');
  }

  return sendList(request, response, parsedUrl, (pokemon) => pokemon[field].includes(type));
};

const getPokemonByType = (request, response, parsedUrl) => {
  getByTypeField(request, response, parsedUrl, 'type');
};

const getPokemonByWeakness = (request, response, parsedUrl) => {
  getByTypeField(request, response, parsedUrl, 'weaknesses');
};

const changeName = (request, response) => {
  const { pokedexNum, name } = request.body;

  // check that we have both required params
  if (typeof name !== 'string' || !name.trim() || !pokedexNum) {
    return respondError(request, response, 400, 'missingParams', 'Name and pokedexNum are both required.');
  }

  const pokemon = pokedexData.find((entry) => entry.id === Number(pokedexNum));
  if (!pokemon) {
    return respondError(request, response, 404, 'notFound', 'No pokemon with that pokedexNum.');
  }

  pokemon.name = name.trim();

  // no response needed
  return respondJSON(request, response, 204, {});
};

const addPokemon = (request, response) => {
  const {
    name, pokemonType, img, height, weight,
  } = request.body;
  const type = pokemonType;

  // check that we have both required params
  if (typeof name !== 'string' || !name.trim() || !type) {
    return respondError(request, response, 400, 'missingParams', 'Name and a real pokemonType are both required.');
  }

  // match the shape of the data in the json file
  const id = pokedexData.length + 1;
  const newPokemon = {
    id,
    num: String(id).padStart(3, '0'),
    name: name.trim(),
    img: img || '',
    type: [type],
    height: height || '',
    weight: weight || '',
    weaknesses: [],
  };

  pokedexData.push(newPokemon);

  return respondJSON(request, response, 201, { message: 'Created Successfully', pokemon: newPokemon });
};

const endpointHandlers = {
  '/pokedex/getAll': getAll,
  '/pokedex/getPokemonByNum': getPokemonByID,
  '/pokedex/getPokemonByType': getPokemonByType,
  '/pokedex/getPokemonByWeakness': getPokemonByWeakness,
};

// uses the pathname to call the correct handler for this endpoint
const getData = (request, response, parsedUrl) => {
  const handler = endpointHandlers[parsedUrl.pathname];

  if (!handler) {
    return notFound(request, response);
  }

  return handler(request, response, parsedUrl);
};

// public exports
module.exports = {
  getData,
  changeName,
  addPokemon,
  respondError,
  notFound,
};