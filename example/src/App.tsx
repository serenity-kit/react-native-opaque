import * as React from 'react';

import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import * as opaque from 'react-native-opaque';

async function request(method: string, url: string, body: any = undefined) {
  console.log(`${method} ${url}`, body);
  const res = await fetch(url, {
    method,
    body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const { error } = await res.json();
    console.log(error);
    throw new Error(error);
  }
  return res;
}

async function register(
  host: string,
  credentialIdentifier: string,
  password: string
) {
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const { registrationResponse } = await request(
    'POST',
    `${host}/register/start`,
    {
      credentialIdentifier,
      registrationRequest,
    }
  ).then((res) => res.json());

  console.log('registrationResponse', registrationResponse);
  const { registrationUpload } = opaque.clientRegistrationFinish({
    clientRegistration,
    registrationResponse,
    password,
  });

  const res = await request('POST', `${host}/register/finish`, {
    credentialIdentifier,
    registrationUpload,
  });
  console.log('finish successful', res.ok);
  return res.ok;
}

async function login(
  host: string,
  credentialIdentifier: string,
  password: string
) {
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = await request('POST', `${host}/login/start`, {
    credentialIdentifier,
    credentialRequest,
  }).then((res) => res.json());

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, credentialFinalization } = loginResult;
  const res = await request('POST', `${host}/login/finish`, {
    credentialIdentifier,
    credentialFinalization,
  });
  return res.ok ? sessionKey : null;
}

function App() {
  const [host, setHost] = React.useState('http://10.0.2.2:8089');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          gap: 8,
        }}
      >
        <TextInput
          style={styles.input}
          placeholder="Host"
          defaultValue={host}
          onChangeText={(text) => setHost(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          defaultValue={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          defaultValue={password}
          onChangeText={(text) => setPassword(text)}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title="Register"
            onPress={async () => {
              try {
                const ok = await register(host, username, password);
                if (ok) {
                  Alert.alert('Successfully registered!');
                } else {
                  Alert.alert('An unknown error occurred.');
                }
              } catch (err) {
                Alert.alert('Something went wrong', '' + err);
              }
            }}
          />
          <Button
            title="Login"
            onPress={async () => {
              try {
                const res = await login(host, username, password);
                if (res) {
                  Alert.alert('Login success, session key: ' + res);
                } else {
                  Alert.alert('Login failed');
                }
              } catch (err) {
                Alert.alert('Something went wrong', '' + err);
              }
            }}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flex: 1,
          gap: 8,
        }}
      >
        <Text style={{ textAlign: 'center' }}>
          Run full flow in-memory demo {'\n'} (check console.log output)
        </Text>
        <Button
          title="Run Demo"
          onPress={() => {
            const serverSetup = opaque.serverSetup();
            runFullServerClientFlow(serverSetup, 'user123', 'hunter2');
          }}
        />
      </View>
    </View>
  );
}

export default function LoadingApp() {
  const [opaqueModuleStatus, setOpaqueModuleStatus] = React.useState<
    'loading' | 'failed' | 'loaded'
  >('loading');

  React.useEffect(() => {
    async function waitForOpaque() {
      try {
        await opaque.ready;
        setOpaqueModuleStatus('loaded');
      } catch (e) {
        console.warn(e);
        setOpaqueModuleStatus('failed');
      }
    }

    waitForOpaque();
  }, []);

  if (opaqueModuleStatus === 'loading') return null;
  if (opaqueModuleStatus === 'failed')
    return <Text>Failed to load resources. Please reload the app.</Text>;

  return <App />;
}

function runFullServerClientFlow(
  serverSetup: string,
  username: string,
  password: string
) {
  console.log('############################################');
  console.log('#                                          #');
  console.log('#   Running Demo Registration/Login Flow   #');
  console.log('#                                          #');
  console.log('############################################');

  console.log({ serverSetup, username, password });

  console.log();
  console.log('clientRegistrationStart');
  console.log('-----------------------');
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);

  console.log({ clientRegistration, registrationRequest });

  console.log();
  console.log('serverRegistrationStart');
  console.log('-----------------------');
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    registrationRequest,
    credentialIdentifier: username,
  });

  console.log({ registrationResponse });

  console.log();
  console.log('clientRegistrationFinish');
  console.log('------------------------');
  const {
    registrationUpload,
    exportKey: clientRegExportKey,
    serverStaticPublicKey: clientRegServerStaticPublicKey,
  } = opaque.clientRegistrationFinish({
    password,
    clientRegistration,
    registrationResponse,
  });

  console.log({ clientRegExportKey, clientRegServerStaticPublicKey });

  console.log();
  console.log('serverRegistrationFinish');
  console.log('------------------------');
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);

  console.log({ passwordFile });

  console.log();
  console.log('clientLoginStart');
  console.log('----------------');
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  console.log({ clientLogin, credentialRequest });

  console.log();
  console.log('serverLoginStart');
  console.log('----------------');
  const { credentialResponse, serverLogin } = opaque.serverLoginStart({
    credentialIdentifier: username,
    passwordFile,
    serverSetup,
    credentialRequest,
  });

  console.log({ credentialResponse, serverLogin });

  console.log();
  console.log('clientLoginFinish');
  console.log('-----------------');
  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  if (loginResult == null) {
    console.log('loginResult is NULL; login failed');
    return;
  }

  const {
    credentialFinalization,
    exportKey: clientLoginExportKey,
    serverStaticPublicKey: clientLoginServerStaticPublicKey,
    sessionKey: clientSessionKey,
  } = loginResult;

  console.log({
    clientLoginExportKey,
    clientSessionKey,
    clientLoginServerStaticPublicKey,
    credentialFinalization,
  });

  console.log();
  console.log('serverLoginFinish');
  console.log('-----------------');
  const serverSessionKey = opaque.serverLoginFinish({
    credentialFinalization,
    serverLogin,
  });

  console.log({ serverSessionKey });
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 4,
    width: '80%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
