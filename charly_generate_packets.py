import os
import json
from datetime import datetime

# --- Config ---
FLAG_FILE = "charly_flag_report.json"
OUTPUT_DIR = "packets"

# --- GPT Prompt Template ---
def generate_narrative(property_name, flags):
    intro = f"""
### Property: {property_name}
**Generated on:** {datetime.now().strftime('%Y-%m-%d')}

The following valuation issues were identified during CHARLY's automated review:
"""

    bullets = "\n".join([f"- {issue}" for issue in flags])
    closing = """

These conditions may indicate the property is over-assessed. We recommend further review or appeal by a certified property tax professional.

---
"""
    return intro + bullets + closing

# --- Write Markdown Files ---
def generate_packets():
    if not os.path.exists(FLAG_FILE):
        print("❌ No flag file found. Run the ingestion engine first.")
        return

    with open(FLAG_FILE, "r") as f:
        flag_data = json.load(f)

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    full_output = []

    for record in flag_data:
        name = record["property_name"].replace(" ", "_").replace("/", "-")
        flags = record["flags"]
        content = generate_narrative(record["property_name"], flags)
        full_output.append(content)

        file_path = os.path.join(OUTPUT_DIR, f"{name}.md")
        with open(file_path, "w") as f:
            f.write(content)

    # Optional: Save combined packet
    with open(os.path.join(OUTPUT_DIR, "charly_full_packet.md"), "w") as f:
        f.write("\n\n".join(full_output))

    print(f"✅ Generated {len(flag_data)} packet(s) in '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    generate_packets()

