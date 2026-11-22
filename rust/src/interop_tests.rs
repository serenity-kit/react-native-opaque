//! Proves this library talks to @serenity-kit/opaque 1.1.0 (RFC 9807), using the real code in lib.rs and the real
//! server library, driven by rust/interop/server.mjs. Run with:
//! `npm install --prefix interop && cargo test --features host-test` (inside rust/).
use super::*;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

struct Server {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

impl Server {
    fn start() -> Self {
        let mut child = Command::new("node")
            .arg(concat!(env!("CARGO_MANIFEST_DIR"), "/interop/server.mjs"))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("node starts");
        let stdin = child.stdin.take().unwrap();
        let stdout = BufReader::new(child.stdout.take().unwrap());
        let mut server = Server {
            child,
            stdin,
            stdout,
        };
        assert_eq!(server.ask("version", &[]), "ready");
        server
    }

    fn ask(&mut self, name: &str, args: &[&str]) -> String {
        writeln!(self.stdin, "{} {}", name, args.join(" ")).unwrap();
        let mut line = String::new();
        self.stdout.read_line(&mut line).unwrap();
        let line = line.trim_end().to_string();
        assert!(!line.starts_with("error:"), "{name} failed: {line}");
        line
    }
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

fn default_ksf() -> OpaqueKeyStretching {
    OpaqueKeyStretching {
        preset: String::new(),
        iterations: 0,
        memory: 0,
        parallelism: 0,
    }
}

// A small custom setting keeps the tests fast; server.mjs reads the same setting as "custom:8192:1:1".
fn small_ksf() -> OpaqueKeyStretching {
    OpaqueKeyStretching {
        preset: "argon2id-custom".to_string(),
        iterations: 1,
        memory: 8192,
        parallelism: 1,
    }
}
const SMALL_KSF_ARG: &str = "custom:8192:1:1";

fn try_register(
    server: &mut Server,
    user: &str,
    password: &str,
    ksf: OpaqueKeyStretching,
) -> Result<String, String> {
    let start = opaque_start_client_registration(OpaqueStartClientRegistrationParams {
        password: password.to_string(),
    })
    .ok()
    .unwrap();
    let registration_response = server.ask(
        "register_start",
        &[user, start.registration_request.as_str()],
    );
    let finish = opaque_finish_client_registration(OpaqueFinishClientRegistrationParams {
        password: password.to_string(),
        registration_response,
        client_registration_state: start.client_registration_state,
        client_identifier: vec![],
        server_identifier: vec![],
        key_stretching: ksf,
    })
    .map_err(|e| e.to_string())?;
    server.ask(
        "register_finish",
        &[user, finish.registration_record.as_str()],
    );
    Ok(finish.export_key)
}

fn register(server: &mut Server, user: &str, password: &str, ksf: OpaqueKeyStretching) -> String {
    try_register(server, user, password, ksf).expect("registers")
}

// Returns (export key, whether the server produced the same session key), or None if the client rejected it.
fn login(
    server: &mut Server,
    user: &str,
    password: &str,
    ksf: OpaqueKeyStretching,
) -> Option<(String, bool)> {
    let start = opaque_start_client_login(OpaqueStartClientLoginParams {
        password: password.to_string(),
    })
    .ok()
    .unwrap();
    let login_response = server.ask("login_start", &[user, start.start_login_request.as_str()]);
    let finish = opaque_finish_client_login(OpaqueFinishClientLoginParams {
        client_login_state: start.client_login_state,
        login_response,
        password: password.to_string(),
        client_identifier: vec![],
        server_identifier: vec![],
        key_stretching: ksf,
    })
    .ok()
    .unwrap();
    let finish = finish.as_ref()?;
    let session_key = server.ask(
        "login_finish",
        &[user, finish.finish_login_request.as_str()],
    );
    Some((finish.export_key.clone(), session_key == finish.session_key))
}

#[test]
fn registers_and_signs_in_against_the_server_library() {
    let mut server = Server::start();
    let export_key = register(&mut server, "a", "correct-horse", default_ksf());
    let (login_key, sessions_match) =
        login(&mut server, "a", "correct-horse", default_ksf()).expect("signs in");
    assert!(sessions_match, "client and server session keys differ");
    assert_eq!(
        export_key, login_key,
        "export key changed between registration and sign-in"
    );
}

#[test]
fn rejects_a_wrong_password() {
    let mut server = Server::start();
    register(&mut server, "b", "correct-horse", default_ksf());
    assert!(login(&mut server, "b", "battery-staple", default_ksf()).is_none());
}

// These would fail on any difference in cipher suite, key stretching or salt: the account is made by one client
// and used by the other, and the export key comes out of the key stretching.
#[test]
fn signs_in_to_an_account_made_by_the_server_librarys_client() {
    let mut server = Server::start();
    let js_export_key = server.ask("js_register", &["c", "correct-horse"]);
    let (export_key, sessions_match) =
        login(&mut server, "c", "correct-horse", default_ksf()).expect("signs in");
    assert!(sessions_match);
    assert_eq!(js_export_key, export_key);
}

#[test]
fn account_made_here_signs_in_with_the_server_librarys_client() {
    let mut server = Server::start();
    let export_key = register(&mut server, "d", "correct-horse", default_ksf());
    assert_eq!(server.ask("js_login", &["d", "correct-horse"]), export_key);
}

#[test]
fn memory_constrained_by_name_is_the_default() {
    let mut server = Server::start();
    let named = OpaqueKeyStretching {
        preset: "memory-constrained".to_string(),
        ..default_ksf()
    };
    let export_key = register(&mut server, "e", "correct-horse", named);
    assert_eq!(server.ask("js_login", &["e", "correct-horse"]), export_key);
}

#[test]
fn custom_key_stretching_matches_the_server_library_both_ways() {
    let mut server = Server::start();
    let export_key = register(&mut server, "f", "correct-horse", small_ksf());
    assert_eq!(
        server.ask("js_login", &["f", "correct-horse", SMALL_KSF_ARG]),
        export_key
    );

    let js_export_key = server.ask("js_register", &["g", "correct-horse", SMALL_KSF_ARG]);
    let (export_key, sessions_match) =
        login(&mut server, "g", "correct-horse", small_ksf()).expect("signs in");
    assert!(sessions_match);
    assert_eq!(js_export_key, export_key);
}

#[test]
fn a_different_key_stretching_setting_is_rejected() {
    let mut server = Server::start();
    register(&mut server, "h", "correct-horse", small_ksf());
    assert!(login(&mut server, "h", "correct-horse", default_ksf()).is_none());
    assert_eq!(server.ask("js_login", &["h", "correct-horse"]), "rejected");
}

#[test]
fn invalid_key_stretching_is_refused() {
    let mut server = Server::start();
    let unknown = OpaqueKeyStretching {
        preset: "fast".to_string(),
        ..default_ksf()
    };
    let error = try_register(&mut server, "i", "correct-horse", unknown).unwrap_err();
    assert!(error.contains("unknown keyStretching"), "{error}");

    // Argon2id needs at least 8 KiB per lane.
    let too_small = OpaqueKeyStretching {
        memory: 1,
        ..small_ksf()
    };
    let error = try_register(&mut server, "j", "correct-horse", too_small).unwrap_err();
    assert!(error.contains("Invalid keyStretching"), "{error}");
}
