use std::fmt;

use argon2::Argon2;
use base64::{engine::general_purpose as b64, Engine as _};
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{ciphersuite::CipherSuite, errors::ProtocolError};
use opaque_ke::{
    ClientLogin, ClientLoginFinishParameters, ClientRegistration,
    ClientRegistrationFinishParameters, CredentialFinalization, CredentialRequest,
    CredentialResponse, Identifiers, RegistrationRequest, RegistrationResponse, ServerLogin,
    ServerLoginStartParameters, ServerRegistration, ServerSetup,
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

    struct OpaqueStartClientRegistrationParams {
        password: String,
    }

    struct OpaqueStartClientRegistrationResult {
        client_registration_state: String,
        registration_request: String,
    }

    struct OpaqueFinishClientRegistrationParams {
        password: String,
        registration_response: String,
        client_registration_state: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueFinishClientRegistrationResult {
        registration_record: String,
        export_key: String,
        server_static_public_key: String,
    }

    struct OpaqueStartClientLoginParams {
        password: String,
    }

    struct OpaqueStartClientLoginResult {
        client_login_state: String,
        start_login_request: String,
    }

    struct OpaqueFinishClientLoginParams {
        client_login_state: String,
        login_response: String,
        password: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueFinishClientLoginResult {
        finish_login_request: String,
        session_key: String,
        export_key: String,
        server_static_public_key: String,
    }

    struct OpaqueCreateServerRegistrationResponseParams {
        server_setup: String,
        user_identifier: String,
        registration_request: String,
    }

    struct OpaqueCreateServerRegistrationResponseResult {
        registration_response: String,
    }

    struct OpaqueStartServerLoginParams {
        server_setup: String,
        registration_record: Vec<String>,
        start_login_request: String,
        user_identifier: String,
        client_identifier: Vec<String>,
        server_identifier: Vec<String>,
    }

    struct OpaqueStartServerLoginResult {
        server_login_state: String,
        login_response: String,
    }

    struct OpaqueFinishServerLoginParams {
        server_login_state: String,
        finish_login_request: String,
    }

    struct OpaqueFinishServerLoginResult {
        session_key: String,
    }

    extern "Rust" {
        fn opaque_start_client_registration(
            params: OpaqueStartClientRegistrationParams,
        ) -> Result<OpaqueStartClientRegistrationResult>;

        fn opaque_finish_client_registration(
            params: OpaqueFinishClientRegistrationParams,
        ) -> Result<OpaqueFinishClientRegistrationResult>;

        fn opaque_start_client_login(
            params: OpaqueStartClientLoginParams,
        ) -> Result<OpaqueStartClientLoginResult>;

        fn opaque_finish_client_login(
            params: OpaqueFinishClientLoginParams,
        ) -> Result<UniquePtr<OpaqueFinishClientLoginResult>>;

        fn opaque_create_server_setup() -> String;

        fn opaque_get_server_public_key(data: String) -> Result<String>;

        fn opaque_create_server_registration_response(
            params: OpaqueCreateServerRegistrationResponseParams,
        ) -> Result<OpaqueCreateServerRegistrationResponseResult>;

        fn opaque_start_server_login(
            params: OpaqueStartServerLoginParams,
        ) -> Result<OpaqueStartServerLoginResult>;

        fn opaque_finish_server_login(
            params: OpaqueFinishServerLoginParams,
        ) -> Result<OpaqueFinishServerLoginResult>;
    }
}

use opaque_ffi::{
    OpaqueCreateServerRegistrationResponseParams, OpaqueCreateServerRegistrationResponseResult,
    OpaqueFinishClientLoginParams, OpaqueFinishClientLoginResult,
    OpaqueFinishClientRegistrationParams, OpaqueFinishClientRegistrationResult,
    OpaqueFinishServerLoginParams, OpaqueFinishServerLoginResult, OpaqueStartClientLoginParams,
    OpaqueStartClientLoginResult, OpaqueStartClientRegistrationParams,
    OpaqueStartClientRegistrationResult, OpaqueStartServerLoginParams,
    OpaqueStartServerLoginResult,
};

fn opaque_create_server_setup() -> String {
    let mut rng: OsRng = OsRng;
    let setup = ServerSetup::<DefaultCipherSuite>::new(&mut rng);
    BASE64.encode(setup.serialize())
}

fn opaque_get_server_public_key(data: String) -> Result<String, Error> {
    let server_setup = decode_server_setup(data)?;
    let pub_key = server_setup.keypair().public().serialize();
    Ok(BASE64.encode(pub_key))
}

fn opaque_create_server_registration_response(
    params: OpaqueCreateServerRegistrationResponseParams,
) -> Result<OpaqueCreateServerRegistrationResponseResult, Error> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_request_bytes =
        base64_decode("registrationRequest", params.registration_request)?;
    let server_registration_start_result = ServerRegistration::<DefaultCipherSuite>::start(
        &server_setup,
        RegistrationRequest::deserialize(&registration_request_bytes)
            .map_err(from_protocol_error("deserialize registrationRequest"))?,
        params.user_identifier.as_bytes(),
    )
    .map_err(from_protocol_error("start serverRegistration"))?;
    let registration_response_bytes = server_registration_start_result.message.serialize();
    Ok(OpaqueCreateServerRegistrationResponseResult {
        registration_response: BASE64.encode(registration_response_bytes),
    })
}

fn opaque_start_server_login(
    params: OpaqueStartServerLoginParams,
) -> Result<OpaqueStartServerLoginResult, Error> {
    let server_setup = decode_server_setup(params.server_setup)?;
    let registration_record_param = get_optional_string(params.registration_record)?;
    let registration_record_bytes = match registration_record_param {
        Some(pw) => base64_decode("registrationRecord", pw).map(Some),
        None => Ok(None),
    }?;
    let credential_request_bytes = base64_decode("startLoginRequest", params.start_login_request)?;

    let mut rng: OsRng = OsRng;

    let registration_record = match registration_record_bytes.as_ref() {
        Some(bytes) => Some(
            ServerRegistration::<DefaultCipherSuite>::deserialize(bytes)
                .map_err(from_protocol_error("deserialize registrationRecord"))?,
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
        registration_record,
        CredentialRequest::deserialize(&credential_request_bytes)
            .map_err(from_protocol_error("deserialize startLoginRequest"))?,
        params.user_identifier.as_bytes(),
        start_params,
    )
    .map_err(from_protocol_error("start server login"))?;

    let login_response = BASE64.encode(server_login_start_result.message.serialize());
    let server_login_state = BASE64.encode(server_login_start_result.state.serialize());

    let result = OpaqueStartServerLoginResult {
        server_login_state,
        login_response,
    };
    Ok(result)
}

fn opaque_finish_server_login(
    params: OpaqueFinishServerLoginParams,
) -> Result<OpaqueFinishServerLoginResult, Error> {
    let credential_finalization_bytes =
        base64_decode("finishLoginRequest", params.finish_login_request)?;
    let state_bytes = base64_decode("serverLoginState", params.server_login_state)?;
    let state = ServerLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize serverLoginState"))?;
    let server_login_finish_result = state
        .finish(
            CredentialFinalization::deserialize(&credential_finalization_bytes)
                .map_err(from_protocol_error("deserialize finishLoginRequest"))?,
        )
        .map_err(from_protocol_error("finish server login"))?;
    Ok(OpaqueFinishServerLoginResult {
        session_key: BASE64.encode(server_login_finish_result.session_key),
    })
}

fn decode_server_setup(data: String) -> Result<ServerSetup<DefaultCipherSuite>, Error> {
    base64_decode("serverSetup", data).and_then(|bytes| {
        ServerSetup::<DefaultCipherSuite>::deserialize(&bytes)
            .map_err(from_protocol_error("deserialize serverSetup"))
    })
}

fn opaque_start_client_registration(
    params: OpaqueStartClientRegistrationParams,
) -> Result<OpaqueStartClientRegistrationResult, Error> {
    let mut client_rng = OsRng;

    let client_registration_start_result = ClientRegistration::<DefaultCipherSuite>::start(
        &mut client_rng,
        params.password.as_bytes(),
    )
    .map_err(from_protocol_error("start client registration"))?;

    let result = opaque_ffi::OpaqueStartClientRegistrationResult {
        client_registration_state: BASE64
            .encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(client_registration_start_result.message.serialize()),
    };
    Ok(result)
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

fn opaque_finish_client_registration(
    params: OpaqueFinishClientRegistrationParams,
) -> Result<OpaqueFinishClientRegistrationResult, Error> {
    let registration_response_bytes =
        base64_decode("registrationResponse", params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let client_registration =
        base64_decode("clientRegistrationState", params.client_registration_state)?;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&client_registration)
        .map_err(from_protocol_error("deserialize clientRegistrationState"))?;

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
        .map_err(from_protocol_error("finish client registration"))?;

    let message_bytes = client_finish_registration_result.message.serialize();
    let result = OpaqueFinishClientRegistrationResult {
        registration_record: BASE64.encode(message_bytes),
        export_key: BASE64.encode(client_finish_registration_result.export_key),
        server_static_public_key: BASE64
            .encode(client_finish_registration_result.server_s_pk.serialize()),
    };
    Ok(result)
}

fn opaque_start_client_login(
    params: OpaqueStartClientLoginParams,
) -> Result<OpaqueStartClientLoginResult, Error> {
    let mut client_rng = OsRng;
    let client_login_start_result =
        ClientLogin::<DefaultCipherSuite>::start(&mut client_rng, params.password.as_bytes())
            .map_err(from_protocol_error("start clientLogin"))?;

    let result = OpaqueStartClientLoginResult {
        client_login_state: BASE64.encode(client_login_start_result.state.serialize()),
        start_login_request: BASE64.encode(client_login_start_result.message.serialize()),
    };
    Ok(result)
}

fn opaque_finish_client_login(
    params: OpaqueFinishClientLoginParams,
) -> Result<cxx::UniquePtr<OpaqueFinishClientLoginResult>, Error> {
    let credential_response_bytes = base64_decode("loginResponse", params.login_response)?;
    let state_bytes = base64_decode("clientLoginState", params.client_login_state)?;
    let state = ClientLogin::<DefaultCipherSuite>::deserialize(&state_bytes)
        .map_err(from_protocol_error("deserialize clientLoginState"))?;

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
            .map_err(from_protocol_error("deserialize loginResponse"))?,
        finish_params,
    );

    if result.is_err() {
        // Client-detected login failure
        return Ok(cxx::UniquePtr::null());
    }
    let client_login_finish_result = result.unwrap();

    let result = OpaqueFinishClientLoginResult {
        finish_login_request: BASE64.encode(client_login_finish_result.message.serialize()),
        session_key: BASE64.encode(client_login_finish_result.session_key),
        export_key: BASE64.encode(client_login_finish_result.export_key),
        server_static_public_key: BASE64.encode(client_login_finish_result.server_s_pk.serialize()),
    };

    Ok(cxx::UniquePtr::new(result))
}
