# react-native-opaque

React Native client for the OPAQUE Protocol

## Installation

```sh
npm install react-native-opaque
```

## Usage

```js
import * as opaque from 'react-native-opaque';

const password = 'sup-krah.42-UOI'; // user password

const { clientRegistrationState, registrationRequest } =
  opaque.client.startRegistration({ password });
// ...
```

## Usage with React Native Web

Since on web the package uses Web Assembly under the hood, it needs to be loaded asynchronously. To offer the same API the module is loaded internally, but in addition the API offers a `ready` Promise that will resolve once the module is loaded and ready to be used.

```ts
import * as opaque from 'react-native-opaque';

const password = 'sup-krah.42-UOI'; // user password

opaque.ready.then(() => {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  // ...
});
```

The most convenient way to use this is to have loading page that waits for the `ready` Promise to resolve before rendering the actual app.

For example:

```tsx
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
```

Note: The `ready` Promise resolves right away on the native side.

## Documentation

In depth documentation can be found at [https://opaque-documentation.netlify.app/](https://opaque-documentation.netlify.app/).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
