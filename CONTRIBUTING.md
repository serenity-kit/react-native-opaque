# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Rust Setup

```bash
cd rust
cargo install cxxbridge-cmd    # (if not installed already)
rustup target add x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim # (if on macOS and not installed already)
rustup target add i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi # (if not installed already)
./build-all.sh                 # (inside the rust directory)
```

To pass additional arguments to cargo you can set the `EXTRA_ARGS` env variable.
For example, to do a release build with p256 feature:

```bash
EXTRA_ARGS="--features p256" ./build-all.sh
```

We use the cxx crate to generate the glue code to expose a C++ interface from rust.
The cxx crate itself includes a C++ build step in its own build script.
Unfortunately cross-compilation for Android requires special care to use the NDK toolchain and it is currently not possible to set up target specific environment variables in a cargo config.
Therefore the rust project needs to be built with a separate build script `build-all.sh` (or `build-all.bat` on Windows).

Since the C++ code generated by cxx further needs to be included by our XCode or Gradle+CMake build we use the `rust/gen-cxx.sh` script to invoke the `cxxbridge` command to generate the C++ source.
This requires the `cxxbridge-cmd` cargo package to be installed (`cargo install cxxbridge-cmd`).
Note that the `gen-cxx` script will be run at the end of `build-all` so you don't need to run it manually.

## Development workflow

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> While it's possible to use [`npm`](https://github.com/npm/cli), the tooling is built around [`yarn`](https://classic.yarnpkg.com/), so you'll have an easier time if you use `yarn` for development.

While developing, you can run the [example app](/example/) to test your changes. Any changes you make in your library's JavaScript code will be reflected in the example app without a rebuild. If you change any native code, then you'll need to rebuild the example app.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

You need the emulator to run beforehand. This can be done using:

```sh
emulator -list-avds
emulator -adv <name_from_the_list>
```

To run the example app on iOS:

```sh
yarn example ios
```

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

To edit the Objective-C or Swift files, open `example/ios/OpaqueExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > react-native-opaque`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-opaque` under `Android`.

## File Structure

Directory overview:

```
/
  cpp/
    opaque-rust.cpp            # generated from cxxbridge
    opaque-rust.h
    react-native-opaque.cpp    # JSI bindings for the opaque_rust C++ interface
    react-native-opaque.h

  rust/
    src/lib.rs                 # Rust source
    build-android.{sh,bat}     # Build library for given android target
    build-all.{sh,bat}         # Build all targets (only android on windows)
    gen-cxx.{sh,bat}           # Generate cxx source

  android/
    CMakeLists.txt             # the build config where we set up the C++ source and link with the Rust lib
    cpp-adapter.cpp            # defines the JNI "initialize" function which installs opaque JSI functions

  react-native-opaque.podspec  # build config for iOS to include the C++ and link with Rust lib
```

### iOS Build

The podspec uses the `pod_target_xcconfig` setting to set up appropriate `LIBRARY_SEARCH_PATHS` and `LIBTOOLFLAGS` to link with the rust library and includes the `ios/` and `cpp/` source in the build.

After the rust library is built you can run

```bash
yarn example ios
```

as usual in the project root to build and run the iOS example app.

### Android Build

The `CMakeLists.txt` includes the `cpp/` source and links with the appropriate rust library target depending on the target arch.

After the rust library is built you can run

```bash
# list our emulators e.g. emulator -list-avds
# start the emulator e.g. emulator @Pixel_3a_API_33_arm64-v8a
yarn example android
```

as usual in the project root to build and run the Android example app.

### Module initialization

On both iOS and Android we define a react native module with a single `install` function (`ios/Opaque.mm` and `android/src/main/java/com/opaque/OpaqueModule.java`).
This install function is called when the module is imported on the JavaScript side which then calls the `installOpaque` function (in `cpp/react-native-opaque.cpp`) to register the opaque JSI functions.
On Android we need the additional `cpp-adapter.cpp` which defines a JNI function `initialize` which can be called from the Java side to indirectly call the `installOpaque` function on the native C++ side.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### P256 Release

Follow these steps:

1. Sync the fork at [https://github.com/serenity-kit/react-native-opaque-p256](https://github.com/serenity-kit/react-native-opaque-p256)
2. Run the built script with `EXTRA_ARGS="--features p256" ./build-all.sh`
3. Run `yarn publish` to publish the new version to npm.

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn bootstrap`: setup project by installing all dependencies and pods.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
