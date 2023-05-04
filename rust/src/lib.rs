use std::{
    ffi::{c_char, CStr, CString},
    mem::transmute,
};

#[repr(C)]
pub struct Foobar {
    foo: *const c_char,
    bar: *const c_char,
}

#[no_mangle]
pub extern "C" fn get_rust_answer() -> f64 {
    return 1337.0;
}

#[no_mangle]
pub extern "C" fn get_foobar(input: Foobar) -> Foobar {
    let cfoo = unsafe { CStr::from_ptr(input.foo) };
    let foo = String::from_utf8_lossy(cfoo.to_bytes()).to_string();
    let cbar = unsafe { CStr::from_ptr(input.bar) };
    let bar = String::from_utf8_lossy(cbar.to_bytes()).to_string();
    let foo_result = CString::new(format!("rust_foo[{}]", foo)).unwrap();
    let bar_result = CString::new(format!("rust_bar[{}]", bar)).unwrap();

    Foobar {
        // using into_raw like this is a memory leak
        foo: bar_result.into_raw(),
        bar: foo_result.into_raw(),
    }
}
