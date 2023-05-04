import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { multiply } from 'react-native-opaque';

export default function App() {
  const foobar = multiply({ foo: 'afoo', bar: 'abar' });
  console.log(foobar);
  return (
    <View style={styles.container}>
      <Text>Result: none</Text>
      <Text>
        Result: foo = {foobar.foo} bar = {foobar.bar}
      </Text>
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
