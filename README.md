# tolossy

![release](https://img.shields.io/github/v/release/gs256/tolossy)
![license](https://img.shields.io/badge/license-MIT-green)
![rust](https://img.shields.io/badge/rust-%23000000.svg?logo=rust&logoColor=white&bg=red)
![vite](https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite&logoColor=white)
![react](https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB)
![shadcn](https://img.shields.io/badge/shadcn/ui-%23000000.svg?logo=shadcnui&logoColor=white)

A native desktop app with Web UI that converts any audio format to MP3 using `FFmpeg`.

**Supported input formats:** `wav`, `flac`, `aac`, `ogg`, `opus`, `aiff`, `m4a`, `alac` and other formats that FFmpeg supports.

**Supported output formats:** `mp3`

**Encoding preset:** `VBR V0` for best possible quality.

![usage](https://github.com/user-attachments/assets/a19cfa4f-416a-4c47-b6b0-54b66605fb11)

## Download

Download the executable for your operating system from the [latest release](https://github.com/gs256/tolossy/releases/latest).

**Note:** this app requires [FFmpeg](https://ffmpeg.org/download.html) to be installed on your system.

## Usage

1. Run the executable. Web UI will open in your default browser.

2. Select your audio files, then click `Convert to mp3`.
By default, all converted files are saved in the `tolossy` directory on your desktop.

3. To exit the application, click the `Quit` button or just close the browser tab.

## Build from source

```bash
$ git clone <this_repo>
$ cd tolossy

# Build the web UI. It will be embedded into the final executable.
$ cd ui
$ pnpm i
$ pnpm bulid

$ cd ..

# Build the native app. It expects the bundled web UI in ui/dist.
$ cd core
$ cargo build --release

# The final ececutable will be located in core/target/release/
```

## License

MIT
