mod windows;

pub use windows::*;

pub fn wait(millis: u64) {
    use std::{thread, time};

    thread::sleep(time::Duration::from_millis(millis));
}
