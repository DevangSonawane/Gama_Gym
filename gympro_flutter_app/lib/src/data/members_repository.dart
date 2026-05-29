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
    double? weight,
    double? heightCm,
    double? planPrice,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    bool isActive = true,
  }) async {
    final gymId = GymContext.defaultGymId;
    if (gymId.isEmpty) {
      throw StateError('DEFAULT_GYM_ID is missing in .env (required for members.gym_id)');
    }

    final dobIso = dob?.toIso8601String();

    final basePayload = <String, Object?>{
      'gym_id': gymId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'dob': dobIso?.split('T').first,
      'weight': weight?.toString(),
      'height': heightCm?.toString(),
      'membership_type': membershipType,
      'plan_price': planPrice?.toString(),
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty) ? null : trainerId.trim(),
    };

    final extra = <String, Object?>{
      'emergency_contact_name': (emergencyContactName == null || emergencyContactName.trim().isEmpty)
          ? null
          : emergencyContactName.trim(),
      'emergency_contact_phone': (emergencyContactPhone == null || emergencyContactPhone.trim().isEmpty)
          ? null
          : emergencyContactPhone.trim(),
      'emergency_contact_relationship': (emergencyContactRelationship == null || emergencyContactRelationship.trim().isEmpty)
          ? null
          : emergencyContactRelationship.trim(),
    };

    try {
      await _db.from('members').insert({...basePayload, ...extra});
    } on PostgrestException catch (e) {
      final msg = e.message.toLowerCase();
      if (msg.contains('column') && msg.contains('emergency')) {
        await _db.from('members').insert(basePayload);
        return;
      }
      rethrow;
    }
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
    double? weight,
    double? heightCm,
    double? planPrice,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    required bool isActive,
  }) async {
    final dobIso = dob?.toIso8601String();

    final basePayload = <String, Object?>{
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': (phone == null || phone.trim().isEmpty) ? null : phone.trim(),
      'dob': dobIso?.split('T').first,
      'weight': weight?.toString(),
      'height': heightCm?.toString(),
      'membership_type': membershipType,
      'plan_price': planPrice?.toString(),
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty) ? null : trainerId.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    final extra = <String, Object?>{
      'emergency_contact_name': (emergencyContactName == null || emergencyContactName.trim().isEmpty)
          ? null
          : emergencyContactName.trim(),
      'emergency_contact_phone': (emergencyContactPhone == null || emergencyContactPhone.trim().isEmpty)
          ? null
          : emergencyContactPhone.trim(),
      'emergency_contact_relationship': (emergencyContactRelationship == null || emergencyContactRelationship.trim().isEmpty)
          ? null
          : emergencyContactRelationship.trim(),
    };

    try {
      await _db.from('members').update({...basePayload, ...extra}).eq('id', id);
    } on PostgrestException catch (e) {
      final msg = e.message.toLowerCase();
      if (msg.contains('column') && msg.contains('emergency')) {
        await _db.from('members').update(basePayload).eq('id', id);
        return;
      }
      rethrow;
    }
  }

  Future<void> deleteMember(String id) async {
    await _db.from('members').delete().eq('id', id);
  }
}
