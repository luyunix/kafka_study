import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CatalogTest(unittest.TestCase):
    def test_all_156_lessons_have_notes_transcripts_and_diagrams(self):
        catalog = json.loads((ROOT / "sources" / "course-catalog.json").read_text(encoding="utf-8"))
        self.assertEqual(len(catalog), 156)
        self.assertEqual([item["p"] for item in catalog], list(range(1, 157)))
        self.assertEqual(len({item["cid"] for item in catalog}), 156)

        note_files = list((ROOT / "notes").glob("*/p*.md"))
        transcript_files = list((ROOT / "notes").glob("*/transcripts/p*-ASR.md"))
        diagram_files = list((ROOT / "notes").glob("*/diagrams/p*-concept.svg"))
        self.assertEqual(len(note_files), 156)
        self.assertEqual(len(transcript_files), 156)
        self.assertEqual(len(diagram_files), 156)


if __name__ == "__main__":
    unittest.main()
