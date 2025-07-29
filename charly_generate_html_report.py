import pandas as pd
from datetime import datetime

# Load flagged data
df = pd.read_csv("charly_flagged_output.csv")

# Filter flagged records only
flagged = df[df["flag_value_to_rent"] == True]

# Format table as HTML
html_table = flagged.to_html(
    index=False,
    classes="table",
    border=0,
    justify="center",
    columns=[
        "property_name",
        "address",
        "value_to_rent_ratio",
        "flag_value_to_rent",
        "flag_reason"
    ],
    float_format="{:.2f}".format,
    na_rep="-"
)

# HTML structure
html_output = f"""
<!DOCTYPE html>
<html>
<head>
    <title>CHARLY – Flag Summary Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 40px;
        }}
        h1 {{
            color: #2E86C1;
        }}
        .table {{
            border-collapse: collapse;
            width: 100%;
        }}
        .table th, .table td {{
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
        }}
        .table th {{
            background-color: #f2f2f2;
        }}
        .flagged {{
            background-color: #FDEDEC;
        }}
    </style>
</head>
<body>
    <h1>CHARLY – Property Tax Flag Report</h1>
    <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    {html_table}
</body>
</html>
"""

# Save to file
with open("flag_report.html", "w") as file:
    file.write(html_output)

print("✅ flag_report.html created. Open it in your browser to view.")
