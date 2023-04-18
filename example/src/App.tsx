import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { multiply } from 'react-native-opaque';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Result: none</Text>
      <Text>Result: {multiply(22)}</Text>
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
