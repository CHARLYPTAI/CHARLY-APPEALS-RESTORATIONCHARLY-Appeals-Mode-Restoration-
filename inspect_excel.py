import pandas as pd

df = pd.read_excel('sample_data.xlsx')
print("Columns in Excel file:")
print(df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
