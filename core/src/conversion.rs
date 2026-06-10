use std::{path::Path, process::Command};

pub fn is_ffmpeg_available() -> bool {
    let result = Command::new("ffmpeg").arg("--help").output();
    result.is_ok()
}

pub fn convert_file(path: &str, out_dir: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    let stem = path_obj.file_stem().unwrap().to_str().unwrap();
    let out_file_path = Path::new(out_dir)
        .join(format!("{stem}.mp3"))
        .to_str()
        .unwrap()
        .to_owned();

    let result = Command::new("ffmpeg")
        .args(["-i", path, "-q:a", "0", &out_file_path, "-y"])
        .output()
        .unwrap();

    return match result.status.code() {
        Some(code) => {
            if code == 0 {
                Ok(String::from_utf8_lossy(&result.stderr).into_owned())
            } else {
                Err(String::from_utf8_lossy(&result.stderr).into_owned())
            }
        }
        None => Err("ffmpeg process terminated by signal".to_string()),
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ffmpeg_available() {
        let result = is_ffmpeg_available();
        assert_eq!(result, true);
    }

    mod convert_sample_flac {
        use super::*;

        #[test]
        fn success() {
            let result = convert_file("local/sample.flac", "local");
            assert_eq!(result.is_ok(), true);
        }

        #[test]
        fn non_existent_file() {
            let result = convert_file("local/non_existent.flac", "local");
            assert_eq!(result.is_ok(), false);
            assert!(result.err().unwrap().contains("No such file or directory"));
        }

        #[test]
        fn directory_input() {
            let result = convert_file("local", "local");
            assert_eq!(result.is_ok(), false);
            assert!(result.err().unwrap().contains("Is a directory"));
        }

        #[test]
        fn non_existent_out_dir() {
            let result = convert_file("local/sample.flac", "non_existent");
            assert_eq!(result.is_ok(), false);
            assert!(result.err().unwrap().contains("No such file or directory"));
        }

        #[test]
        fn invalid_input_format() {
            let result = convert_file("local/test.bin", "local");
            assert_eq!(result.is_ok(), false);
            assert!(result.err().unwrap().contains("Invalid data found"));
        }
    }
}
