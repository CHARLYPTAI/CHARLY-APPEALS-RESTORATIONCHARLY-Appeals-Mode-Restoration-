import os
import json
import markdown2
from weasyprint import HTML
from datetime import datetime

PACKET_DIR = "packets"
OUTPUT_DIR = "pdf_output"
FLAG_REPORT = "charly_flag_report.json"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def slugify(name):
    return name.replace(" ", "_").replace(",", "").replace(".", "")

def generate_pdf_from_markdown(md_text, output_path):
    html = markdown2.markdown(md_text)
    HTML(string=html).write_pdf(output_path)

def generate_title_page():
    today = datetime.today().strftime("%B %d, %Y")
    return f"""
    <html><body>
    <h1 style='text-align:center;'>Property Tax Risk Analysis Report</h1>
    <h2 style='text-align:center;'>Jackson County</h2>
    <p style='text-align:center;'>{today}</p>
    <hr>
    </body></html>
    """

def generate_summary_section(flag_data):
    total_props = len(flag_data)
    flag_types = {}
    for prop in flag_data:
        for reason in prop.get("reasons", []):
            if reason not in flag_types:
                flag_types[reason] = 0
            flag_types[reason] += 1

    summary = "<h2>Summary of Flagged Properties</h2>"
    summary += f"<p>Total flagged properties: {total_props}</p>"
    summary += "<ul>"
    for k, v in flag_types.items():
        summary += f"<li>{k}: {v}</li>"
    summary += "</ul><hr>"
    return summary

def main():
    # Load flag report
    if not os.path.exists(FLAG_REPORT):
        print(f"❌ Missing {FLAG_REPORT}. Run ingestion first.")
        return

    with open(FLAG_REPORT, "r") as f:
        flag_data = json.load(f)

    # Individual PDFs
    for file in os.listdir(PACKET_DIR):
        if file.endswith(".md"):
            path = os.path.join(PACKET_DIR, file)
            with open(path, "r") as f:
                md = f.read()
            pdf_path = os.path.join(OUTPUT_DIR, f"{slugify(file[:-3])}.pdf")
            generate_pdf_from_markdown(md, pdf_path)
            print(f"✅ Generated: {pdf_path}")

    # Combined PDF
    full_html = generate_title_page()
    full_html += generate_summary_section(flag_data)

    for file in sorted(os.listdir(PACKET_DIR)):
        if file.endswith(".md"):
            path = os.path.join(PACKET_DIR, file)
            with open(path, "r") as f:
                md = f.read()
            html = markdown2.markdown(md)
            full_html += html + "<hr>"

    HTML(string=full_html).write_pdf(os.path.join(OUTPUT_DIR, "charly_full_packet.pdf"))
    print(f"✅ Combined report: charly_full_packet.pdf")

if __name__ == "__main__":
    main()
