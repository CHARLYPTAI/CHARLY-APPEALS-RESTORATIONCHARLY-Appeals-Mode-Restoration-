# charly_narrative/charly_gpt_narrative_generator.py
# pyright: reportMissingImports=false, reportAttributeAccessIssue=false, reportCallIssue=false

import os
import sys
import json
import sqlite3
import logging
import time

import openai

# ── Assign RateLimitError from openai.error if it exists, else fall back.
try:
    RateLimitError = openai.error.RateLimitError  # type: ignore[attr-defined]
except Exception:
    class RateLimitError(Exception):
        pass


# -----------------------------------------------------------------------------
# 1) Ensure CHARLY_LOG_DIR is always a str (never None), then create the folder.
# -----------------------------------------------------------------------------
env_dir = os.getenv("CHARLY_LOG_DIR")
if not env_dir:
    env_dir = os.path.join(os.getcwd(), "logs")
CHARLY_LOG_DIR = env_dir  # guaranteed to be a str
os.makedirs(CHARLY_LOG_DIR, exist_ok=True)

logger = logging.getLogger("charly_narrative")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)


class NarrativeClient:
    """
    • prompts_dir: path to a folder containing metadata.json and narrative_<version>.md  
    • metadata_filename: typically "metadata.json"  
    • cache_db_path: path to a SQLite file (will be created if missing)
    """

    def __init__(self, *, prompts_dir: str, metadata_filename: str, cache_db_path: str):
        self.prompts_dir = prompts_dir
        self.metadata_filename = metadata_filename
        self.cache_db_path = cache_db_path

        # 2.1) Load metadata.json → expect a key "versions": [ ... ]
        metadata_path = os.path.join(self.prompts_dir, self.metadata_filename)
        if not os.path.isfile(metadata_path):
            raise FileNotFoundError(f"Cannot find metadata file: {metadata_path}")
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        if "versions" not in metadata:
            raise ValueError(f"`versions` key missing from {metadata_path}")
        self.versions = set(metadata["versions"])

        # 2.2) Connect to (or create) the SQLite cache
        self.conn = sqlite3.connect(self.cache_db_path, check_same_thread=False)
        self._ensure_schema()

    def _ensure_schema(self):
        """
        Create table `cache` if missing:
          • property_id    TEXT
          • prompt_version TEXT
          • narrative      TEXT
          • tokens_used    INTEGER
          PRIMARY KEY(property_id, prompt_version)
        """
        create_sql = """
        CREATE TABLE IF NOT EXISTS cache (
            property_id    TEXT NOT NULL,
            prompt_version TEXT NOT NULL,
            narrative      TEXT NOT NULL,
            tokens_used    INTEGER NOT NULL,
            PRIMARY KEY(property_id, prompt_version)
        )"""
        cur = self.conn.cursor()
        cur.execute(create_sql)
        self.conn.commit()

    def generate(self, record: dict, prompt_version: str) -> str:
        """
        1) Ensure record["property_id"] exists.
        2) Ensure prompt_version is in metadata["versions"].
        3) Check cache; if hit → return cached narrative (log cache_hit=True, tokens=0).
        4) Otherwise → load narrative_<version>.md, call OpenAI, cache the result, log cache_hit=False.
        """
        if "property_id" not in record:
            raise ValueError("`record` must contain a `property_id` field")
        pid = str(record["property_id"])

        if prompt_version not in self.versions:
            raise ValueError(f"Unknown prompt_version: {prompt_version}")

        # 3) Check cache first
        fetched = self._fetch_from_cache(pid, prompt_version)
        if fetched is not None:
            narrative_text, _ = fetched
            # → Log JSON line with cache_hit=True, cost_in_tokens=0
            self._append_log({
                "property_id": pid,
                "prompt_version": prompt_version,
                "cache_hit": True,
                "cost_in_tokens": 0,
            })
            return narrative_text

        # 4) Cache miss → load prompt template
        prompt_path = os.path.join(self.prompts_dir, f"narrative_{prompt_version}.md")
        if not os.path.isfile(prompt_path):
            raise FileNotFoundError(f"Cannot find prompt file: {prompt_path}")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        # 4.1) Build messages payload
        messages = [
            {"role": "system", "content": prompt_template},
            {"role": "user", "content": json.dumps(record)},
        ]

        # 4.2) Call openai.chat.completions.create, retry once on RateLimitError
        try:
            response = openai.chat.completions.create(  # <— changed here
                model="gpt-4",
                messages=messages,
                temperature=0.4,
            )
        except RateLimitError:
            time.sleep(1)
            response = openai.chat.completions.create(  # <— changed here
                model="gpt-4",
                messages=messages,
                temperature=0.4,
            )

        # 4.3) Extract the generated text and token count
        text = response.choices[0].message.content    # type: ignore[attr-defined]
        tokens_used = response.usage.total_tokens      # type: ignore[attr-defined]

        # 4.4) Insert into cache
        self._insert_into_cache(pid, prompt_version, text, tokens_used)

        # 4.5) Log JSON line with cache_hit=False, cost_in_tokens=tokens_used
        self._append_log({
            "property_id": pid,
            "prompt_version": prompt_version,
            "cache_hit": False,
            "cost_in_tokens": tokens_used,
        })

        return text

    def _fetch_from_cache(self, pid: str, version: str):
        """
        Returns (narrative, tokens_used) if found, else None.
        """
        cur = self.conn.cursor()
        cur.execute(
            "SELECT narrative, tokens_used FROM cache WHERE property_id = ? AND prompt_version = ?",
            (pid, version),
        )
        row = cur.fetchone()
        return row if row else None

    def _insert_into_cache(self, pid: str, version: str, narrative: str, tokens_used: int):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO cache (property_id, prompt_version, narrative, tokens_used) VALUES (?, ?, ?, ?)",
            (pid, version, narrative, tokens_used),
        )
        self.conn.commit()

    def _append_log(self, entry: dict):
        """
        Append exactly one JSON line to <CHARLY_LOG_DIR>/phase4.log
        """
        log_file = os.path.join(CHARLY_LOG_DIR, "phase4.log")
        with open(log_file, "a", encoding="utf-8") as fout:
            fout.write(json.dumps(entry) + "\n")
        logger.info("Wrote log entry to phase4.log")

    def close(self):
        self.conn.close()


# -----------------------------------------------------------------------------
# 3) If run as a script, allow simple CLI usage
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="CHARLY GPT Narrative Generator")
    parser.add_argument(
        "--record_file", type=str, required=True, help="Path to a JSON file containing `record`"
    )
    parser.add_argument(
        "--prompt_version", type=str, required=True, help="Which prompt version (must appear in metadata.json)"
    )
    parser.add_argument(
        "--prompts_dir",
        type=str,
        default="config/prompts",
        help="Folder containing metadata.json and narrative_<version>.md",
    )
    parser.add_argument(
        "--cache_db",
        type=str,
        default="cache/narrative_cache.db",
        help="Path to a SQLite file for caching",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.record_file):
        print(f"ERROR: record_file not found: {args.record_file}", file=sys.stderr)
        sys.exit(1)

    with open(args.record_file, "r", encoding="utf-8") as f:
        record = json.load(f)

    client = NarrativeClient(
        prompts_dir=args.prompts_dir,
        metadata_filename="metadata.json",
        cache_db_path=args.cache_db,
    )
    result = client.generate(record, args.prompt_version)
    print("\n=== Generated Narrative ===\n")
    print(result)
    client.close()
