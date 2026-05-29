import 'package:supabase_flutter/supabase_flutter.dart';

import '../gym_context.dart';
import '../models/member.dart';

class MembersRepository {
  SupabaseClient get _db => Supabase.instance.client;

  bool _isMissingColumn(PostgrestException e, String column) {
    final msg = e.message.toLowerCase();
    return msg.contains('column') && msg.contains(column.toLowerCase());
  }

  Map<String, Object?> _withoutKeys(
    Map<String, Object?> payload,
    Iterable<String> keys,
  ) {
    final copy = Map<String, Object?>.from(payload);
    for (final k in keys) {
      copy.remove(k);
    }
    return copy;
  }

  Future<List<Member>> listMembers() async {
    final rows = await _db
        .from('members')
        .select('*')
        .order('created_at', ascending: false);
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(Member.fromRow)
        .toList();
  }

  Future<Member?> getMember(String id) async {
    final row = await _db
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (row == null) return null;
    return Member.fromRow((row as Map).cast<String, dynamic>());
  }

  Future<void> createMember({
    required String firstName,
    required String lastName,
    required String email,
    required String membershipType,
    String? membershipBillingCycle,
    String? phone,
    DateTime? dob,
    String? trainerId,
    double? weight,
    double? heightCm,
    double? planPrice,
    String? address,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    bool isActive = true,
  }) async {
    final gymId = GymContext.defaultGymId;
    if (gymId.isEmpty) {
      throw StateError(
        'DEFAULT_GYM_ID is missing in .env (required for members.gym_id)',
      );
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
      'billing_cycle':
          (membershipBillingCycle == null ||
              membershipBillingCycle.trim().isEmpty)
          ? null
          : membershipBillingCycle.trim(),
      'address': (address == null || address.trim().isEmpty)
          ? null
          : address.trim(),
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty)
          ? null
          : trainerId.trim(),
    };

    final extra = <String, Object?>{
      'emergency_contact_name':
          (emergencyContactName == null || emergencyContactName.trim().isEmpty)
          ? null
          : emergencyContactName.trim(),
      'emergency_contact_phone':
          (emergencyContactPhone == null ||
              emergencyContactPhone.trim().isEmpty)
          ? null
          : emergencyContactPhone.trim(),
      'emergency_contact_relationship':
          (emergencyContactRelationship == null ||
              emergencyContactRelationship.trim().isEmpty)
          ? null
          : emergencyContactRelationship.trim(),
    };

    try {
      await _db.from('members').insert({...basePayload, ...extra});
    } on PostgrestException catch (e) {
      final full = {...basePayload, ...extra};
      final optionalKeys = <String>[
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'billing_cycle',
        'address',
      ];

      for (final k in optionalKeys) {
        if (_isMissingColumn(e, k)) {
          await _db.from('members').insert(_withoutKeys(full, [k]));
          return;
        }
      }

      if (e.message.toLowerCase().contains('column') &&
          e.message.toLowerCase().contains('emergency')) {
        await _db
            .from('members')
            .insert(
              _withoutKeys(full, [
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
              ]),
            );
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
    String? membershipBillingCycle,
    String? phone,
    DateTime? dob,
    String? trainerId,
    double? weight,
    double? heightCm,
    double? planPrice,
    String? address,
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
      'billing_cycle':
          (membershipBillingCycle == null ||
              membershipBillingCycle.trim().isEmpty)
          ? null
          : membershipBillingCycle.trim(),
      'address': (address == null || address.trim().isEmpty)
          ? null
          : address.trim(),
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
      'trainer_id': (trainerId == null || trainerId.trim().isEmpty)
          ? null
          : trainerId.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    final extra = <String, Object?>{
      'emergency_contact_name':
          (emergencyContactName == null || emergencyContactName.trim().isEmpty)
          ? null
          : emergencyContactName.trim(),
      'emergency_contact_phone':
          (emergencyContactPhone == null ||
              emergencyContactPhone.trim().isEmpty)
          ? null
          : emergencyContactPhone.trim(),
      'emergency_contact_relationship':
          (emergencyContactRelationship == null ||
              emergencyContactRelationship.trim().isEmpty)
          ? null
          : emergencyContactRelationship.trim(),
    };

    try {
      await _db.from('members').update({...basePayload, ...extra}).eq('id', id);
    } on PostgrestException catch (e) {
      final full = {...basePayload, ...extra};
      final optionalKeys = <String>[
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'billing_cycle',
        'address',
      ];

      for (final k in optionalKeys) {
        if (_isMissingColumn(e, k)) {
          await _db
              .from('members')
              .update(_withoutKeys(full, [k]))
              .eq('id', id);
          return;
        }
      }

      if (e.message.toLowerCase().contains('column') &&
          e.message.toLowerCase().contains('emergency')) {
        await _db
            .from('members')
            .update(
              _withoutKeys(full, [
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
              ]),
            )
            .eq('id', id);
        return;
      }

      rethrow;
    }
  }

  Future<void> deleteMember(String id) async {
    await _db.from('members').delete().eq('id', id);
  }
}
