use std::fmt;

use argon2::Argon2;
use base64::{engine::general_purpose as b64, Engine as _};
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{ciphersuite::CipherSuite, errors::ProtocolError};
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientRegistration,
    ClientRegistrationFinishParameters, CredentialFinalization, CredentialRequest,
    CredentialResponse, Identifiers, RegistrationRequest, RegistrationResponse, RegistrationUpload,
    ServerLogin, ServerLoginStartParameters, ServerRegistration, ServerSetup,
};

struct DefaultCipherSuite;

#[cfg(not(feature = "p256"))]
impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;
    type Ksf = Argon2<'static>;
}

#[cfg(feature = "p256")]
impl CipherSuite for DefaultCipherSuite {
    type OprfCs = p256::NistP256;
    type KeGroup = p256::NistP256;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;
    type Ksf = Argon2<'static>;
}

enum Error {
    Input {
        message: String,
    },
    Protocol {
        context: &'static str,
        error: ProtocolError,
    },
    Base64 {
        context: &'static str,
        error: base64::DecodeError,
    },
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Input { message } => {
                write!(f, "{}", message)
            }
            Error::Protocol { context, error } => {
                write!(f, "opaque protocol error at \"{}\"; {}", context, error)
            }
            Error::Base64 { context, error } => {
                write!(f, "base64 decoding failed at \"{}\"; {}", context, error)
            }
        }
    }
}

fn from_base64_error(context: &'static str) -> impl Fn(base64::DecodeError) -> Error {
    move |error| Error::Base64 { context, error }
}

fn from_protocol_error(context: &'static str) -> impl Fn(ProtocolError) -> Error {
    move |error| Error::Protocol { context, error }
}

const BASE64: b64::GeneralPurpose = b64::URL_SAFE_NO_PAD;

type OpaqueResult<T> = Result<T, Error>;

fn base64_decode<T: AsRef<[u8]>>(context: &'static str, input: T) -> OpaqueResult<Vec<u8>> {
    BASE64.decode(input).map_err(from_base64_error(context))
}

#[cxx::bridge]
mod opaque_ffi {
    struct OpaqueClientRegistrationStartResult {
        client_registration: String,
        registration_request: String,
    }

    struct OpaqueClientRegistrationFinishParams {
        password: String,
        registration_response: String,
        client_registration: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueClientRegistrationFinishResult {
        registration_upload: String,
        export_key: String,
        server_static_public_key: String,
    }

    struct OpaqueClientLoginStartResult {
        client_login: String,
        credential_request: String,
    }

    struct OpaqueClientLoginFinishParams {
        client_login: String,
        credential_response: String,
        password: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueClientLoginFinishResult {
        credential_finalization: String,
        session_key: String,
        export_key: String,
        server_static_public_key: String,
    }

    struct OpaqueServerRegistrationStartParams {
        server_setup: String,
        credential_identifier: String,
        registration_request: String,
    }

    struct OpaqueServerLoginStartParams {
        server_setup: String,
        password_file: Vec<String>,
        credential_request: String,
        credential_identifier: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueServerLoginStartResult {
        server_login: String,
        credential_response: String,
    }

    struct OpaqueServerLoginFinishParams {
        server_login: String,
        credential_finalization: String,
    }

