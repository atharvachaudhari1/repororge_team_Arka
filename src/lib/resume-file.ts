/** Read the text embedded in a candidate's resume without sending it to a server. */
export async function extractResumeText(file: File): Promise<string> {
  if (/\.(txt|md)$/i.test(file.name)) return file.text();

  if (/\.pdf$/i.test(file.name)) {
    const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]);
    GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const content = await (await pdf.getPage(index + 1)).getTextContent();
        const rows: { y: number; text: string[] }[] = [];
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim() || !("transform" in item)) continue;
          const y = item.transform[5] ?? 0;
          const row = rows.find((candidate) => Math.abs(candidate.y - y) < 2);
          if (row) row.text.push(item.str);
          else rows.push({ y, text: [item.str] });
        }
        return rows.map((row) => row.text.join(" ")).join("\n");
      }),
    );
    return pages.join("\n");
  }

  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  throw new Error("This file type cannot be read in the browser yet. Upload a PDF, DOCX, or TXT resume.");
}
