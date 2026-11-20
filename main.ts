// make.fun bounty gta6-clipper-01 entry program.
//
// What it does (Node >= 22, stdlib only, no network, no wall clock):
//   1. MANDATORY: copies VIDEO.json from the repo root into
//      $MAKEFUN_OUTPUT_DIR/VIDEO.json (default /output). This file is what
//      the make.fun gate reads to find the submitted YouTube Short URL.
//   2. OPTIONAL: if ffmpeg is on PATH AND the source trailer footage named
//      in cut.json exists on this machine, re-renders the vertical short
//      from cut.json into $MAKEFUN_OUTPUT_DIR/short-final.mp4 using
//      deterministic ffmpeg flags (bitexact, single thread, fixed
//      creation_time) so two runs write byte-identical files.
//      If either ffmpeg or the footage is missing, the render is skipped
//      silently and the program still exits 0 after step 1.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));

interface TextLine {
  text: string;
  start: number;
  end: number;
  y: number;
  font_size: number;
}

interface CutSpec {
  source: {
    title: string;
    uploader: string;
    url: string;
    youtube_id: string;
  };
  footage: {
    file: string;
    candidates: string[];
    resolution: string;
  };
  cut: {
    start_seconds: number;
    end_seconds: number;
  };
  output: {
    width: number;
    height: number;
    fps: string;
  };
  text_lines: TextLine[];
  ffmpeg: {
    input_flags_prefix: string[];
    filter_complex: string;
    video_flags: string[];
    audio_flags: string[];
    determinism_flags: string[];
    container_flags: string[];
    creation_time: string;
  };
}

function haveFfmpeg(): boolean {
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return probe.error === undefined && probe.status === 0;
}

function findFootage(spec: CutSpec): string | null {
  for (const candidate of spec.footage.candidates) {
    const abs = resolve(repoRoot, candidate);
    try {
      if (existsSync(abs) && statSync(abs).size > 0) return abs;
    } catch {
      // unreadable candidate: try the next one
    }
  }
  return null;
}

function renderShort(spec: CutSpec, footagePath: string, outPath: string): boolean {
  const start = spec.cut.start_seconds;
  const duration = spec.cut.end_seconds - spec.cut.start_seconds;
  const args = [
    "-y",
    ...spec.ffmpeg.input_flags_prefix,
    "-ss",
    String(start),
    "-t",
    String(duration),
    "-i",
    footagePath,
    "-filter_complex",
    spec.ffmpeg.filter_complex,
    "-map",
    "[vout]",
    "-map",
    "0:a",
    ...spec.ffmpeg.video_flags,
    ...spec.ffmpeg.audio_flags,
    ...spec.ffmpeg.determinism_flags,
    ...spec.ffmpeg.container_flags,
    "-metadata",
    `creation_time=${spec.ffmpeg.creation_time}`,
    outPath,
  ];
  const run = spawnSync("ffmpeg", args, { stdio: ["ignore", "ignore", "ignore"] });
  return run.error === undefined && run.status === 0;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });

  // Step 1 (mandatory): gate file.
  const videoJsonPath = join(repoRoot, "VIDEO.json");
  copyFileSync(videoJsonPath, join(outDir, "VIDEO.json"));

  // Step 2 (optional): reproduce the cut only when the tooling and footage
  // are actually present on this machine; otherwise skip silently.
  try {
    const spec = JSON.parse(readFileSync(join(repoRoot, "cut.json"), "utf8")) as CutSpec;
    if (haveFfmpeg()) {
      const footagePath = findFootage(spec);
      if (footagePath !== null) {
        renderShort(spec, footagePath, join(outDir, "short-final.mp4"));
      }
    }
  } catch {
    // Reproduction is best-effort; the gate only needs VIDEO.json.
  }
}

main();
