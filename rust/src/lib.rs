use argon2::Argon2;
use base64::{engine::general_purpose as b64, Engine as _};
use opaque_ke::ciphersuite::CipherSuite;
use opaque_ke::rand::rngs::OsRng;
use opaque_ke::ClientRegistration;

struct DefaultCipherSuite;

impl CipherSuite for DefaultCipherSuite {
    type OprfCs = opaque_ke::Ristretto255;
    type KeGroup = opaque_ke::Ristretto255;
    type KeyExchange = opaque_ke::key_exchange::tripledh::TripleDh;

    type Ksf = Argon2<'static>;
}

#[cxx::bridge]
mod ffi {
    struct TheFoobar {
        foo: String,
        bar: String,
    }

    struct OpaqueClientRegistrationStartResult {
        client_registration: String,
        registration_request: String,
    }

    extern "Rust" {
        fn get_the_foobar(input: TheFoobar) -> TheFoobar;
        fn opaque_client_registration_start(
            password: String,
        ) -> OpaqueClientRegistrationStartResult;
    }
}

use ffi::TheFoobar;

const BASE64: b64::GeneralPurpose = b64::URL_SAFE_NO_PAD;

fn get_the_foobar(input: TheFoobar) -> TheFoobar {
    let foo = format!("rustfoo[{}]", input.foo);
    let bar = format!("rustbar[{}]", input.bar);
    TheFoobar { foo: bar, bar: foo }
}

pub fn opaque_client_registration_start(
    password: String,
) -> ffi::OpaqueClientRegistrationStartResult {
    let mut client_rng = OsRng;

    let client_registration_start_result =
        ClientRegistration::<DefaultCipherSuite>::start(&mut client_rng, password.as_bytes())
            .unwrap();

    let result = ffi::OpaqueClientRegistrationStartResult {
        client_registration: BASE64.encode(client_registration_start_result.state.serialize()),
        registration_request: BASE64.encode(
            client_registration_start_result
                .message
                .serialize()
                .to_vec(),
        ),
    };
    return result;
}
