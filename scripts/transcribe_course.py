#!/usr/bin/env python3
"""Transcribe browser-captured Kafka course audio with MLX Whisper.

The browser step stores one ``pNNN-audio.m4s`` file per episode in a temporary
directory.  This script converts each audio-only MP4 with macOS ``afconvert``,
feeds the resulting 16 kHz PCM waveform directly to MLX Whisper, and writes a
JSON file containing the complete text plus segment timestamps.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
import time
import wave
from pathlib import Path

import numpy as np
from mlx_whisper import transcribe


INITIAL_PROMPT = """
Apache Kafka 技术课程。术语包括：Kafka、Java、JDK 17、ZooKeeper、KRaft、
Broker、Controller、Cluster UUID、Topic、Partition、Replica、Leader、Follower、
Producer、Consumer、Consumer Group、Offset、LEO、HW、ISR、OSR、AR、Docker、
Spring Boot、KafkaTemplate、ProducerRecord、ConsumerRecord、Acknowledgment、
Serializer、Deserializer、Interceptor、RangeAssignor、RoundRobinAssignor、
StickyAssignor、CooperativeStickyAssignor、Offset Explorer、CMAK、EFAK。
""".strip()


def load_pcm16_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as audio:
        channels = audio.getnchannels()
        sample_rate = audio.getframerate()
        sample_width = audio.getsampwidth()
        frames = audio.readframes(audio.getnframes())

    if sample_rate != 16_000 or sample_width != 2:
        raise ValueError(
            f"unexpected WAV format: {sample_rate} Hz, {sample_width * 8} bit"
        )

    samples = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return samples


def transcribe_one(audio_path: Path, output_path: Path, model: str) -> dict:
    with tempfile.TemporaryDirectory(prefix="kafka-asr-") as temp_dir:
        wav_path = Path(temp_dir) / "audio.wav"
        subprocess.run(
            [
                "/usr/bin/afconvert",
                str(audio_path),
                str(wav_path),
                "-f",
                "WAVE",
                "-d",
                "LEI16@16000",
            ],
            check=True,
            capture_output=True,
        )
        samples = load_pcm16_wav(wav_path)

    result = transcribe(
        samples,
        path_or_hf_repo=model,
        language="zh",
        task="transcribe",
        verbose=False,
        initial_prompt=INITIAL_PROMPT,
        condition_on_previous_text=True,
    )
    payload = {
        "source": audio_path.name,
        "language": result["language"],
        "text": result["text"].strip(),
        "segments": [
            {
                "start": round(float(segment["start"]), 3),
                "end": round(float(segment["end"]), 3),
                "text": segment["text"].strip(),
            }
            for segment in result["segments"]
        ],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("media_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument(
        "--model", default="mlx-community/whisper-small-mlx"
    )
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=156)
    args = parser.parse_args()

    started = time.monotonic()
    completed = 0
    for number in range(args.start, args.end + 1):
        audio_path = args.media_dir / f"p{number:03d}-audio.m4s"
        output_path = args.output_dir / f"p{number:03d}.json"
        if output_path.exists():
            print(f"[{number:03d}] skip existing", flush=True)
            continue
        if not audio_path.exists():
            print(f"[{number:03d}] missing {audio_path}", flush=True)
            continue

        item_started = time.monotonic()
        payload = transcribe_one(audio_path, output_path, args.model)
        completed += 1
        elapsed = time.monotonic() - item_started
        total_elapsed = time.monotonic() - started
        print(
            f"[{number:03d}] {len(payload['segments']):3d} segments, "
            f"{elapsed:5.1f}s; total {total_elapsed / 60:5.1f}m",
            flush=True,
        )

    print(f"done: {completed} new transcripts", flush=True)


if __name__ == "__main__":
    main()
