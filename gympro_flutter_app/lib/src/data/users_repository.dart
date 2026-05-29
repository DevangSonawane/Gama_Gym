import 'package:supabase_flutter/supabase_flutter.dart';

import '../auth/password_hasher.dart';
import '../models/user_row.dart';

class UsersRepository {
  SupabaseClient get _db => Supabase.instance.client;

  Future<List<UserRow>> listUsers() async {
    final rows = await _db.from('users').select('*').order('created_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>().map(UserRow.fromRow).toList();
  }

  Future<UserRow?> getUser(String id) async {
    final row = await _db.from('users').select('*').eq('id', id).maybeSingle();
    if (row == null) return null;
    return UserRow.fromRow((row as Map).cast<String, dynamic>());
  }

  Future<void> createUser({
    required String firstName,
    required String lastName,
    required String email,
    required String role,
    required bool isActive,
    String? phoneNumber,
    required String password,
  }) async {
    final passwordHash = sha256Hex(password);
    await _db.from('users').insert({
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone_number': (phoneNumber == null || phoneNumber.trim().isEmpty) ? null : phoneNumber.trim(),
      'password_hash': passwordHash,
      'role': role,
      'is_active': isActive,
    });
  }

  Future<void> updateUser({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
    required String role,
    required bool isActive,
    String? phoneNumber,
    String? newPassword,
  }) async {
    final updates = <String, Object?>{
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone_number': (phoneNumber == null || phoneNumber.trim().isEmpty) ? null : phoneNumber.trim(),
      'role': role,
      'is_active': isActive,
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (newPassword != null && newPassword.isNotEmpty) {
      updates['password_hash'] = sha256Hex(newPassword);
    }
    await _db.from('users').update(updates).eq('id', id);
  }

  Future<void> deleteUser(String id) async {
    await _db.from('users').delete().eq('id', id);
  }
}

