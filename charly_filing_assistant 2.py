print("🔥 CHARLY Filing Assistant is running...")

import pandas as pd
import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from PyPDF2 import PdfMerger

try:
    base_dir = "/Users/georgewohlleb/Desktop/CHARLY_TEST"
    csv_path = os.path.join(base_dir, "charly_flagged_output.csv")
    output_dir = os.path.join(base_dir, "pdf_output")
    cover_html_path = os.path.join(base_dir, "cover_sheet_template.html")
    instructions_html_path = os.path.join(base_dir, "filing_instructions_template.html")
    packet_pdf_path = os.path.join(base_dir, "charly_full_packet.pdf")
    output_pdf_path = os.path.join(output_dir, "charly_filing_packet.pdf")

    print("📄 Loading CSV...")
    df = pd.read_csv(csv_path)
    first_row = df.iloc[0]

    print("🧠 Preparing context for cover sheet...")
    context = {
        "date_prepared": datetime.now().strftime("%B %d, %Y"),
        "rep_name": "Charles Young",
        "firm_name": "Swartz + Associates, Inc.",
        "contact_email": "charles.young@swartztax.com",
        "contact_phone": "816-555-1234",
        "property_owner": first_row.get("owner", "N/A"),
        "property_address": first_row.get("address", "Unknown"),
        "parcel_number": first_row.get("parcel", "Unknown"),
        "property_type": first_row.get("type", "Commercial"),
        "flagged_issues": first_row.get(
            "flag_reason", "Over-assessed income-to-value ratio"
        ),
    }

    print("🧩 Rendering HTML templates...")
    env = Environment(loader=FileSystemLoader(base_dir))
    cover_template = env.get_template("cover_sheet_template.html")
    instructions_template = env.get_template("filing_instructions_template.html")

    rendered_cover = cover_template.render(context)
    rendered_instructions = instructions_template.render()

    print("🖨️ Creating individual PDFs...")
    cover_pdf_path = os.path.join(output_dir, "cover_sheet.pdf")
    instructions_pdf_path = os.path.join(output_dir, "filing_instructions.pdf")

    HTML(string=rendered_cover).write_pdf(cover_pdf_path)
    HTML(string=rendered_instructions).write_pdf(instructions_pdf_path)

    print("🧷 Merging into final filing packet...")
    merger = PdfMerger()
    merger.append(cover_pdf_path)
    merger.append(instructions_pdf_path)
    merger.append(packet_pdf_path)
    merger.write(output_pdf_path)
    merger.close()

    print(f"✅ Filing packet created at: {output_pdf_path}")

except Exception as e:
    print(f"❌ Error occurred: {e}")
