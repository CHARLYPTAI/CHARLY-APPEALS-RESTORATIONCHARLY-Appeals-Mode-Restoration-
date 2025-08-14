# File Handling

* Accepted: JPG, PNG, PDF, CSV, XLS, XLSX; ≤50MB/file; ≤200MB request
* Pipeline: Upload → AV scan → EXIF scrub → OCR → Thumbnail → Hash+dedupe
* Outputs: text layer (searchable), CSV extraction if tables, MIME validation, content sniff
* Storage layout: s3://{env}/{tenant_id}/{workfile_id}/{upload_id}/{filename}
* Tenant isolation: no cross-tenant access
* No redistribution; no global model training unless opt-in license