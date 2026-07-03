# LyricPulse

LyricPulse is a local-first app for generating dynamic lyric videos from uploaded audio, LRC lyrics, and cover artwork. The first version runs fully on your machine with a React Studio, a Fastify API, Remotion video templates, FFmpeg-based audio processing, and an optional Electron desktop shell for Windows.

## Features

- Upload MP3, WAV, FLAC, or M4A audio.
- Upload line-timed LRC lyrics, including UTF-8, UTF-16, and GB18030/GBK encoded files that are normalized to UTF-8 on ingest.
- Upload JPG, PNG, or WEBP cover artwork.
- Analyze audio duration and loudness with FFmpeg, with replaceable adapters for BPM, beats, and frequency bands.
- Edit lyric video settings in a Chinese dark music workstation UI.
- Manage local project history, reopen saved projects, and delete stale projects with asset cleanup.
- Store artist metadata as Chinese and English names, then render a combined display label while filtering singer-name lyric lines by the Chinese name.
- Adjust lyric line timing in Studio with per-line `-0.5s` / `+0.5s`, delete rows, undo edits, and save the updated timeline.
- Preview and render beat-synced stage lighting, including a shared `stageLighting` intensity control used by both Studio preview and final export.
- Export standard-quality MP4 lyric videos in `9:16` and `16:9`.
- Render with a growing library of Remotion templates, including `PulseCover`, `NeonLyric`, `WaveformStage`, `TypewriterNoir`, `RosePostcard`, and poster-style variants such as `OrbitWords`.
- Keep long renders running in the background and inspect progress, success, or failure from render history.
- Build a Windows desktop installer from GitHub Actions without changing the existing web deployment flow.

## Stack

- Monorepo: pnpm + Turborepo
- Web Studio: React + Vite + TypeScript
- UI: Tailwind CSS + shadcn/ui-style local components + Framer Motion
- API: Node.js + Fastify
- Video: Remotion + FFmpeg
- Shared logic: TypeScript + Zod

## Workspace Layout

```text
apps/web                  React Studio
apps/api                  Fastify API and render orchestration
apps/desktop              Electron shell and Windows installer config
packages/core             Shared types, schemas, and LRC parser
packages/video            Remotion templates and renderer helper
packages/audio-analysis   FFmpeg analysis helpers and command runner
storage/uploads           Local uploaded assets
storage/outputs           Local rendered MP4 files
storage/analysis          Local audio analysis JSON files
```

## Requirements

- Node.js 22+
- pnpm 11+
- FFmpeg and ffprobe available on `PATH`

On Debian or Ubuntu, install FFmpeg with:

```bash
DEBIAN_FRONTEND=noninteractive apt-get install -y ffmpeg
```

Remotion downloads a Chrome Headless Shell on first render. Minimal Linux environments may also need browser runtime libraries such as `libnspr4` and `libnss3`.

```bash
DEBIAN_FRONTEND=noninteractive apt-get install -y libnspr4 libnss3
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the API:

```bash
pnpm --filter @lyricpulse/api dev
```

Start the Web Studio:

```bash
pnpm --filter @lyricpulse/web dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`, so the browser can use the Web Studio as the single entry point.

Start the single-port local preview used by the hosted development environment:

```bash
pnpm start:single
```

This serves the built Web Studio from the Fastify API process and keeps API calls on the same port.

## Windows Desktop Installer

The desktop app lives in `apps/desktop`. It wraps the existing Web Studio in Electron, starts the Fastify API on a local loopback port, and stores user data under Electron's `userData` directory instead of the repository `storage` folder.

Build the web assets used by the desktop shell:

```bash
pnpm --filter @lyricpulse/desktop build
```

Build a Windows installer locally on Windows:

```bash
pnpm desktop:win
```

The GitHub workflow `.github/workflows/windows-desktop.yml` builds the same installer on `windows-latest`. It can be triggered manually from GitHub Actions or by pushing a tag that matches `desktop-v*`. The generated `.exe` is uploaded as the `lyricpulse-windows-installer` artifact.

## Usage Flow

1. Open the Web Studio.
2. Create a project by entering a title, artist, and optional English artist name.
3. Upload one audio file, one LRC file, and one cover image.
4. Run audio analysis.
5. Choose a template and `9:16` or `16:9` output ratio.
6. Adjust theme and effect controls, including stage lighting intensity.
7. Review the lyric timeline and apply per-line timing edits when needed.
8. Start a standard-quality render, leave the job running in the background, and monitor it from render history.
9. Open a completed job to preview or download the generated MP4.

## Validation

Run the full local check suite:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format
pnpm build
```

Phase 8 smoke validation generated all six template and ratio combinations with a temporary 3-second audio sample:

```text
PulseCover-9x16       h264 1080x1920 + aac audio
PulseCover-16x9       h264 1920x1080 + aac audio
NeonLyric-9x16        h264 1080x1920 + aac audio
NeonLyric-16x9        h264 1920x1080 + aac audio
WaveformStage-9x16    h264 1080x1920 + aac audio
WaveformStage-16x9    h264 1920x1080 + aac audio
```

## SaaS Extension Points

LyricPulse currently uses local files and local rendering. The project model and package boundaries preserve the following SaaS extension points.

### Storage Provider

Local files live under `storage/uploads`, `storage/analysis`, and `storage/outputs`. A SaaS implementation can replace these paths with an object storage provider such as S3, R2, OSS, or GCS while keeping the same asset metadata shape from `packages/core`.

### Render Provider

`apps/api` invokes `@lyricpulse/video/render` for local Remotion rendering. A cloud render provider can implement the same render input contract, execute jobs in isolated workers, and return output metadata to the API.

### Job Queue

Render jobs are stored as local JSON status records. A queued deployment can move job creation and progress updates into Redis, BullMQ, SQS, or another queue while preserving the `RenderJob` status lifecycle.

### User History

Projects are stored locally in the first version. A SaaS version can attach projects, assets, analysis records, and render outputs to authenticated users while keeping the current project configuration schema.
