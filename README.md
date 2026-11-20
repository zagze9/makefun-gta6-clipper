# gta6-clipper-01 — "GTA 6: how Jason met Lucia"

Entry for the make.fun bounty
[make.fun/bounty/gta6-clipper-01](https://make.fun/bounty/gta6-clipper-01):
clip GTA 6 for the most YouTube views.

## The moment we picked

**From the official Rockstar Games "Grand Theft Auto VI Trailer 2" (May 2025,
https://www.youtube.com/watch?v=VQRLujxTm3c), seconds 47.0-69.2 (22.2s): the
prison pickup — Jason Duval asking for Lucia Camino.**

This is the scene everyone rewatches from Trailer 2 because it is the exact
moment GTA 6's story begins: Jason leaning on the prison window, "I'm here for
Lucia Camino. She's supposed to be getting out.", the guard's "What's your
name?", and the reunion "Hey." at golden hour with the razor-wire prison
perimeter. It hooks viewers instantly (who is Lucia? why is he picking her
up?), it needs no context to understand, and the warm prison establishing shot
reads beautifully on a vertical phone screen.

## How the short is built

- Trim 47.0s-69.2s of the trailer (chosen from the subtitle dialogue timeline
  and per-frame luma: the scene starts after a ~46s transition and fades into
  the "ROCKSTAR GAMES PRESENTS" card at ~69.3s).
- Vertical 1080x1920 via **blur-fill** (not a blind crop): the full trailer
  frame is scaled to 1080x608 and centered, over a blurred darkened
  1080x1920 fill — no trailer content is cut away.
- Pitch text drawn with ffmpeg drawtext (Noto Sans Bold, boxed, centered,
  inside the Shorts safe area, away from the YouTube action buttons and the
  bottom overlay):
  - 0-5.5s: "GTA 6: how Jason met Lucia" (hook, top)
  - 5.5-11.5s: "GTA VI Trailer 2"
  - 11.5-17s: "Make clips like this with AI" + "and earn money on make.fun"
  - 17-22.2s: "make.fun/bounty/gta6-clipper-01"
- Original trailer audio (the scene's dialogue and music) is kept.

The final short is committed as `short-final.mp4` (1080x1920, 22.2s).

## Re-rendering

`main.ts` (Node >= 22, stdlib only) is the entry program:

1. It always copies `VIDEO.json` to `$MAKEFUN_OUTPUT_DIR/VIDEO.json`
   (default `/output`) — this is the file the make.fun gate reads.
2. If `ffmpeg` is installed **and** the trailer footage exists at one of the
   paths in `cut.json` (the footage is not committed for copyright reasons),
   it re-renders the short from `cut.json` into
   `$MAKEFUN_OUTPUT_DIR/short-final.mp4` with deterministic ffmpeg flags
   (bitexact, single thread, fixed creation_time) so two runs produce
   byte-identical files. If ffmpeg or the footage is missing, step 2 is
   skipped silently and the program still exits 0.

To re-render by hand, download the trailer and run:

```sh
yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]" \
  --merge-output-format mp4 -o gta6-trailer2.mp4 "https://www.youtube.com/watch?v=VQRLujxTm3c"
ffmpeg -y -ss 47 -t 22.2 -i gta6-trailer2.mp4 -filter_complex "<see cut.json>" \
  -map "[vout]" -map 0:a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -threads:v 1 -threads:a 1 -movflags +faststart \
  -metadata creation_time=1970-01-01T00:00:00Z short-final.mp4
```

All cut parameters (timestamps, layout, text lines, exact filtergraph and
flags) live in `cut.json`.

## Submitting once the Short URL exists

1. Lisa uploads `short-final.mp4` to the "melisa zahra" YouTube channel as a
   Short, using `youtube-title.txt` as the title and
   `youtube-description.txt` as the description.
2. Replace the placeholder URL in `VIDEO.json` with the real URL, e.g.
   `{"url": "https://www.youtube.com/shorts/XXXXXXXXXXX"}`.
3. Commit, then submit the entry to make.fun bounty `gta6-clipper-01` — the
   gate reads `VIDEO.json` (copied to `/output/VIDEO.json` by `main.ts`).

## License

MIT — see `LICENSE`. The GTA VI trailer footage is © Rockstar Games; this
entry only references short excerpts for the bounty clip, and the footage
itself is not redistributed in this repo.
