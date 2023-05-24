import { AppRegistry, Platform } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'web') {
  AppRegistry.runApplication('OpaqueExample', {
    rootTag: document.getElementById('react-root'),
  });
}
