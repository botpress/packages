use std::cell::RefCell;

use crate::{pipeline::process_embeddings, types::ClusteringRequest};

thread_local! {
    static OUTPUT_JSON: RefCell<Vec<u8>> = RefCell::new(Vec::new());
    static ERROR_MESSAGE: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

#[unsafe(no_mangle)]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(len);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    if len == 0 {
        return;
    }

    unsafe {
        drop(Vec::from_raw_parts(ptr, 0, len));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn run_clustering_wasm(input_ptr: *const u8, input_len: usize) -> i32 {
    clear_error();

    let input = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };
    let request = match parse_request(input) {
        Ok(request) => request,
        Err(exit_code) => return exit_code,
    };

    let output = match process_embeddings(request.dataset, &request.options) {
        Ok(output) => output,
        Err(message) => {
            set_error(message);
            return 1;
        }
    };
    let json = match serde_json::to_string_pretty(&output) {
        Ok(json) => json,
        Err(err) => {
            set_error(format!("failed to serialize clustering output: {err}"));
            return 1;
        }
    };
    OUTPUT_JSON.with(|buffer| *buffer.borrow_mut() = json.into_bytes());

    0
}

#[unsafe(no_mangle)]
pub extern "C" fn error_message_ptr() -> usize {
    ERROR_MESSAGE.with(|buffer| buffer.borrow().as_ptr() as usize)
}

#[unsafe(no_mangle)]
pub extern "C" fn error_message_len() -> usize {
    ERROR_MESSAGE.with(|buffer| buffer.borrow().len())
}

#[unsafe(no_mangle)]
pub extern "C" fn output_json_ptr() -> usize {
    OUTPUT_JSON.with(|buffer| buffer.borrow().as_ptr() as usize)
}

#[unsafe(no_mangle)]
pub extern "C" fn output_json_len() -> usize {
    OUTPUT_JSON.with(|buffer| buffer.borrow().len())
}

fn clear_error() {
    ERROR_MESSAGE.with(|buffer| buffer.borrow_mut().clear());
}

fn set_error(message: String) {
    ERROR_MESSAGE.with(|buffer| *buffer.borrow_mut() = message.into_bytes());
}

fn parse_request(input: &[u8]) -> Result<ClusteringRequest, i32> {
    serde_json::from_slice::<ClusteringRequest>(input).map_err(|err| {
        set_error(format!("failed to parse clustering request input: {err}"));
        1
    })
}