    extern "Rust" {
        fn opaque_client_registration_start(
            password: String,
        ) -> Result<OpaqueClientRegistrationStartResult>;

        fn opaque_client_registration_finish(
            params: OpaqueClientRegistrationFinishParams,
        ) -> Result<OpaqueClientRegistrationFinishResult>;

        fn opaque_client_login_start(password: String) -> Result<OpaqueClientLoginStartResult>;

        fn opaque_client_login_finish(
            params: OpaqueClientLoginFinishParams,
        ) -> Result<UniquePtr<OpaqueClientLoginFinishResult>>;

        fn opaque_create_server_setup() -> String;

        fn opaque_server_registration_start(
            params: OpaqueServerRegistrationStartParams,
        ) -> Result<String>;

        fn opaque_server_registration_finish(message: String) -> Result<String>;

        fn opaque_server_login_start(
            params: OpaqueServerLoginStartParams,
        ) -> Result<OpaqueServerLoginStartResult>;

        fn opaque_server_login_finish(params: OpaqueServerLoginFinishParams) -> Result<String>;
    }
}

use opaque_ffi::{
    OpaqueClientLoginFinishParams, OpaqueClientLoginFinishResult, OpaqueClientLoginStartResult,
    OpaqueClientRegistrationFinishParams, OpaqueClientRegistrationFinishResult,
    OpaqueClientRegistrationStartResult, OpaqueServerLoginFinishParams,
    OpaqueServerLoginStartParams, OpaqueServerLoginStartResult,
    OpaqueServerRegistrationStartParams,
};

fn opaque_create_server_setup() -> String {
    let mut rng: OsRng = OsRng;
    let setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    return BASE64.encode(setup.serialize());
}

fn opaque_server_registration_start(
    params: OpaqueServerRegistrationStartParams,
) -> Result<String, Error> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_request_bytes =
        base64_decode("registrationRequest", params.registration_request)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(from_protocol_error("deserialize registrationRequest"))?,
        params.credential_identifier.as_bytes(),
    )
    .map_err(from_protocol_error("start serverRegistration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();
    return Ok(BASE64.encode(registration_response_bytes));
}

fn opaque_server_registration_finish(message: String) -> Result<String, Error> {
    let message_bytes = base64_decode("message", message)?;
    let password_file = ServerRegistration::finish(
        RegistrationUpload::<DefaultCipherSuite>::deserialize(&message_bytes)
            .map_err(from_protocol_error("deserialize message"))?,
    );
    Ok(BASE64.encode(password_file.serialize()))
}

fn opaque_server_login_start(
    params: OpaqueServerLoginStartParams,
) -> Result<OpaqueServerLoginStartResult, Error> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let password_file_param = get_optional_string(params.password_file)?;
    let password_file_bytes = match password_file_param {
        Some(pw) => base64_decode("passwordFile", pw).map(|val| Some(val)),
        None => Ok(None),
    }?;
    let credential_request_bytes = base64_decode("credentialRequest", params.credential_request)?;

    let mut rng: OsRng = OsRng;

    let password_file = match password_file_bytes.as_ref() {
        Some(bytes) => Some(
            ServerRegistration::<DefaultCipherSuite>::deserialize(bytes)
                .map_err(from_protocol_error("deserialize passwordFile"))?,
        ),
        None => None,
    };

    let server_ident = get_optional_string(params.server_identifier)?;
    let client_ident = get_optional_string(params.client_identifier)?;

    let start_params = ServerLoginStartParameters {
        identifiers: Identifiers {
            client: client_ident.as_ref().map(|val| val.as_bytes()),
            server: server_ident.as_ref().map(|val| val.as_bytes()),
        },
        context: None,
    };

    let server_login_start_result = ServerLogin::start(
        &mut rng,
        &server_setup,
        password_file,
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(from_protocol_error("deserialize credentialRequest"))?,
        params.credential_identifier.as_bytes(),
        start_params,
    )
    .map_err(from_protocol_error("start serverLogin"))?;

    let credential_response = BASE64.encode(server_login_start_result.message.serialize());
    let server_login = BASE64.encode(server_login_start_result.state.serialize());

    let result = OpaqueServerLoginStartResult {
        server_login,
        credential_response,
    };
    return Ok(result);
}

fn opaque_server_login_finish(params: OpaqueServerLoginFinishParams) -> Result<String, Error> {
    let credential_finalization_bytes =
        base64_decode("credentialFinalization", params.credential_finalization)?;
    let state_bytes = base64_decode("serverLogin", params.server_login)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize serverLogin"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(from_protocol_error("deserialize credentialFinalization"))?,
        )
        .map_err(from_protocol_error("finish serverLogin"))?;
    return Ok(BASE64.encode(server_login_finish_result.session_key));
}

fn decode_server_setup(data: String) -> Result<ServerSetup<DefaultCipherSuite>, Error> {
    return base64_decode("serverSetup", data).and_then(|bytes| {
        ServerSetup::<DefaultCipherSuite>::deserialize(&bytes)
            .map_err(from_protocol_error("deserialize serverSetup"))
    });
}

fn opaque_client_registration_start(
    password: String,
) -> Result<OpaqueClientRegistrationStartResult, Error> {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(from_protocol_error("start clientRegistration"))?;

    let result = opaque_ffi::OpaqueClientRegistrationStartResult {
        client_registration: BASE64.encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(
            client_registration_start_result
                .message
                .serialize()
                .to_vec(),
        ),
    };
    return Ok(result);
}

fn get_optional_string(ident: Vec<String>) -> Result<Option<String>, Error> {
    match ident.len() {
        0 => Ok(None),
        1 => ident.get(0).map_or_else(
            || {
                Err(Error::Input {
                    message: "error getting value at index 0".to_string(),
                })
            },
            |x| Ok(Some(x.clone())),
        ),
        len => Err(Error::Input {
            message: format!(
                "invalid number of values, expected exactly 0 or 1 but received {}",
                len
            ),
        }),
    }
}

fn opaque_client_registration_finish(
    params: OpaqueClientRegistrationFinishParams,
) -> Result<OpaqueClientRegistrationFinishResult, Error> {
    let registration_response_bytes =
        base64_decode("registrationResponse", params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let client_registration = base64_decode("clientRegistration", params.client_registration)?;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&client_registration)
        .map_err(from_protocol_error("deserialize clientRegistration"))?;

    let server_ident = get_optional_string(params.server_identifier)?;
    let client_ident = get_optional_string(params.client_identifier)?;

    let finish_params = ClientRegistrationFinishParameters::new(
        Identifiers {
            client: client_ident.as_ref().map(|val| val.as_bytes()),
            server: server_ident.as_ref().map(|val| val.as_bytes()),
        },
        None,
    );

    let client_finish_registration_result = state
        .finish(
            &mut rng,
            params.password.as_bytes(),
            RegistrationResponse::deserialize(&registration_response_bytes)
                .map_err(from_protocol_error("deserialize registrationResponse"))?,
            finish_params,
        )
        .map_err(from_protocol_error("finish clientRegistration"))?;

    let message_bytes = client_finish_registration_result.message.serialize();
    let result = OpaqueClientRegistrationFinishResult {
        registration_upload: BASE64.encode(message_bytes.to_vec()),
        export_key: BASE64.encode(client_finish_registration_result.export_key),
        server_static_public_key: BASE64
            .encode(client_finish_registration_result.server_s_pk.serialize()),
    };
    return Ok(result);
}

fn opaque_client_login_start(password: String) -> Result<OpaqueClientLoginStartResult, Error> {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .map_err(from_protocol_error("start clientLogin"))?;

    let result = OpaqueClientLoginStartResult {
        client_login: BASE64.encode(client_login_start_result.state.serialize()),
        credential_request: BASE64.encode(client_login_start_result.message.serialize().to_vec()),
    };
    return Ok(result);
}

fn opaque_client_login_finish(
    params: OpaqueClientLoginFinishParams,
) -> Result<cxx::UniquePtr<OpaqueClientLoginFinishResult>, Error> {
    let credential_response_bytes =
        base64_decode("credentialResponse", params.credential_response)?;
    let state_bytes = base64_decode("clientLogin", params.client_login)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize clientLogin"))?;

    let server_ident = get_optional_string(params.server_identifier)?;
    let client_ident = get_optional_string(params.client_identifier)?;

    let finish_params = ClientLoginFinishParameters::new(
        None,
        Identifiers {
            client: client_ident.as_ref().map(|val| val.as_bytes()),
            server: server_ident.as_ref().map(|val| val.as_bytes()),
        },
        None,
    );

    let result = state.finish(
        params.password.as_bytes(),
        CredentialResponse::deserialize(&credential_response_bytes)
            .map_err(from_protocol_error("deserialize credentialResponse"))?,
        finish_params,
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(cxx::UniquePtr::null());
    }
    let client_login_finish_result = result.unwrap();

    let result = OpaqueClientLoginFinishResult {
        credential_finalization: BASE64.encode(client_login_finish_result.message.serialize()),
        session_key: BASE64.encode(client_login_finish_result.session_key),
        export_key: BASE64.encode(client_login_finish_result.export_key),
        server_static_public_key: BASE64.encode(client_login_finish_result.server_s_pk.serialize()),
    };

    return Ok(cxx::UniquePtr::new(result));
}
