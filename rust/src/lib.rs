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
pub extern "C" fn get_foobar(input: Foobar) -> *mut Foobar {
    let cfoo = unsafe { CStr::from_ptr(input.foo) };
    let foo = String::from_utf8_lossy(cfoo.to_bytes()).to_string();
    let cbar = unsafe { CStr::from_ptr(input.bar) };
    let bar = String::from_utf8_lossy(cbar.to_bytes()).to_string();
    let foo_result = CString::new(format!("thefoo:{}", foo)).unwrap();
    let bar_result = CString::new(format!("thebar:{}", bar)).unwrap();
    let x = Foobar {
        foo: foo_result.into_raw(), //CString::new("foorust").unwrap().into_raw(), //foobar.bar,
        bar: bar_result.into_raw(),
    };

    unsafe { transmute(Box::new(x)) }

    // unsafe { transmute(Box::new(x)) }
}
