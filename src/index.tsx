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

export const clientRegistrationStart = opaque_clientRegistrationStart;

type ClientRegistrationFinishParamsCommon = {
  password: string;
  registrationResponse: string;
  clientRegistration: string;
  clientIdentifier: string;
};

type ClientRegistrationFinishParams = ClientRegistrationFinishParamsCommon & {
  serverIdentifier?: string;
};

type ClientRegistrationFinishParamsInternal =
  ClientRegistrationFinishParamsCommon & {
    serverIdentifier: [] | [string];
  };

type ClientRegistrationFinishResult = {
  registrationUpload: string;
  exportKey: string;
  serverStaticPublicKey: string;
};

declare function opaque_clientRegistrationFinish(
  finishParams: ClientRegistrationFinishParamsInternal
): ClientRegistrationFinishResult;

export function clientRegistrationFinish({
  serverIdentifier,
  ...baseParams
}: ClientRegistrationFinishParams): ClientRegistrationFinishResult {
  const params: ClientRegistrationFinishParamsInternal = {
    ...baseParams,
    serverIdentifier: serverIdentifier ? [serverIdentifier] : [],
  };
  return opaque_clientRegistrationFinish(params);
}

type ClientLoginStartResult = {
  clientLogin: string;
  credentialRequest: string;
};

declare function opaque_clientLoginStart(
  password: string
): ClientLoginStartResult;

export const clientLoginStart = opaque_clientLoginStart;

type ClientLoginFinishParams = {
  clientLogin: string;
  credentialResponse: string;
  password: string;
  clientIdentifier: string;
  // serverIdentifier?: string; TODO
};

type ClientLoginFinishResult = {
  credentialFinalization: string;
  sessionKey: string;
  exportKey: string;
  serverStaticPublicKey: string;
};

declare function opaque_clientLoginFinish(
  params: ClientLoginFinishParams
): ClientLoginFinishResult;

export const clientLoginFinish = opaque_clientLoginFinish;
