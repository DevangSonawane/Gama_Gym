import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types';
import { INVOICE_CONFIG } from '@/lib/invoices';
import logoFull from '@/asset/gamalog.png';

const formatCurrency = (value: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(value);

const loadImageData = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateInvoicePdf = async (invoice: Invoice) => {
  const doc = new jsPDF();

  const gstin = invoice.gstin || INVOICE_CONFIG.gstin;
  const businessName = invoice.businessName || INVOICE_CONFIG.businessName;
  const billingAddress = invoice.billingAddress || INVOICE_CONFIG.billingAddress;
  const invoiceNumber = invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase();

  if (invoice.logoUrl || INVOICE_CONFIG.logoUrl || logoFull) {
    try {
      const logoUrl = invoice.logoUrl || INVOICE_CONFIG.logoUrl || logoFull;
      const logoData = await loadImageData(logoUrl);
      doc.addImage(logoData, 'PNG', 15, 12, 30, 18);
    } catch {
      // Ignore logo errors
    }
  }

  doc.setFontSize(16);
  doc.text(businessName, 50, 20);
  doc.setFontSize(10);
  doc.text(`GSTIN: ${gstin}`, 50, 26);
  doc.text(billingAddress, 50, 32);

  doc.setFontSize(12);
  doc.text(`Invoice #${invoiceNumber}`, 15, 50);
  doc.text(`Date: ${invoice.issueDate.toLocaleDateString()}`, 15, 56);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, 62);

  doc.text('Billed To:', 140, 50);
  doc.setFontSize(10);
  doc.text(invoice.customerName || 'Member', 140, 56);
  doc.text(invoice.customerEmail || '', 140, 62);

  const items = invoice.items.map((item) => [
    item.description,
    item.hsnSac || invoice.hsnSac || INVOICE_CONFIG.hsnSac,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.total, invoice.currency)
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Description', 'HSN/SAC', 'Qty', 'Unit Price', 'Amount']],
    body: items,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 188, 125], textColor: 255 }
  });

  const subtotal = invoice.subtotal ?? invoice.amount;
  const cgstAmount = invoice.cgstAmount ?? 0;
  const sgstAmount = invoice.sgstAmount ?? 0;
  const total = invoice.total ?? subtotal + cgstAmount + sgstAmount;

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  const summaryStart = (lastTable?.finalY ?? 72) + 8;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatCurrency(subtotal, invoice.currency)}`, 140, summaryStart);
  doc.text(`CGST (${invoice.cgstRate ?? INVOICE_CONFIG.cgstRate}%): ${formatCurrency(cgstAmount, invoice.currency)}`, 140, summaryStart + 6);
  doc.text(`SGST (${invoice.sgstRate ?? INVOICE_CONFIG.sgstRate}%): ${formatCurrency(sgstAmount, invoice.currency)}`, 140, summaryStart + 12);
  doc.setFontSize(12);
  doc.text(`Total: ${formatCurrency(total, invoice.currency)}`, 140, summaryStart + 20);

  doc.save(`invoice-${invoiceNumber}.pdf`);
};
