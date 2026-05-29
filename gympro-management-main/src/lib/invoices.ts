import { supabase } from '@/lib/supabase';
import { Invoice, InvoiceItem } from '@/types';

export const INVOICE_CONFIG = {
  gstin: '27ABCDE1234F1Z5',
  businessName: 'Iron Pulse Fitness Pvt Ltd',
  billingAddress: '123 Fitness Street, Mumbai, MH 400001, India',
  hsnSac: '999799',
  cgstRate: 9,
  sgstRate: 9,
  logoUrl: ''
};

type PaymentRow = {
  id: string;
  member_id: string;
  amount: number | string;
  currency?: string | null;
  description?: string | null;
  type?: string | null;
  paid_date?: string | null;
  created_at: string;
  invoice_id?: string | null;
};

type MemberRow = {
  first_name: string;
  last_name: string;
  email: string;
};

const buildInvoiceNumber = (paymentId: string, date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const shortId = paymentId.slice(0, 6).toUpperCase();
  return `INV-${stamp}-${shortId}`;
};

const buildItems = (description: string, amount: number): InvoiceItem[] => [
  {
    description,
    quantity: 1,
    unitPrice: amount,
    total: amount,
    hsnSac: INVOICE_CONFIG.hsnSac
  }
];

export const createInvoiceForPayment = async (paymentId: string): Promise<Invoice | null> => {
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existingInvoice) {
    return existingInvoice as Invoice;
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (paymentError || !payment) {
    throw paymentError;
  }

  const paymentRow = payment as PaymentRow;
  const amount = Number(paymentRow.amount);
  const cgstAmount = Number((amount * INVOICE_CONFIG.cgstRate) / 100);
  const sgstAmount = Number((amount * INVOICE_CONFIG.sgstRate) / 100);
  const subtotal = amount;
  const total = Number((subtotal + cgstAmount + sgstAmount).toFixed(2));

  const { data: member } = await supabase
    .from('members')
    .select('first_name, last_name, email')
    .eq('id', paymentRow.member_id)
    .maybeSingle();

  const memberRow = member as MemberRow | null;
  const customerName = memberRow ? `${memberRow.first_name} ${memberRow.last_name}` : '';
  const customerEmail = memberRow?.email || '';

  const invoiceNumber = buildInvoiceNumber(paymentRow.id);
  const items = buildItems(paymentRow.description || paymentRow.type || 'Payment', amount);

  const invoicePayload = {
    payment_id: paymentRow.id,
    member_id: paymentRow.member_id,
    invoice_number: invoiceNumber,
    status: 'paid',
    issue_date: paymentRow.paid_date || new Date().toISOString(),
    due_date: paymentRow.paid_date || new Date().toISOString(),
    paid_date: paymentRow.paid_date || new Date().toISOString(),
    currency: paymentRow.currency || 'INR',
    description: paymentRow.description || paymentRow.type || 'Payment',
    subtotal,
    cgst_rate: INVOICE_CONFIG.cgstRate,
    sgst_rate: INVOICE_CONFIG.sgstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    total,
    gstin: INVOICE_CONFIG.gstin,
    business_name: INVOICE_CONFIG.businessName,
    billing_address: INVOICE_CONFIG.billingAddress,
    hsn_sac: INVOICE_CONFIG.hsnSac,
    customer_name: customerName,
    customer_email: customerEmail,
    logo_url: INVOICE_CONFIG.logoUrl,
    items
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoicePayload)
    .select('*')
    .single();

  if (invoiceError || !invoice) {
    throw invoiceError;
  }

  await supabase
    .from('payments')
    .update({ invoice_id: invoice.id })
    .eq('id', paymentRow.id);

  return invoice as Invoice;
};
