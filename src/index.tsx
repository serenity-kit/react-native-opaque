import { NativeModules } from 'react-native';

const Opaque = NativeModules.Opaque;

if (Opaque && typeof Opaque.install === 'function') {
  Opaque.install();
}

declare function jsi_multiply(a: number): number;

export function multiply(a: number): number {
  return jsi_multiply(a);
}
