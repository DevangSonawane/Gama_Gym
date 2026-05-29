import 'package:supabase_flutter/supabase_flutter.dart';

import '../gym_context.dart';
import '../models/member.dart';

class MembersRepository {
  SupabaseClient get _db => Supabase.instance.client;

  Future<List<Member>> listMembers() async {
    final rows = await _db.from('members').select('*').order('created_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>().map(Member.fromRow).toList();
  }

  Future<Member?> getMember(String id) async {
    final row = await _db.from('members').select('*').eq('id', id).maybeSingle();
    if (row == null) return null;
    return Member.fromRow((row as Map).cast<String, dynamic>());
  }

  Future<void> createMember({
    required String firstName,
    required String lastName,
    required String email,
    required String membershipType,
    String? phone,
    DateTime? dob,
    String? trainerId,
    bool isActive = true,
  }) async {
    final gymId = GymContext.defaultGymId;
    if (gymId.isEmpty) {
      throw StateError('DEFAULT_GYM_ID is missing in .env (required for members.gym_id)');
    }

    final dobIso = dob?.toIso8601String();

    await _db.from('members').insert({
      'gym_id': gymId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'dob': dobIso?.split('T').first,
      'membership_type': membershipType,
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty) ? null : trainerId.trim(),
    });
  }

  Future<void> updateMember({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
    required String membershipType,
    String? phone,
    DateTime? dob,
    String? trainerId,
    required bool isActive,
  }) async {
    final dobIso = dob?.toIso8601String();

    await _db.from('members').update({
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'dob': dobIso?.split('T').first,
      'membership_type': membershipType,
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty) ? null : trainerId.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  Future<void> deleteMember(String id) async {
    await _db.from('members').delete().eq('id', id);
  }
}
