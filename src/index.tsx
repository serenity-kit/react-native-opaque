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

type ClientRegistrationStartResult = {
  clientRegistration: string;
  registrationRequest: string;
};

declare function opaque_clientRegistrationStart(
  password: string
): ClientRegistrationStartResult;

export function clientRegistrationStart(
  password: string
): ClientRegistrationStartResult {
  return opaque_clientRegistrationStart(password);
}

type ClientRegistrationFinishParams = {
  password: string;
  registrationResponse: string;
  clientRegistration: string;
  clientIdentifier: string;
  // serverIdentifier: string|null,
};

type ClientRegistrationFinishResult = {
  registrationUpload: string;
  exportKey: string;
  serverStaticPublicKey: string;
};

declare function opaque_clientRegistrationFinish(
  finishParams: ClientRegistrationFinishParams
): ClientRegistrationFinishResult;

export function clientRegistrationFinish(
  finishParams: ClientRegistrationFinishParams
): ClientRegistrationFinishResult {
  return opaque_clientRegistrationFinish(finishParams);
}
