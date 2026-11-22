// Phone builds compile the bridge's C++ through android/CMakeLists.txt, so this does nothing for them.
// The host-test feature compiles it here so the interop tests can link on the build machine.
fn main() {
    #[cfg(feature = "host-test")]
    {
        cxx_build::bridge("src/lib.rs")
            .std("c++14")
            .compile("opaque_bridge");
        println!("cargo:rerun-if-changed=src/lib.rs");
    }
}
