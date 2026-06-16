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
