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

declare function jsi_multiply(input: Foobar): Foobar;

export function multiply(input: Foobar): Foobar {
  return jsi_multiply(input);
}
