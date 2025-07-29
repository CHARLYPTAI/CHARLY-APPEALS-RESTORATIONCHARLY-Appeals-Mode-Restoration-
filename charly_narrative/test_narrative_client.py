# charly_narrative/test_narrative_client.py
# pyright: reportMissingImports=false,reportAttributeAccessIssue=false

import os
import sys

# ── Make sure the directory containing both this test and charly_gpt_narrative_generator.py
#    is on Python’s import path. Without this, pytest cannot find the module.
sys.path.insert(0, os.path.dirname(__file__))

import json
import logging
import pytest
import types
import openai

# Define openai.error.RateLimitError so our client can catch it (if import fails)
openai.error = types.SimpleNamespace(RateLimitError=Exception)

# Now that sys.path is patched, import our client under test:
from charly_gpt_narrative_generator import NarrativeClient


class DummyResponse:
    """
    Simulates an OpenAI response object with required attributes:
    – choices[0].message.content
    – usage.total_tokens
    """
    class Choice:
        class Message:
            def __init__(self, content):
                self.content = content

        def __init__(self, content):
            self.message = DummyResponse.Choice.Message(content)

    class Usage:
        def __init__(self, total_tokens):
            self.total_tokens = total_tokens

    def __init__(self, text, tokens):
        self.choices = [DummyResponse.Choice(text)]
        self.usage = DummyResponse.Usage(tokens)


@pytest.fixture(autouse=True)
def isolate_cache(tmp_path, monkeypatch):
    """
    1) Create a fresh temp SQLite file for each test
    2) Build a temporary prompts folder (with metadata.json + narrative_v1.md)
    3) Ensure a “logs/” directory exists in cwd so the client can write logs
    4) Monkeypatch CHARLY_LOG_DIR to point at that logs/ folder
    """
    # 1) Prepare temp cache DB path
    cache_db = tmp_path / "narrative_cache.db"

    # 2) Prepare temp prompts folder
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    metadata = {"versions": ["v1"]}
    (prompts_dir / "metadata.json").write_text(json.dumps(metadata))
    (prompts_dir / "narrative_v1.md").write_text("Prompt template text")

    # 3) Ensure default logs/ directory exists in current working directory
    os.makedirs("logs", exist_ok=True)

    # 4) Override environment so client picks up our temp prompts, but logs go to "logs/"
    monkeypatch.setenv("CHARLY_LOG_DIR", os.getcwd() + "/logs")

    yield {
        "cache_db": str(cache_db),
        "prompts_dir": str(prompts_dir),
        "log_path": os.getcwd() + "/logs/phase4.log",
    }


def test_cache_miss_and_hit(isolate_cache, monkeypatch, caplog):
    """
    1) First call: cache miss → fake OpenAI returns "Hello World", 10 tokens.
    2) Second call: same record/version → cache hit (no fake call), tokens=0.
    """
    cache_db = isolate_cache["cache_db"]
    prompts_dir = isolate_cache["prompts_dir"]
    log_path = isolate_cache["log_path"]

    # Remove any pre-existing log file
    if os.path.isfile(log_path):
        os.remove(log_path)

    # 1. Monkeypatch openai.chat.completions.create
    calls = []
    def fake_create(*args, **kwargs):
        calls.append(True)
        return DummyResponse(text="Hello World", tokens=10)

    monkeypatch.setattr(openai.chat.completions, "create", fake_create)  # type: ignore[attr-defined]

    # 2. Initialize client with temp paths
    client = NarrativeClient(
        prompts_dir=prompts_dir,
        metadata_filename="metadata.json",
        cache_db_path=cache_db
    )

    record = {"property_id": "R1", "some_field": "value"}
    caplog.set_level(logging.INFO)

    # First invocation → cache miss
    narrative1 = client.generate(record, "v1")
    assert narrative1 == "Hello World"
    assert len(calls) == 1

    # Ensure logs are written
    logging.shutdown()

    # Check first log entry (cache_hit=False, cost_in_tokens=10)
    with open(log_path, "r") as f:
        logs = f.read().strip().splitlines()
    assert len(logs) == 1
    log_entry = json.loads(logs[0])
    assert log_entry["property_id"] == "R1"
    assert log_entry["prompt_version"] == "v1"
    assert log_entry["cache_hit"] is False
    assert log_entry["cost_in_tokens"] == 10

    # Second invocation → cache hit
    narrative2 = client.generate(record, "v1")
    assert narrative2 == "Hello World"
    assert len(calls) == 1   # no new API call

    # Flush logs again
    logging.shutdown()

    # Check second log entry (cache_hit=True, cost_in_tokens=0)
    with open(log_path, "r") as f:
        logs = f.read().strip().splitlines()
    assert len(logs) == 2
    log_entry2 = json.loads(logs[1])
    assert log_entry2["property_id"] == "R1"
    assert log_entry2["prompt_version"] == "v1"
    assert log_entry2["cache_hit"] is True
    assert log_entry2["cost_in_tokens"] == 0

    client.close()


def test_retry_on_rate_limit(isolate_cache, monkeypatch):
    """
    Simulate RateLimitError on first attempt, then succeed on second.
    """
    cache_db = isolate_cache["cache_db"]
    prompts_dir = isolate_cache["prompts_dir"]

    # Create a dummy RateLimitError subclass
    class DummyRateLimit(openai.error.RateLimitError):  # type: ignore[attr-defined]
        pass

    # Set up two‐stage behavior: first call raises, second returns DummyResponse
    state = {"count": 0}
    def fake_create(*args, **kwargs):
        if state["count"] == 0:
            state["count"] += 1
            raise DummyRateLimit("Rate limited")
        return DummyResponse(text="Recovered Text", tokens=5)

    monkeypatch.setattr(openai.chat.completions, "create", fake_create)  # type: ignore[attr-defined]

    client = NarrativeClient(
        prompts_dir=prompts_dir,
        metadata_filename="metadata.json",
        cache_db_path=cache_db
    )

    record = {"property_id": "R2", "some_field": "value"}
    narrative = client.generate(record, "v1")
    assert narrative == "Recovered Text"

    # Flush logs (not strictly needed for this test)
    logging.shutdown()

    client.close()


def test_missing_prompt_file(isolate_cache):
    """
    Ensure that if prompt file is missing, generate(...) raises FileNotFoundError.
    """
    cache_db = isolate_cache["cache_db"]
    prompts_dir = isolate_cache["prompts_dir"]

    # Remove narrative_v1.md to simulate missing prompt
    os.remove(os.path.join(prompts_dir, "narrative_v1.md"))

    client = NarrativeClient(
        prompts_dir=prompts_dir,
        metadata_filename="metadata.json",
        cache_db_path=cache_db
    )

    # Calling generate should trigger FileNotFoundError
    with pytest.raises(FileNotFoundError):
        client.generate({"property_id": "R3"}, "v1")

    client.close()
