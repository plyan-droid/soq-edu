import logo from "@/assets/soq-logo-local.png";

export type InvoiceRecord = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  items: { title: string; price?: number }[];
  total: number;
  method: string;
  reference: string;
  status: string;
  plan: string;
};

export async function downloadInvoicePdf(payment: InvoiceRecord) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const navy: [number, number, number] = [16, 43, 75];
  pdf.setTextColor(...navy);
  try {
    const response = await fetch(logo);
    if (response.ok) {
      const blob = await response.blob();
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Logo unavailable"));
        reader.onerror = () => reject(new Error("Logo unavailable"));
        reader.readAsDataURL(blob);
      });
      pdf.addImage(image, "PNG", 17, 12, 30, 30);
    }
  } catch { /* The invoice remains readable if the logo is unavailable. */ }
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(17); pdf.text("SOQ INTERNATIONAL ACADEMY", 52, 24);
  pdf.setFontSize(21); pdf.text("INVOICE", 18, 56);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
  const issue = new Date(payment.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const state = payment.status === "approved" ? (payment.plan === "full" ? "Transfer confirmed" : "Transfer confirmed; instalments may remain") : payment.status === "rejected" ? "Transfer not confirmed" : "Awaiting transfer confirmation";
  const rows = [
    `Invoice number: SOQ-${payment.id.slice(0, 8).toUpperCase()}`,
    `Date: ${issue}`,
    `Bill to: ${payment.full_name}`,
    payment.email,
    `Payment method: ${payment.method === "paynow" ? "PayNow" : "Bank transfer"}`,
    `Transfer reference: ${payment.reference}`,
    `Status: ${state}`,
    `Payment plan: ${payment.plan === "full" ? "Full amount" : `${payment.plan} instalments`}`,
  ];
  let y = 67;
  rows.forEach(line => { pdf.text(pdf.splitTextToSize(line, 174), 18, y); y += 7; });
  y += 5;
  pdf.setDrawColor(...navy); pdf.line(18, y, 192, y); y += 8;
  pdf.setFont("helvetica", "bold"); pdf.text("Course / item", 18, y); pdf.text("Amount (SGD)", 192, y, { align: "right" }); y += 8;
  pdf.setFont("helvetica", "normal");
  for (const item of payment.items) {
    const lines = pdf.splitTextToSize(item.title, 133) as string[];
    if (y + lines.length * 6 > 264) { pdf.addPage(); y = 24; }
    pdf.text(lines, 18, y);
    if (typeof item.price === "number") pdf.text(item.price.toFixed(2), 192, y, { align: "right" });
    y += Math.max(lines.length * 6, 8);
  }
  if (y > 258) { pdf.addPage(); y = 24; }
  pdf.line(18, y, 192, y); y += 10;
  pdf.setFont("helvetica", "bold"); pdf.text("Total (SGD)", 18, y); pdf.text(Number(payment.total).toFixed(2), 192, y, { align: "right" });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
  pdf.text("A transfer reference is not proof of payment. Confirmation is shown only after SOQ reviews the transfer.", 18, 280);
  pdf.save(`SOQ-invoice-${payment.id.slice(0, 8)}.pdf`);
}