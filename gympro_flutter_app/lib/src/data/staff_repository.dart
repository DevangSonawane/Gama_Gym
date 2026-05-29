import 'package:supabase_flutter/supabase_flutter.dart';

import '../gym_context.dart';
import '../models/app_user.dart';
import '../models/staff_member.dart';

class StaffRepository {
  SupabaseClient get _db => Supabase.instance.client;

  Future<List<StaffMember>> listStaff() async {
    final rows = await _db.from('staff').select('*').order('created_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>().map(StaffMember.fromRow).toList();
  }

  Future<StaffMember?> getStaff(String id) async {
    final row = await _db.from('staff').select('*').eq('id', id).maybeSingle();
    if (row == null) return null;
    return StaffMember.fromRow((row as Map).cast<String, dynamic>());
  }

  Future<void> createStaff({
    required String firstName,
    required String lastName,
    required String email,
    required AppRole role,
    required String department,
    required String position,
    String? phone,
    required double salary,
    String? bio,
    List<String> specializations = const [],
    double yearsExperience = 0,
  }) async {
    final gymId = GymContext.defaultGymId;
    if (gymId.isEmpty) {
      throw StateError('DEFAULT_GYM_ID is missing in .env (required for staff.gym_id)');
    }

    final employeeId = 'EMP${DateTime.now().millisecondsSinceEpoch % 1000}'.padLeft(6, '0');

    await _db.from('staff').insert({
      'gym_id': gymId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'employee_id': employeeId,
      'position': position,
      'department': department,
      'role': role.name.toUpperCase(),
      'salary': salary.toString(),
      'hire_date': DateTime.now().toIso8601String().split('T').first,
      'certifications': [],
      'specializations': specializations,
      'bio': (bio == null || bio.trim().isEmpty) ? null : bio.trim(),
      'years_experience': yearsExperience,
    });
  }

  Future<void> updateStaff({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
    required AppRole role,
    required String department,
    required String position,
    String? phone,
    required double salary,
    String? bio,
    List<String> specializations = const [],
    double yearsExperience = 0,
  }) async {
    await _db.from('staff').update({
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'position': position,
      'department': department,
      'role': role.name.toUpperCase(),
      'salary': salary.toString(),
      'specializations': specializations,
      'bio': (bio == null || bio.trim().isEmpty) ? null : bio.trim(),
      'years_experience': yearsExperience,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  Future<void> deleteStaff(String id) async {
    await _db.from('staff').delete().eq('id', id);
  }
}
