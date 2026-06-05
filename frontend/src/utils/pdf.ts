import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function generateInvoicePDF(invoice: any, settings: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;

  // ─── CABECERA ─────────────────────────────────────────────────────────────
  doc.setFillColor(14, 148, 233); // primary-600
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.schoolName || 'Escuela de Dibujo', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (settings?.address) doc.text(settings.address, margin, 26);
  if (settings?.phone || settings?.email) {
    doc.text(`${settings?.phone || ''} | ${settings?.email || ''}`, margin, 32);
  }

  // Número de factura (derecha)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', pageW - margin, 18, { align: 'right' });
  doc.setFontSize(14);
  doc.text(invoice.invoiceNumber, pageW - margin, 26, { align: 'right' });

  // ─── DATOS FACTURA ────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59); // gray-800
  let y = 55;

  // Fecha y periodo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de emisión:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.issueDate).toLocaleDateString('es-ES'), margin + 38, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Periodo facturado:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MONTHS[invoice.billedMonth - 1]} ${invoice.billedYear}`, 158, y);

  y += 6;
  if (settings?.cifNif) {
    doc.setFont('helvetica', 'bold');
    doc.text('CIF/NIF Emisor:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.cifNif, margin + 30, y);
  }

  // ─── CLIENTE ──────────────────────────────────────────────────────────────
  y += 12;
  doc.setFillColor(248, 250, 252); // gray-50
  doc.rect(margin, y - 5, pageW - margin * 2, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y - 5, pageW - margin * 2, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTURAR A', margin + 4, y + 1);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.guardianName || invoice.student?.fullName || '—', margin + 4, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Alumno/a: ${invoice.student?.fullName || '—'}`, margin + 4, y + 15);
  if (invoice.guardianDni) {
    doc.text(`DNI: ${invoice.guardianDni}`, margin + 4, y + 21);
  }

  // ─── TABLA CONCEPTO ───────────────────────────────────────────────────────
  y += 38;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Mes', 'Importe']],
    body: [[
      invoice.concept || 'Cuota mensual Escuela de Dibujo',
      `${MONTHS[invoice.billedMonth - 1]} ${invoice.billedYear}`,
      `${Number(invoice.amount).toFixed(2)} €`,
    ]],
    headStyles: {
      fillColor: [14, 148, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    styles: { fontSize: 10 },
  });

  // Total
  const tableEndY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(14, 148, 233);
  doc.rect(pageW - margin - 60, tableEndY, 60, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL: ${Number(invoice.amount).toFixed(2)} €`, pageW - margin - 4, tableEndY + 7, { align: 'right' });

  // ─── ESTADO ───────────────────────────────────────────────────────────────
  const statusColors: Record<string, [number, number, number]> = {
    pagada:  [34, 197, 94],
    emitida: [234, 179, 8],
    anulada: [239, 68, 68],
  };
  const [r, g, b] = statusColors[invoice.status] || [100, 116, 139];
  const statusY = tableEndY + 18;
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, statusY, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(invoice.status.toUpperCase(), margin + 20, statusY + 5.5, { align: 'center' });

  // Método de pago
  if (invoice.payment?.method) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Método: ${invoice.payment.method}`, margin, statusY + 15);
  }

  // ─── PIE ──────────────────────────────────────────────────────────────────
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setTextColor(150, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.invoiceFooter || 'Gracias por confiar en nosotros.', pageW / 2, footerY + 6, { align: 'center' });
  if (settings?.phone) doc.text(`Tel: ${settings.phone}`, pageW / 2, footerY + 11, { align: 'center' });

  // ─── DESCARGAR ────────────────────────────────────────────────────────────
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function generateReceiptPDF(payment: any, student: any, settings: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;

  doc.setFillColor(14, 148, 233);
  doc.rect(0, 0, pageW, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.schoolName || 'Escuela de Dibujo', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', pageW - margin, 16, { align: 'right' });

  doc.setTextColor(30, 41, 59);
  let y = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Alumno:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fullName, margin + 25, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Mes:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MONTHS[payment.month - 1]} ${payment.year}`, margin + 15, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Importe:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Number(payment.amount).toFixed(2)} €`, margin + 22, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de pago:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'), margin + 35, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Método:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.method || 'Efectivo', margin + 22, y);

  y += 20;
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(margin, y, 50, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PAGADO', margin + 25, y + 7, { align: 'center' });

  doc.save(`recibo-${student.fullName.replace(/\s/g, '_')}-${MONTHS[payment.month - 1]}.pdf`);
}
