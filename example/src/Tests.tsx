import * as opaque from 'react-native-opaque';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { TestResult, expect, runTests, test } from './lib';

// test('1 === 1', async () => {
//   expect(1).toBe(1);
//   // expect(1).toBe(2);
// });

// test('something to be undefined', async () => {
//   expect(undefined).toBeUndefined();
// });

function setupAndRegister(
  userIdentifier: string,
  password: string,
  identifiers: { client?: string; server?: string } | undefined = undefined
) {
  const serverSetup = opaque.createServerSetup();
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    userIdentifier,
    registrationRequest,
  });
  const { registrationUpload, exportKey, serverStaticPublicKey } =
    opaque.clientRegistrationFinish({
      clientRegistration,
      registrationResponse,
      password,
      identifiers,
    });
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
  return {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey,
    serverStaticPublicKey,
  };
}

test('full registration & login flow', () => {
  const userIdentifier = 'user123';
  const password = 'hunter42';

  const {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password);

  expect(registrationUpload).toEqual(passwordFile);

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  expect(loginResult).not.toBeUndefined();
  if (!loginResult) throw new TypeError(); // this check only here for TS

  const {
    sessionKey: clientSessionKey,
    credentialFinalization,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);

  const serverSessionKey = opaque.serverLoginFinish({
    serverLogin,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test('full registration & login with bad password', () => {
  const userIdentifier = 'user123';

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    'hunter42'
  );
  const { clientLogin, credentialRequest } =
    opaque.clientLoginStart('hunter42');

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password: 'hunter23',
  });

  expect(loginResult).toBeUndefined();
});

test('full registration & login flow with mismatched custom client identifier on server login', () => {
  const userIdentifier = 'user123';
  const client = 'client123';
  const password = 'hunter2';

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    password,
    { client }
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
    identifiers: {
      client,
    },
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      client: client + 'abc',
    },
  });

  expect(loginResult).toBeUndefined();
});

test('full registration & login attempt with mismatched server identifier', () => {
  const userIdentifier = 'client123';
  const password = 'hunter2';

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    password,
    { server: 'server-ident' }
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    passwordFile,
    credentialRequest,
    userIdentifier,
    identifiers: {
      server: 'server-ident-abc',
    },
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      server: 'server-ident',
    },
  });

  expect(loginResult).toBeUndefined();
});

export const Tests: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const allTestsPassed =
    testResults && !testResults.some((testEntry) => !testEntry.success);

  useEffect(() => {
    runTests().then((results) => {
      if (results.some((t) => !t.success)) {
        console.error(results);
      }
      setTestResults(results);
    });
  }, []);

  return (
    <View>
      {allTestsPassed != null && (
        <Text>{allTestsPassed ? 'Tests passed' : 'Tests failed'}</Text>
      )}
      {testResults &&
        testResults.map((result) => {
          return (
            <View key={result.test.id}>
              <Text>
                {!result.success ? '❌' : '✅'}
                {result.test.description}
              </Text>
              {!result.success && <Text>{'' + result.error}</Text>}
              {!result.success &&
                typeof result.error === 'object' &&
                result.error &&
                'stack' in result.error && <Text>{result.error.stack}</Text>}
            </View>
          );
        })}
    </View>
  );
};
