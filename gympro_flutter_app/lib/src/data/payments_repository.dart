import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/payment.dart';

class PaymentsRepository {
  SupabaseClient get _db => Supabase.instance.client;

  static const _invoiceConfig = _InvoiceConfig(
    gstin: '27ABCDE1234F1Z5',
    businessName: 'Iron Pulse Fitness Pvt Ltd',
    billingAddress: '123 Fitness Street, Mumbai, MH 400001, India',
    hsnSac: '999799',
    cgstRate: 9,
    sgstRate: 9,
    logoUrl: '',
  );

  Future<List<Payment>> listPayments() async {
    final rows = await _db.from('payments').select('*').order('created_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>().map(Payment.fromRow).toList();
  }

  Future<String> createPayment({
    required String memberId,
    required double amount,
    required String type,
    required String method,
    required String description,
  }) async {
    final inserted = await _db.from('payments').insert({
      'member_id': memberId,
      'amount': amount,
      'currency': 'INR',
      'type': type,
      'method': method,
      'status': 'COMPLETED',
      'description': description,
      'paid_date': DateTime.now().toIso8601String(),
      'due_date': DateTime.now().toIso8601String(),
    }).select('*').maybeSingle();

    final row = inserted == null ? null : (inserted as Map).cast<String, dynamic>();
    return (row?['id'] as String?) ?? '';
  }

  Future<String> createInvoiceForPayment(String paymentId) async {
    // 1) If invoice already exists, return it.
    final existingRaw = await _db
        .from('invoices')
        .select('*')
        .eq('payment_id', paymentId)
        .maybeSingle();
    if (existingRaw != null) {
      final existing = (existingRaw as Map).cast<String, dynamic>();
      return (existing['id'] as String?) ?? '';
    }

    // 2) Fetch payment
    final paymentRaw = await _db.from('payments').select('*').eq('id', paymentId).single();
    final payment = (paymentRaw as Map).cast<String, dynamic>();
    final memberId = (payment['member_id'] as String?) ?? '';
    final amount = (payment['amount'] as num?)?.toDouble() ?? 0;

    final cgstAmount = (amount * _invoiceConfig.cgstRate) / 100;
    final sgstAmount = (amount * _invoiceConfig.sgstRate) / 100;
    final subtotal = amount;
    final total = double.parse((subtotal + cgstAmount + sgstAmount).toStringAsFixed(2));

    // 3) Fetch member info (optional)
    String customerName = '';
    String customerEmail = '';
    if (memberId.isNotEmpty) {
      final memberRaw = await _db
          .from('members')
          .select('first_name, last_name, email')
          .eq('id', memberId)
          .maybeSingle();
      if (memberRaw != null) {
        final m = (memberRaw as Map).cast<String, dynamic>();
        customerName = '${(m['first_name'] as String?) ?? ''} ${(m['last_name'] as String?) ?? ''}'.trim();
        customerEmail = (m['email'] as String?) ?? '';
      }
    }

    final issueDate = (payment['paid_date'] as String?) ?? DateTime.now().toIso8601String();
    final description = (payment['description'] as String?) ??
        (payment['type'] as String?) ??
        'Payment';
    final currency = (payment['currency'] as String?) ?? 'INR';

    final invoiceNumber = _buildInvoiceNumber(paymentId);
    final items = [
      {
        'description': description,
        'quantity': 1,
        'unitPrice': amount,
        'total': amount,
        'hsnSac': _invoiceConfig.hsnSac,
      },
    ];

    final payload = {
      'payment_id': paymentId,
      'member_id': memberId,
      'invoice_number': invoiceNumber,
      'status': 'paid',
      'issue_date': issueDate,
      'due_date': issueDate,
      'paid_date': issueDate,
      'currency': currency,
      'description': description,
      'subtotal': subtotal,
      'cgst_rate': _invoiceConfig.cgstRate,
      'sgst_rate': _invoiceConfig.sgstRate,
      'cgst_amount': cgstAmount,
      'sgst_amount': sgstAmount,
      'total': total,
      'gstin': _invoiceConfig.gstin,
      'business_name': _invoiceConfig.businessName,
      'billing_address': _invoiceConfig.billingAddress,
      'hsn_sac': _invoiceConfig.hsnSac,
      'customer_name': customerName,
      'customer_email': customerEmail,
      'logo_url': _invoiceConfig.logoUrl,
      'items': items,
    };

    final invoiceRaw = await _db.from('invoices').insert(payload).select('*').single();
    final invoice = (invoiceRaw as Map).cast<String, dynamic>();
    final invoiceId = (invoice['id'] as String?) ?? '';

    if (invoiceId.isNotEmpty) {
      await _db.from('payments').update({'invoice_id': invoiceId}).eq('id', paymentId);
    }

    return invoiceId;
  }

  String _buildInvoiceNumber(String paymentId, {DateTime? date}) {
    final d = date ?? DateTime.now();
    final stamp = d.toIso8601String().substring(0, 10).replaceAll('-', '');
    final shortId = paymentId.length >= 6 ? paymentId.substring(0, 6).toUpperCase() : paymentId.toUpperCase();
    return 'INV-$stamp-$shortId';
  }
}

class _InvoiceConfig {
  const _InvoiceConfig({
    required this.gstin,
    required this.businessName,
    required this.billingAddress,
    required this.hsnSac,
    required this.cgstRate,
    required this.sgstRate,
    required this.logoUrl,
  });

  final String gstin;
  final String businessName;
  final String billingAddress;
  final String hsnSac;
  final double cgstRate;
  final double sgstRate;
  final String logoUrl;
}
