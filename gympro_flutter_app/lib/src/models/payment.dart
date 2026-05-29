class Payment {
  const Payment({
    required this.id,
    required this.memberId,
    required this.amount,
    required this.currency,
    required this.type,
    required this.method,
    required this.status,
    required this.description,
    this.paidDate,
    this.dueDate,
  });

  final String id;
  final String memberId;
  final double amount;
  final String currency;
  final String type;
  final String method;
  final String status;
  final String description;
  final DateTime? paidDate;
  final DateTime? dueDate;

  static Payment fromRow(Map<String, dynamic> row) {
    DateTime? parseDate(Object? v) {
      if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
      return null;
    }

    return Payment(
      id: (row['id'] as String?) ?? '',
      memberId: (row['member_id'] as String?) ?? '',
      amount: (row['amount'] is num) ? (row['amount'] as num).toDouble() : double.tryParse('${row['amount']}') ?? 0,
      currency: (row['currency'] as String?) ?? 'INR',
      type: (row['type'] as String?) ?? '',
      method: (row['method'] as String?) ?? '',
      status: (row['status'] as String?) ?? '',
      description: (row['description'] as String?) ?? '',
      paidDate: parseDate(row['paid_date']),
      dueDate: parseDate(row['due_date']),
    );
  }
}

