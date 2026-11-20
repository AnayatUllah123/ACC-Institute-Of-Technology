// Dependency-free, single-page PDF receipt. Latin-1 fallback avoids invalid standard-font glyphs.
const safe = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/[()\\]/g, "\\$&")
    .slice(0, 110);
export function receiptPdf({ payment, student }) {
  const entries = [
    ["ACC INSTITUTE OF TECHNOLOGY", 20],
    ["OFFICIAL PAYMENT RECEIPT", 16],
    ["Receipt ID: " + payment._id, 11],
    ["Date: " + new Date(payment.receivedAt).toLocaleDateString("en-GB"), 11],
    ["Student: " + (student?.name || "Unknown"), 11],
    ["Course: " + (student?.course?.title || "Unknown"), 11],
    ["Amount: PKR " + Number(payment.amount).toFixed(2), 14],
    ["Method: " + payment.method, 11],
    ["Reference: " + (payment.reference || "-"), 11],
    ["Status: " + (payment.voidedAt ? "VOIDED" : "RECEIVED"), 11],
    ["Thank you for your payment.", 11],
  ];
  let content = "BT\n";
  let y = 755;
  for (const [line, size] of entries) {
    content += `/F1 ${size} Tf 1 0 0 1 48 ${y} Tm (${safe(line)}) Tj\n`;
    y -= size + 20;
  }
  content += "ET\n";
  const stream = Buffer.from(content, "ascii");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${content}endstream`,
  ];
  let body = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, "ascii"));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body, "ascii");
  body +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "ascii");
}
