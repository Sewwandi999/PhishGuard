function pdfEscape(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function buildSimplePdf(title, lines) {
  const bodyLines = (lines || []).map((line) => String(line).slice(0, 110)).slice(0, 44);
  let content = "BT\n/F1 16 Tf\n50 760 Td\n";
  content += `(${pdfEscape(title || "PhishGuard Report")}) Tj\n`;
  content += "/F1 11 Tf\n0 -28 Td\n";
  bodyLines.forEach((line, index) => {
    if (index > 0) content += "0 -16 Td\n";
    content += `(${pdfEscape(line)}) Tj\n`;
  });
  content += "ET\n";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function reportToPdfBuffer(report) {
  const data = report.data || {};
  const range = report.dateRange || {};
  const lines = [
    `Type: ${report.type || "n/a"}`,
    `Period: ${range.startDate || ""} to ${range.endDate || ""}`,
    `Generated: ${report.createdAt || new Date().toISOString()}`,
    "",
    `Total scans: ${data.totalScans ?? data.totalPredictions ?? 0}`,
    `Phishing detected: ${data.phishingDetected ?? 0}`,
    `Legitimate: ${data.legitimateMessages ?? 0}`,
    `Average confidence: ${data.averageConfidence ?? 0}`,
    `Detection rate: ${data.detectionRate ?? 0}%`,
  ];
  if (Array.isArray(data.topThreats) && data.topThreats.length) {
    lines.push("", "Top threats:");
    data.topThreats.slice(0, 8).forEach((t) => {
      lines.push(`- ${t.pattern}: ${t.count}`);
    });
  }
  return buildSimplePdf(report.title || "PhishGuard Report", lines);
}

module.exports = { buildSimplePdf, reportToPdfBuffer };
