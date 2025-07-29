import pandas as pd

# Define sample data as a dictionary
data = {
    "ParcelID": [1001, 1002, 1003],
    "Address": ["123 Main St", "456 Oak Ave", "789 Pine Rd"],
    "AssessedValue": [950000, 1200000, 750000]
}

# Create a DataFrame
df = pd.DataFrame(data)

# Save DataFrame to Excel file
df.to_excel("sample_data.xlsx", index=False)

print("sample_data.xlsx file created successfully!")
