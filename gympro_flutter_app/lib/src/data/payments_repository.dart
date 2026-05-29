import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/payment.dart';

class PaymentsRepository {
  SupabaseClient get _db => Supabase.instance.client;

  Future<List<Payment>> listPayments() async {
    final rows = await _db.from('payments').select('*').order('created_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>().map(Payment.fromRow).toList();
  }

  Future<void> createPayment({
    required String memberId,
    required double amount,
    required String type,
    required String method,
    required String description,
  }) async {
    await _db.from('payments').insert({
      'member_id': memberId,
      'amount': amount,
      'currency': 'INR',
      'type': type,
      'method': method,
      'status': 'COMPLETED',
      'description': description,
      'paid_date': DateTime.now().toIso8601String(),
      'due_date': DateTime.now().toIso8601String(),
    });
  }
}

