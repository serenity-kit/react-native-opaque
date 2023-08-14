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

export type CustomIdentifiers = {
  client?: string;
  server?: string;
};

declare function opaque_startClientRegistration(
  params: client.StartRegistrationParams
): client.StartRegistrationResult;

declare function opaque_finishClientRegistration(
  finishParams: client.FinishRegistrationParams
): client.FinishRegistrationResult;

declare function opaque_startClientLogin(
  params: client.StartLoginParams
): client.StartLoginResult;

declare function opaque_finishClientLogin(
  params: client.FinishLoginParams
): client.FinishLoginResult | null;

export namespace client {
  export type StartRegistrationParams = {
    password: string;
  };

  export type StartRegistrationResult = {
    clientRegistrationState: string;
    registrationRequest: string;
  };

  export type FinishRegistrationParams = {
    password: string;
    registrationResponse: string;
    clientRegistrationState: string;
    identifiers?: CustomIdentifiers;
  };

  export type FinishRegistrationResult = {
    registrationRecord: string;
    exportKey: string;
    serverStaticPublicKey: string;
  };

  export type StartLoginParams = {
    password: string;
  };

  export type StartLoginResult = {
    clientLoginState: string;
    startLoginRequest: string;
  };

  export type FinishLoginParams = {
    clientLoginState: string;
    loginResponse: string;
    password: string;
    identifiers?: CustomIdentifiers;
  };

  export type FinishLoginResult = {
    finishLoginRequest: string;
    sessionKey: string;
    exportKey: string;
    serverStaticPublicKey: string;
  };

  export const startRegistration = opaque_startClientRegistration;
  export const finishRegistration = opaque_finishClientRegistration;
  export const startLogin = opaque_startClientLogin;
  export const finishLogin = opaque_finishClientLogin;
}

declare function opaque_createServerSetup(): string;

declare function opaque_getServerPublicKey(serverSetup: string): string;

declare function opaque_createServerRegistrationResponse(
  params: server.CreateRegistrationResponseParams
): server.CreateRegistrationResponseResult;

declare function opaque_startServerLogin(
  params: server.StartLoginParams
): server.StartLoginResult;

declare function opaque_finishServerLogin(
  params: server.FinishLoginParams
): server.FinishLoginResult;

export namespace server {
  export type CreateRegistrationResponseParams = {
    serverSetup: string;
    userIdentifier: string;
    registrationRequest: string;
  };

  export type CreateRegistrationResponseResult = {
    registrationResponse: string;
  };

  export type StartLoginParams = {
    serverSetup: string;
    registrationRecord: string | null | undefined;
    startLoginRequest: string;
    userIdentifier: string;
    identifiers?: CustomIdentifiers;
  };

  export type StartLoginResult = {
    serverLoginState: string;
    loginResponse: string;
  };

  export type FinishLoginParams = {
    serverLoginState: string;
    finishLoginRequest: string;
  };

  export type FinishLoginResult = {
    sessionKey: string;
  };

  export const createSetup = opaque_createServerSetup;
  export const getPublicKey = opaque_getServerPublicKey;
  export const createRegistrationResponse =
    opaque_createServerRegistrationResponse;
  export const startLogin = opaque_startServerLogin;
  export const finishLogin = opaque_finishServerLogin;
}

// needed for web version to indicate when the module has been loaded since WASM is async
export const ready = Promise.resolve();
