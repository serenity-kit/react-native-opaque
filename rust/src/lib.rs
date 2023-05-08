#[cxx::bridge]
mod ffi {
    struct TheFoobar {
        foo: String,
        bar: String,
    }

    extern "Rust" {
        fn get_the_foobar(input: TheFoobar) -> TheFoobar;
    }
}

use ffi::TheFoobar;

fn get_the_foobar(input: TheFoobar) -> TheFoobar {
    let foo = format!("rustfoo[{}]", input.foo);
    let bar = format!("rustbar[{}]", input.bar);
    TheFoobar { foo: bar, bar: foo }
}
