import * as React from 'react';

import {
  Alert,
  Button,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as opaque from 'react-native-opaque';

const host = 'http://10.0.2.2:8089';

async function request(method: string, path: string, body: any = undefined) {
  console.log(`${method} ${host}${path}`, body);
  const res = await fetch(`${host}${path}`, {
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

async function register(clientIdentifier: string, password: string) {
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const { registrationResponse } = await request('POST', `/register/start`, {
    clientIdentifier,
    registrationRequest,
  }).then((res) => res.json());

  console.log('registrationResponse', registrationResponse);
  const { registrationUpload } = opaque.clientRegistrationFinish({
    clientIdentifier,
    clientRegistration,
    registrationResponse,
    password,
  });

  const res = await request('POST', `/register/finish`, {
    clientIdentifier,
    registrationUpload,
  });
  console.log('finish successful', res.ok);
  return res.ok;
}

export default function App() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <View style={styles.container}>
      <StatusBar />
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
              const ok = await register(username, password);
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
        <Button title="Login" disabled></Button>
      </View>
    </View>
  );
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
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
