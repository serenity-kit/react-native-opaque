import * as React from 'react';

import {
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as opaque from 'react-native-opaque';
import { Tests } from './TestResults';

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
  userIdentifier: string,
  password: string
) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const { registrationResponse } = await request(
    'POST',
    `${host}/register/start`,
    {
      userIdentifier,
      registrationRequest,
    }
  ).then((res) => res.json());

  console.log('registrationResponse', registrationResponse);
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
  });

  const res = await request('POST', `${host}/register/finish`, {
    userIdentifier,
    registrationRecord,
  });
  console.log('finish successful', res.ok);
  return res.ok;
}

async function login(host: string, userIdentifier: string, password: string) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = await request('POST', `${host}/login/start`, {
    userIdentifier,
    startLoginRequest,
  }).then((res) => res.json());

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, finishLoginRequest } = loginResult;
  const res = await request('POST', `${host}/login/finish`, {
    userIdentifier,
    finishLoginRequest,
  });
  return res.ok ? sessionKey : null;
}

function showAlertMsg(msg: string) {
  if (Platform.OS === 'web') {
    if ('alert' in global && typeof global.alert === 'function') {
      global.alert(msg);
    } else {
      console.error('no alert on global');
    }
  } else {
    Alert.alert(msg);
  }
}

function App() {
  const [host, setHost] = React.useState('http://10.0.2.2:8089');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <ScrollView>
      <View style={styles.container}>
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
                  showAlertMsg(`User "${username}" registered successfully`);
                } else {
                  showAlertMsg('An unknown error occurred.');
                }
              } catch (err) {
                showAlertMsg('Something went wrong' + `\n` + err);
              }
            }}
          />
          <Button
            title="Login"
            onPress={async () => {
              try {
                const res = await login(host, username, password);
                if (res) {
                  showAlertMsg(
                    `User "${username}" logged in successfully\nSession key: ${res}`
                  );
                } else {
                  showAlertMsg('Login failed');
                }
              } catch (err) {
                showAlertMsg('Something went wrong' + `\n` + err);
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
            const serverSetup = opaque.server.createSetup();
            runFullServerClientFlow(serverSetup, 'user123', 'hunter2');
          }}
        />
      </View>
      <Tests />
    </ScrollView>
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
  console.log('client.startRegistration');
  console.log('-----------------------');
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });

  console.log({ clientRegistrationState, registrationRequest });

  console.log();
  console.log('server.createRegistrationResponse');
  console.log('-----------------------');
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup,
    registrationRequest,
    userIdentifier: username,
  });

  console.log({ registrationResponse });

  console.log();
  console.log('client.finishRegistration');
  console.log('------------------------');
  const {
    registrationRecord,
    exportKey: clientRegExportKey,
    serverStaticPublicKey: clientRegServerStaticPublicKey,
  } = opaque.client.finishRegistration({
    password,
    clientRegistrationState,
    registrationResponse,
  });

  console.log({
    clientRegExportKey,
    clientRegServerStaticPublicKey,
    registrationRecord,
  });

  console.log();
  console.log('client.startLogin');
  console.log('----------------');
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  console.log({ clientLoginState, startLoginRequest });

  console.log();
  console.log('server.startLogin');
  console.log('----------------');
  const { loginResponse, serverLoginState } = opaque.server.startLogin({
    userIdentifier: username,
    registrationRecord,
    serverSetup,
    startLoginRequest,
  });

  console.log({ loginResponse, serverLoginState });

  console.log();
  console.log('client.finishLogin');
  console.log('-----------------');
  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });

  if (loginResult == null) {
    console.log('loginResult is NULL; login failed');
    return;
  }

  const {
    finishLoginRequest,
    exportKey: clientLoginExportKey,
    serverStaticPublicKey: clientLoginServerStaticPublicKey,
    sessionKey: clientSessionKey,
  } = loginResult;

  console.log({
    clientLoginExportKey,
    clientSessionKey,
    clientLoginServerStaticPublicKey,
    finishLoginRequest,
  });

  console.log();
  console.log('server.finishLogin');
  console.log('-----------------');
  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
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
