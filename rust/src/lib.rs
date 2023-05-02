#[no_mangle]
pub extern "C" fn hello_from_rust() {
    println!("hello from rust")
}

#[no_mangle]
pub extern "C" fn get_rust_answer() -> f64 {
    return 1337.0;
}
