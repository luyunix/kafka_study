import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "build_study_catalog.py"


def load_catalog_module():
    spec = importlib.util.spec_from_file_location("build_study_catalog", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class StudyCatalogTest(unittest.TestCase):
    def test_catalog_covers_complete_course(self):
        catalog = load_catalog_module().build_catalog()
        lessons = [
            lesson
            for chapter in catalog["chapters"]
            for lesson in chapter["lessons"]
        ]

        self.assertEqual(10, catalog["chapterCount"])
        self.assertEqual(156, catalog["lessonCount"])
        self.assertEqual(list(range(1, 157)), [lesson["number"] for lesson in lessons])
        self.assertTrue(all((ROOT / "notes" / lesson["path"]).is_file() for lesson in lessons))


if __name__ == "__main__":
    unittest.main()
