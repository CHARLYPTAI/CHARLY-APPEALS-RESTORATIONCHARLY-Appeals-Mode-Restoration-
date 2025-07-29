import json
from pathlib import Path

# Load CHARLY outputs
def load_charly_data(data_path, flag_path):
    with open(data_path, 'r') as f:
        property_data = json.load(f)

    with open(flag_path, 'r') as f:
        flag_data = json.load(f)

    # Index flags by parcel_id for quick lookup
    flag_lookup = {entry['parcel_id']: entry['flags'] for entry in flag_data if 'parcel_id' in entry}

    # Combine property data with corresponding flags
    combined = []
    for record in property_data:
        parcel_id = record['parcel_id']
        flags = flag_lookup.get(parcel_id, [])
        combined.append({"parcel_id": parcel_id, "record": record, "flags": flags})

    return combined


# Main script to preview merged data
if __name__ == '__main__':
    data_path = 'charly_output.json'
    flag_path = 'charly_flag_report.json'

    merged_data = load_charly_data(data_path, flag_path)

    print("\nMerged CHARLY Data Preview:")
    for item in merged_data:
        print(f"\n--- Parcel ID: {item['parcel_id']} ---")
        print("Property Record:")
        print(json.dumps(item['record'], indent=2))
        print("\nFlags:")
        print(json.dumps(item['flags'], indent=2))
