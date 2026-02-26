import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "")   // karakter ilegal Windows
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);                 // biar nggak kepanjangan
}

export async function POST(req) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl is required." }, { status: 400 });
    }

    // 1) Ambil title dulu
    const { stdout: titleRaw } = await execFileAsync("yt-dlp", [
      "--no-playlist",
      "--print", "%(title)s",
      videoUrl,
    ]);

    const title = sanitizeFilename(titleRaw.trim()) || "audio";
    const filename = `${title}.mp3`;

    // 2) Stream MP3
    const ytdlp = spawn(
      "yt-dlp",
      [
        "--no-playlist",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "-o", "-",
        videoUrl,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    const stream = new ReadableStream({
      start(controller) {
        ytdlp.stdout.on("data", (chunk) => controller.enqueue(chunk));
        ytdlp.stdout.on("end", () => controller.close());
        ytdlp.stdout.on("error", (e) => controller.error(e));
      },
      cancel() {
        ytdlp.kill("SIGKILL");
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        // ini yang bikin nama file sesuai title
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}