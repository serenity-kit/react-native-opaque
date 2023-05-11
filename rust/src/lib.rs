use std::fmt;

use argon2::Argon2;
use base64::{engine::general_purpose as b64, Engine as _};
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::{ciphersuite::CipherSuite, errors::ProtocolError};
use opaque_ke::{
    ClientRegistration, ClientRegistrationFinishParameters, Identifiers, RegistrationResponse,
};

struct DefaultCipherSuite;

impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
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

    pub struct OpaqueClientRegistrationFinishParams {
        password: String,
        registration_response: String,
        client_registration: String,
        client_identifier: String,
        server_identifier: Vec<String>,
    }

    pub struct OpaqueClientRegistrationFinishResult {
        registration_upload: String,
        export_key: String,
        server_static_public_key: String,
    }

    extern "Rust" {
        fn opaque_client_registration_start(
            password: String,
        ) -> Result<OpaqueClientRegistrationStartResult>;

        fn opaque_client_registration_finish(
            params: OpaqueClientRegistrationFinishParams,
        ) -> Result<OpaqueClientRegistrationFinishResult>;
    }
}

use opaque_ffi::{
    OpaqueClientRegistrationFinishParams, OpaqueClientRegistrationFinishResult,
    OpaqueClientRegistrationStartResult,
};

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

fn opaque_client_registration_finish(
    params: OpaqueClientRegistrationFinishParams,
) -> Result<OpaqueClientRegistrationFinishResult, Error> {
    let registration_response_bytes =
        base64_decode("registrationResponse", params.registration_response)?;
    let mut rng: OsRng = OsRng;
    let client_registration = base64_decode("clientRegistration", params.client_registration)?;
    let state = ClientRegistration::<DefaultCipherSuite>::deserialize(&client_registration)
        .map_err(from_protocol_error("deserialize clientRegistration"))?;

    let server_ident = match params.server_identifier.len() {
        0 => Ok(None),
        1 => params.server_identifier.get(0).map_or_else(
            || {
                Err(Error::Input {
                    message: "error retrieving server_identifier".to_string(),
                })
            },
            |x| Ok(Some(x)),
        ),
        len => Err(Error::Input {
            message: format!("invalid number of server_identifier values, expected exactly 0 or 1 but received {}", len),
        }),
    }?;

    let finish_params = ClientRegistrationFinishParameters::new(
        Identifiers {
            client: Some(params.client_identifier.as_bytes()),
            server: server_ident.map(|val| val.as_bytes()),
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
