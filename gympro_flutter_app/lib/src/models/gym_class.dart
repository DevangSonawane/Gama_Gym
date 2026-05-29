import 'staff_member.dart';

class GymClass {
  const GymClass({
    required this.id,
    required this.name,
    required this.capacity,
    required this.durationMinutes,
    required this.price,
    required this.category,
    required this.difficulty,
    this.description = '',
    this.instructorId,
    this.instructor,
    this.equipment = const [],
    this.isActive = true,
  });

  final String id;
  final String name;
  final String description;
  final String? instructorId;
  final StaffMember? instructor;
  final int capacity;
  final int durationMinutes;
  final double price;
  final String category;
  final String difficulty;
  final List<String> equipment;
  final bool isActive;

  static GymClass fromRow(
    Map<String, dynamic> row, {
    StaffMember? instructor,
  }) {
    final equipmentRaw = row['equipment'];
    final equipment = equipmentRaw is List
        ? equipmentRaw
            .whereType<Object?>()
            .map((e) => e?.toString() ?? '')
            .where((e) => e.trim().isNotEmpty)
            .toList()
        : <String>[];

    return GymClass(
      id: (row['id'] as String?) ?? '',
      name: (row['name'] as String?) ?? '',
      description: (row['description'] as String?) ?? '',
      instructorId: row['instructor_id'] as String?,
      instructor: instructor,
      capacity: (row['capacity'] as int?) ?? 0,
      durationMinutes: (row['duration'] as int?) ?? 0,
      price: (row['price'] as num?)?.toDouble() ?? 0,
      category: (row['category'] as String?) ?? 'General',
      difficulty: (row['difficulty'] as String?) ?? 'Beginner',
      equipment: equipment,
      isActive: (row['is_active'] as bool?) ?? true,
    );
  }
}

