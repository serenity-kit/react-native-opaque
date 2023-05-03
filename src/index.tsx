import { NativeModules } from 'react-native';

const Opaque = NativeModules.Opaque;

if (Opaque && typeof Opaque.install === 'function') {
  Opaque.install();
}

type Foobar = {
  foo: string;
  bar: string;
};

declare function jsi_multiply(input: Foobar): Foobar;

export function multiply(input: Foobar): Foobar {
  return jsi_multiply(input);
}
