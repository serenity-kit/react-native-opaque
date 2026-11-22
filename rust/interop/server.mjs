// One command per line on stdin (arguments split on spaces, so test passwords have none), one answer per line on
// stdout. Used only by rust/src/interop_tests.rs. Everything is throwaway: a fresh server setup, test passwords,
// nothing written anywhere.
import * as opaque from "@serenity-kit/opaque";
import { createInterface } from "node:readline";

await opaque.ready;
const serverSetup = opaque.server.createSetup();
const records = new Map();
const logins = new Map();

// "default" (or nothing) leaves keyStretching out, "custom:<memory>:<iterations>:<parallelism>" is
// argon2id-custom, and anything else is a preset name.
const keyStretching = (arg) => {
  if (arg === undefined || arg === "default") return undefined;
  if (arg.startsWith("custom:")) {
    const [memory, iterations, parallelism] = arg.slice("custom:".length).split(":").map(Number);
    return { "argon2id-custom": { memory, iterations, parallelism } };
  }
  return arg;
};

const commands = {
  version: () => (opaque.server.getPublicKey(serverSetup).length ? "ready" : "broken"),
  register_start: (user, registrationRequest) =>
    opaque.server.createRegistrationResponse({ serverSetup, userIdentifier: user, registrationRequest })
      .registrationResponse,
  register_finish: (user, record) => {
    records.set(user, record);
    return "ok";
  },
  login_start: (user, startLoginRequest) => {
    const { serverLoginState, loginResponse } = opaque.server.startLogin({
      serverSetup,
      userIdentifier: user,
      registrationRecord: records.get(user),
      startLoginRequest,
    });
    logins.set(user, serverLoginState);
    return loginResponse;
  },
  login_finish: (user, finishLoginRequest) =>
    opaque.server.finishLogin({ finishLoginRequest, serverLoginState: logins.get(user) }).sessionKey,
  // The server library's own client, standing in for another device with the same account.
  js_register: (user, password, ksf) => {
    const { clientRegistrationState, registrationRequest } = opaque.client.startRegistration({ password });
    const { registrationResponse } = opaque.server.createRegistrationResponse({
      serverSetup,
      userIdentifier: user,
      registrationRequest,
    });
    const { registrationRecord, exportKey } = opaque.client.finishRegistration({
      clientRegistrationState,
      registrationResponse,
      password,
      keyStretching: keyStretching(ksf),
    });
    records.set(user, registrationRecord);
    return exportKey;
  },
  js_login: (user, password, ksf) => {
    const { clientLoginState, startLoginRequest } = opaque.client.startLogin({ password });
    const { serverLoginState, loginResponse } = opaque.server.startLogin({
      serverSetup,
      userIdentifier: user,
      registrationRecord: records.get(user),
      startLoginRequest,
    });
    const result = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
      keyStretching: keyStretching(ksf),
    });
    if (!result) return "rejected";
    const { sessionKey } = opaque.server.finishLogin({
      finishLoginRequest: result.finishLoginRequest,
      serverLoginState,
    });
    return sessionKey === result.sessionKey ? result.exportKey : "session_keys_differ";
  },
};

for await (const line of createInterface({ input: process.stdin })) {
  const [name, ...args] = line.split(" ");
  try {
    console.log(commands[name](...args));
  } catch (e) {
    console.log("error:" + String(e?.message ?? e).replace(/\s+/g, " "));
  }
}
