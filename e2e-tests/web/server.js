const cors = require('cors');
const express = require('express');
const opaque = require('@serenity-kit/opaque');
const Database = require('./db');

const activeSessions = {};
const db = Database.empty();

const app = express();
app.use(express.json());
app.use(cors());

let serverSetup;

async function main() {
  await opaque.ready;
  serverSetup = opaque.createServerSetup();
  const port = process.env.HTTP_PORT ?? 8181;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

app.post('/register/start', (req, res) => {
  const { userIdentifier, registrationRequest } = req.body || {};

  if (!userIdentifier) return sendError(res, 400, 'missing userIdentifier');
  if (!registrationRequest)
    return sendError(res, 400, 'missing registrationRequest');
  if (db.hasUser(userIdentifier))
    return sendError(res, 400, 'user already registered');

  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    userIdentifier,
    registrationRequest,
  });

  res.send({ registrationResponse });
  res.end();
});

app.post('/register/finish', (req, res) => {
  const { userIdentifier, registrationUpload } = req.body || {};
  if (!userIdentifier) return sendError(res, 400, 'missing userIdentifier');
  if (!registrationUpload)
    return sendError(res, 400, 'missing registrationUpload');
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
  db.setUser(userIdentifier, passwordFile);
  res.writeHead(200);
  res.end();
});

app.post('/login/start', (req, res) => {
  const { userIdentifier, credentialRequest } = req.body || {};
  const passwordFile = userIdentifier && db.getUser(userIdentifier);

  if (!userIdentifier) return sendError(res, 400, 'missing userIdentifier');
  if (!credentialRequest)
    return sendError(res, 400, 'missing credentialRequest');
  if (!passwordFile) return sendError(res, 400, 'user not registered');
  if (db.hasLogin(userIdentifier))
    return sendError(res, 400, 'login already started');

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  db.setLogin(userIdentifier, serverLogin);
  res.send({ credentialResponse });
  res.end();
});

app.post('/login/finish', (req, res) => {
  const { userIdentifier, credentialFinalization } = req.body || {};
  const serverLogin = userIdentifier && db.getLogin(userIdentifier);

  if (!userIdentifier) return sendError(res, 400, 'missing userIdentifier');
  if (!credentialFinalization)
    return sendError(res, 400, 'missing credentialFinalization');
  if (!serverLogin) return sendError(res, 400, 'login not started');

  const sessionKey = opaque.serverLoginFinish({
    credentialFinalization,
    serverLogin,
  });

  activeSessions[sessionKey] = userIdentifier;
  db.removeLogin(userIdentifier);
  res.writeHead(200);
  res.end();
});

app.post('/logout', (req, res) => {
  const auth = req.get('authorization');
  const userIdentifier = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, 'missing authorization header');
  if (!userIdentifier) return sendError(res, 401, 'no active session');

  delete activeSessions[userIdentifier];
  res.end();
});

app.get('/private', (req, res) => {
  const auth = req.get('authorization');
  const user = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, 'missing authorization header');
  if (!user) return sendError(res, 401, 'no active session');

  res.send({ message: `hello ${user} from opaque-authenticated world` });
  res.end();
});

main();
