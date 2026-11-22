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

This library implements [RFC 9807](https://www.rfc-editor.org/rfc/rfc9807.html) OPAQUE through [opaque-ke](https://github.com/facebook/opaque-ke) 4, and works with servers running [@serenity-kit/opaque](https://github.com/serenity-kit/opaque) 1.x. Versions before RFC 9807 used a draft of the protocol, so registrations made with them can't be used to log in after upgrading.

### Key stretching

`client.finishRegistration` and `client.finishLogin` take the same `keyStretching` option as @serenity-kit/opaque:

| Value | Argon2id setting |
| --- | --- |
| left out, or `'memory-constrained'` | 3 iterations, 2^16 KiB (64 MiB), 4 lanes |
| `'rfc-recommended'` | 1 iteration, 2^21-1 KiB (about 2 GiB), 4 lanes |
| `'rfc-draft-recommended'` | deprecated; the same as `'rfc-recommended'` |
| `{ 'argon2id-custom': { memory, iterations, parallelism } }` | your own setting; `memory` is in KiB |

Use the same setting for registration and every login, on every client, or logins fail. `'rfc-recommended'` needs about 2 GiB of memory, which many phones can't spare.

```js
const { registrationRecord } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
  keyStretching: 'memory-constrained',
});
```

### P-256

The optional `p256` Rust feature has been updated to opaque-ke 4 and is meant to match @serenity-kit/opaque-p256, but it is untested: the interop tests cover only the default cipher suite.

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

In depth documentation can be found at [https://opaque-auth.com/](https://opaque-auth.com/).

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
