import 'package:supabase_flutter/supabase_flutter.dart';

class EquipmentRepository {
  SupabaseClient get _db => Supabase.instance.client;

  /// Returns percent (0-100) of equipment considered "OK".
  ///
  /// Assumes a Supabase table named `equipment` with a `status` column.
  /// If the table/column doesn't exist (or user has no access), this will throw.
  Future<int> fetchOkPercentage() async {
    final rowsRaw = await _db.from('equipment').select('status');
    final rows = (rowsRaw as List).cast<Map<String, dynamic>>();
    if (rows.isEmpty) return 0;

    bool isOk(String status) {
      final s = status.trim().toUpperCase();
      return s == 'OK' ||
          s == 'ACTIVE' ||
          s == 'OPERATIONAL' ||
          s == 'WORKING' ||
          s == 'AVAILABLE';
    }

    final total = rows.length;
    final ok = rows
        .map((r) => r['status'])
        .whereType<String>()
        .where(isOk)
        .length;

    return ((ok * 100) / total).round().clamp(0, 100);
  }
}
