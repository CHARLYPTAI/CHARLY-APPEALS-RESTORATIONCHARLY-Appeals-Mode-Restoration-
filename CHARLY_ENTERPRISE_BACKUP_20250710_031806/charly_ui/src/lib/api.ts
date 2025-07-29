export async function uploadFiles(files: FileList): Promise<unknown> {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  try {
    const res = await fetch("/api/ingest", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}