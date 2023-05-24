let opaqueModule: typeof import('@serenity-kit/opaque');

const isReady = import('@serenity-kit/opaque').then((newModule) => {
  opaqueModule = newModule;
});

export const serverSetup: (typeof opaqueModule)['serverSetup'] = (...args) => {
  return opaqueModule.serverSetup(...args);
};

export const clientRegistrationStart: (typeof opaqueModule)['clientRegistrationStart'] =
  (...args) => {
    return opaqueModule.clientRegistrationStart(...args);
  };

export const clientRegistrationFinish: (typeof opaqueModule)['clientRegistrationFinish'] =
  (...args) => {
    return opaqueModule.clientRegistrationFinish(...args);
  };

export const clientLoginStart: (typeof opaqueModule)['clientLoginStart'] = (
  ...args
) => {
  return opaqueModule.clientLoginStart(...args);
};

export const clientLoginFinish: (typeof opaqueModule)['clientLoginFinish'] = (
  ...args
) => {
  return opaqueModule.clientLoginFinish(...args);
};

export const serverRegistrationStart: (typeof opaqueModule)['serverRegistrationStart'] =
  (...args) => {
    return opaqueModule.serverRegistrationStart(...args);
  };

export const serverRegistrationFinish: (typeof opaqueModule)['serverRegistrationFinish'] =
  (...args) => {
    return opaqueModule.serverRegistrationFinish(...args);
  };

export const serverLoginStart: (typeof opaqueModule)['serverLoginStart'] = (
  ...args
) => {
  return opaqueModule.serverLoginStart(...args);
};

export const serverLoginFinish: (typeof opaqueModule)['serverLoginFinish'] = (
  ...args
) => {
  return opaqueModule.serverLoginFinish(...args);
};

// indicate when the module has been loaded since WASM is async
export const ready: Promise<void> = isReady;
