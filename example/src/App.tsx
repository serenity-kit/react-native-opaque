import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import * as opaque from 'react-native-opaque';

export default function App() {
  const foobar = opaque.foobar({ foo: 'FO', bar: 'BA' });
  console.log(foobar);
  const clientRegStart = opaque.clientRegistrationStart('hunter2');
  console.log(clientRegStart);
  return (
    <View style={styles.container}>
      <Text>Result: none</Text>
      <Text>
        Result: foo = {foobar.foo} bar = {foobar.bar}
      </Text>
      <Text>ClientRegStart = {JSON.stringify(clientRegStart)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
