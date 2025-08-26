async function safeDynamicImport(moduleName: string): Promise<any> {
  // Avoids bundler static analysis evaluating imported module at build time
  // by using an indirect import() call.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const importer = new Function("m", "return import(m)");
  return importer(moduleName);
}

export async function extractTextFromFile(file: File): Promise<{ text: string; mimeType: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || "application/octet-stream";
  const fileName = (file as unknown as { name?: string }).name ?? "";

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const mod = await safeDynamicImport("pdf-parse");
      const pdfParse = (mod?.default ?? mod) as (buf: Buffer) => Promise<{ text?: string }>;
      const result = await pdfParse(buffer);
      return { text: result?.text ?? "", mimeType };
    } catch {
      return { text: "", mimeType };
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    try {
      const mod = await safeDynamicImport("mammoth");
      const mammoth = (mod?.default ?? mod) as { extractRawText(input: { buffer: Buffer }): Promise<{ value?: string }> };
      const result = await mammoth.extractRawText({ buffer });
      return { text: result?.value ?? "", mimeType };
    } catch {
      return { text: "", mimeType };
    }
  }

  // Legacy Word .doc is intentionally unsupported to avoid heavy server dependencies
  if (mimeType === "application/msword" || fileName.toLowerCase().endsWith(".doc")) {
    return { text: "", mimeType };
  }

  return { text: "", mimeType };
}


