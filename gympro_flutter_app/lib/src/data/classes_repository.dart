import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/class_schedule.dart';
import '../models/gym_class.dart';
import '../models/staff_member.dart';

class ClassesRepository {
  SupabaseClient get _db => Supabase.instance.client;

  Future<List<ClassSchedule>> listSchedules() async {
    final classRowsRaw = await _db.from('classes').select('*');
    final classRows =
        (classRowsRaw as List).cast<Map<String, dynamic>>().toList();

    if (classRows.isEmpty) return const [];

    final instructorIds = classRows
        .map((c) => c['instructor_id'])
        .whereType<String>()
        .where((id) => id.trim().isNotEmpty)
        .toSet()
        .toList();

    final Map<String, StaffMember> instructorsById = {};
    if (instructorIds.isNotEmpty) {
      final trainersRaw =
          await _db.from('staff').select('*').inFilter('id', instructorIds);
      final trainers = (trainersRaw as List).cast<Map<String, dynamic>>();
      for (final t in trainers) {
        final staff = StaffMember.fromRow(t);
        if (staff.id.isNotEmpty) instructorsById[staff.id] = staff;
      }
    }

    final classesById = <String, GymClass>{};
    for (final row in classRows) {
      final id = (row['id'] as String?) ?? '';
      if (id.isEmpty) continue;
      final instructorId = row['instructor_id'] as String?;
      final instructor =
          instructorId == null ? null : instructorsById[instructorId];
      classesById[id] = GymClass.fromRow(row, instructor: instructor);
    }

    final schedulesRaw = await _db
        .from('class_schedules')
        .select('*')
        .order('date', ascending: true);
    final schedules = (schedulesRaw as List).cast<Map<String, dynamic>>();

    final result = <ClassSchedule>[];
    for (final s in schedules) {
      final classId = (s['class_id'] as String?) ?? '';
      final gymClass = classesById[classId];
      if (gymClass == null) continue;

      final dateStr = (s['date'] as String?) ?? '';
      final parsedDate = DateTime.tryParse(dateStr);
      if (parsedDate == null) continue;

      result.add(
        ClassSchedule(
          id: (s['id'] as String?) ?? '',
          gymId: (s['gym_id'] as String?) ?? '',
          classId: classId,
          gymClass: gymClass,
          date: parsedDate,
          startTime: (s['start_time'] as String?) ?? '',
          endTime: (s['end_time'] as String?) ?? '',
          roomName: 'Main Studio',
          bookedCount: (s['booked_count'] as int?) ?? 0,
          waitlistCount: (s['waitlist_count'] as int?) ?? 0,
          status: (s['status'] as String?) ?? 'scheduled',
        ),
      );
    }

    return result;
  }

  Future<String> createClass({
    required String gymId,
    required String name,
    required String description,
    required String? instructorId,
    required int capacity,
    required int durationMinutes,
    required double price,
    required String category,
    required String difficulty,
    required List<String> equipment,
    required bool isActive,
  }) async {
    final inserted = await _db.from('classes').insert({
      'gym_id': gymId,
      'name': name,
      'description': description,
      'instructor_id': (instructorId == null || instructorId.trim().isEmpty)
          ? null
          : instructorId.trim(),
      'capacity': capacity,
      'duration': durationMinutes,
      'price': price,
      'category': category,
      'difficulty': difficulty,
      'equipment': equipment,
      'is_active': isActive,
    }).select().maybeSingle();

    final row = inserted == null ? null : (inserted as Map).cast<String, dynamic>();
    final id = (row?['id'] as String?) ?? '';
    return id;
  }

  Future<void> createSchedule({
    required String gymId,
    required String classId,
    required DateTime date,
    required String startTime,
    required String endTime,
  }) async {
    await _db.from('class_schedules').insert({
      'gym_id': gymId,
      'class_id': classId,
      'date': date.toIso8601String().split('T').first,
      'start_time': startTime,
      'end_time': endTime,
      'room_id': null,
      'booked_count': 0,
      'waitlist_count': 0,
      'status': 'scheduled',
    });
  }
}
