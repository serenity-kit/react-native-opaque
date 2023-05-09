import { NativeModules } from 'react-native';

const Opaque = NativeModules.Opaque;

if (Opaque && typeof Opaque.install === 'function') {
  console.log('calling Opaque.install');
  Opaque.install();
} else if (!Opaque) {
  console.warn('Opaque module not defined');
} else {
  console.warn('Opaque.install not a function');
}

type Foobar = {
  foo: string;
  bar: string;
};

declare function opaque_foobar(input: Foobar): Foobar;

type ClientRegistrationStartResult = {
  clientRegistration: string;
  registrationRequest: string;
};

declare function opaque_clientRegistrationStart(
  password: string
): ClientRegistrationStartResult;

export function foobar(input: Foobar): Foobar {
  return opaque_foobar(input);
}

export function clientRegistrationStart(
  password: string
): ClientRegistrationStartResult {
  return opaque_clientRegistrationStart(password);
}
