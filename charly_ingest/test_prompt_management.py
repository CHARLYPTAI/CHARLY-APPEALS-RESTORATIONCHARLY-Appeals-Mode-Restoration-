# charly_ingest/test_prompt_management.py

"""
test_prompt_management.py

Purpose:
    - Unit tests for prompt-version management in NarrativeClient.
    - Verifies behavior when metadata.json is missing, malformed, or missing the requested version.
"""

import os
import tempfile
import unittest
from unittest import mock

# Import AFTER patching constants, so we patch before creating NarrativeClient
import charly_narrative.charly_gpt_narrative_generator as ng
from charly_narrative.charly_gpt_narrative_generator import NarrativeClient


class TestPromptManagement(unittest.TestCase):
    def setUp(self):
        # Create a temporary prompts directory
        self.temp_prompts_dir = tempfile.TemporaryDirectory()
        self.override_dir = self.temp_prompts_dir.name

        # Patch PROMPTS_DIR and METADATA_PATH in the module
        self.patcher_prompts = mock.patch(
            "charly_ingest.charly_gpt_narrative_generator.PROMPTS_DIR",
            self.override_dir,
        )
        self.patcher_metadata = mock.patch(
            "charly_ingest.charly_gpt_narrative_generator.METADATA_PATH",
            os.path.join(self.override_dir, "metadata.json"),
        )
        self.patcher_prompts.start()
        self.patcher_metadata.start()

    def tearDown(self):
        # Stop patches and clean up temporary folder
        self.patcher_prompts.stop()
        self.patcher_metadata.stop()
        self.temp_prompts_dir.cleanup()

    def test_missing_metadata_raises(self):
        # metadata.json is not created → __init__ should raise FileNotFoundError
        with self.assertRaises(FileNotFoundError):
            NarrativeClient()

    def test_malformed_metadata_raises(self):
        # Create a malformed metadata.json (missing "versions" key)
        malformed = {"wrong_key": []}
        with open(
            os.path.join(self.override_dir, "metadata.json"), "w", encoding="utf-8"
        ) as f:
            import json

            f.write(json.dumps(malformed))

        with self.assertRaises(ValueError):
            NarrativeClient()

    def test_empty_version_list_raises(self):
        # Create metadata.json with empty "versions" array
        empty_versions = {"versions": []}
        with open(
            os.path.join(self.override_dir, "metadata.json"), "w", encoding="utf-8"
        ) as f:
            import json

            f.write(json.dumps(empty_versions))

        # Loading should succeed (empty list is allowed), but default "v1" not in list
        client = NarrativeClient()  # Should not raise here

        dummy_record = {"property_id": "X1", "noi": 1000}
        with self.assertRaises(ValueError):
            client.generate(dummy_record, prompt_version="v1")

    def test_supported_version_loads_prompt(self):
        # Create metadata.json listing "v1"
        good = {"versions": ["v1"]}
        with open(
            os.path.join(self.override_dir, "metadata.json"), "w", encoding="utf-8"
        ) as f:
            import json

            f.write(json.dumps(good))

        # Also create a valid narrative_v1.md
        with open(
            os.path.join(self.override_dir, "narrative_v1.md"), "w", encoding="utf-8"
        ) as f:
            f.write("Test prompt {property_id}")

        client = NarrativeClient()
        prompt_template = client._load_prompt("v1")
        self.assertIn("{property_id}", prompt_template)

    def test_unsupported_version_raises(self):
        # metadata.json lists only "v1"
        good = {"versions": ["v1"]}
        with open(
            os.path.join(self.override_dir, "metadata.json"), "w", encoding="utf-8"
        ) as f:
            import json

            f.write(json.dumps(good))

        # Create narrative_v1.md but no narrative_v2.md
        with open(
            os.path.join(self.override_dir, "narrative_v1.md"), "w", encoding="utf-8"
        ) as f:
            f.write("Test prompt {property_id}")

        client = NarrativeClient()
        dummy_record = {"property_id": "X2", "noi": 2000}
        with self.assertRaises(ValueError):
            client.generate(dummy_record, prompt_version="v2")


if __name__ == "__main__":
    unittest.main()
