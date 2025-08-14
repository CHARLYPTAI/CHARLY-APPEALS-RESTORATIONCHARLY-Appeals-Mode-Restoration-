from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)

pdf.cell(200, 10, "Property Tax Report", ln=True, align="C")
pdf.ln(10)

properties = [
    {"parcel_id": "1001", "address": "123 Main St", "assessed_value": 950000},
    {"parcel_id": "1002", "address": "456 Oak Ave", "assessed_value": 1200000},
    {"parcel_id": "1003", "address": "789 Pine Rd", "assessed_value": 750000},
]

for p in properties:
    pdf.cell(0, 10, f"Parcel ID: {p['parcel_id']}", ln=True)
    pdf.cell(0, 10, f"Address: {p['address']}", ln=True)
    pdf.cell(0, 10, f"Assessed Value: ${p['assessed_value']}", ln=True)
    pdf.ln(5)

pdf.output("sample_data.pdf")
print("sample_data.pdf file created successfully!")
