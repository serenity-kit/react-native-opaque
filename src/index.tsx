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

type CustomIdentifiers = {
  client?: string;
  server?: string;
};

type ClientRegistrationStartResult = {
  clientRegistration: string;
  registrationRequest: string;
};

declare function opaque_clientRegistrationStart(
  password: string
): ClientRegistrationStartResult;

export const clientRegistrationStart = opaque_clientRegistrationStart;

type ClientRegistrationFinishParams = {
  password: string;
  registrationResponse: string;
  clientRegistration: string;
  identifiers?: CustomIdentifiers;
};

type ClientRegistrationFinishResult = {
  registrationUpload: string;
  exportKey: string;
  serverStaticPublicKey: string;
};

declare function opaque_clientRegistrationFinish(
  finishParams: ClientRegistrationFinishParams
): ClientRegistrationFinishResult;

export const clientRegistrationFinish = opaque_clientRegistrationFinish;

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
  identifiers?: CustomIdentifiers;
};

type ClientLoginFinishResult = {
  credentialFinalization: string;
  sessionKey: string;
  exportKey: string;
  serverStaticPublicKey: string;
};

declare function opaque_clientLoginFinish(
  params: ClientLoginFinishParams
): ClientLoginFinishResult | null;

export const clientLoginFinish = opaque_clientLoginFinish;

declare function opaque_serverSetup(): string;

export const serverSetup = opaque_serverSetup;

type ServerRegistrationStartParams = {
  serverSetup: string;
  credentialIdentifier: string;
  registrationRequest: string;
};

declare function opaque_serverRegistrationStart(
  params: ServerRegistrationStartParams
): string;

export const serverRegistrationStart = opaque_serverRegistrationStart;

declare function opaque_serverRegistrationFinish(message: string): string;

export const serverRegistrationFinish = opaque_serverRegistrationFinish;

type ServerLoginStartParams = {
  serverSetup: string;
  passwordFile: string | undefined;
  credentialRequest: string;
  credentialIdentifier: string;
  identifiers?: CustomIdentifiers;
};

type ServerLoginStartResult = {
  serverLogin: string;
  credentialResponse: string;
};

declare function opaque_serverLoginStart(
  params: ServerLoginStartParams
): ServerLoginStartResult;

export const serverLoginStart = opaque_serverLoginStart;

type ServerLoginFinishParams = {
  serverLogin: string;
  credentialFinalization: string;
};

declare function opaque_serverLoginFinish(
  params: ServerLoginFinishParams
): string;

export const serverLoginFinish = opaque_serverLoginFinish;
