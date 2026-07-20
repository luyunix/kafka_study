#!/usr/bin/env python3
"""Verify generated lesson counts, local links and basic ASR completeness."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


LINK_RE = re.compile(r"\[[^]]*]\(([^)]+)\)")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    catalog = json.loads((root / "sources" / "course-catalog.json").read_text(encoding="utf-8"))
    expected = len(catalog)

    notes = sorted((root / "notes").glob("*/p*.md"))
    transcripts = sorted((root / "notes").glob("*/transcripts/p*-ASR.md"))
    diagrams = sorted((root / "notes").glob("*/diagrams/p*-concept.svg"))
    errors: list[str] = []

    for label, files in (("notes", notes), ("transcripts", transcripts), ("diagrams", diagrams)):
        if len(files) != expected:
            errors.append(f"{label}: expected {expected}, got {len(files)}")

    markdown_files = [root / "README.md", *root.glob("notes/**/*.md")]
    for markdown in markdown_files:
        text = markdown.read_text(encoding="utf-8")
        for target in LINK_RE.findall(text):
            target = target.split("#", 1)[0]
            if not target or target.startswith(("http://", "https://", "mailto:")):
                continue
            path = (markdown.parent / target).resolve()
            if not path.exists():
                errors.append(f"broken link: {markdown.relative_to(root)} -> {target}")

    for number, transcript in enumerate(transcripts, 1):
        text = transcript.read_text(encoding="utf-8")
        if "机器合并全文" not in text or not re.search(r"`\d{2}:\d{2}–\d{2}:\d{2}`", text):
            errors.append(f"incomplete transcript: {transcript.relative_to(root)}")

    old_claim = "老师的完整讲解（按视频顺序校正）"
    for note in notes:
        if old_claim in note.read_text(encoding="utf-8"):
            errors.append(f"outdated ASR accuracy claim: {note.relative_to(root)}")

    command_reference = root / "notes" / "00-practical-command-reference.md"
    command_text = command_reference.read_text(encoding="utf-8")
    for required in (
            "kafka-topics.sh",
            "kafka-console-producer.sh",
            "kafka-console-consumer.sh",
            "kafka-consumer-groups.sh",
            "--reset-offsets",
            "--to-earliest",
            "compose-cluster.yaml",
    ):
        if required not in command_text:
            errors.append(f"command reference missing: {required}")

    if errors:
        print("\n".join(errors[:100]), file=sys.stderr)
        raise SystemExit(1)
    print(f"verified {expected} lessons, transcripts and diagrams; local links are valid")


if __name__ == "__main__":
    main()
