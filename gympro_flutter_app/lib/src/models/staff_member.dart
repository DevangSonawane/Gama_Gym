import 'app_user.dart';

class StaffMember {
  const StaffMember({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    required this.department,
    required this.position,
    this.phone,
    this.salary,
    this.bio,
    this.specializations = const [],
    this.yearsExperience = 0,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final AppRole role;
  final String department;
  final String position;
  final String? phone;
  final double? salary;
  final String? bio;
  final List<String> specializations;
  final double yearsExperience;

  String get fullName => '$firstName $lastName'.trim();

  static StaffMember fromRow(Map<String, dynamic> row) {
    double? parseNum(Object? v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    final specsRaw = row['specializations'];
    final specs = specsRaw is List
        ? specsRaw
            .whereType<Object?>()
            .map((e) => e?.toString() ?? '')
            .where((e) => e.trim().isNotEmpty)
            .toList()
        : <String>[];

    return StaffMember(
      id: (row['id'] as String?) ?? '',
      firstName: (row['first_name'] as String?) ?? '',
      lastName: (row['last_name'] as String?) ?? '',
      email: (row['email'] as String?) ?? '',
      phone: row['phone'] as String?,
      role: parseAppRole((row['role'] as String?) ?? ''),
      department: (row['department'] as String?) ?? '',
      position: (row['position'] as String?) ?? '',
      salary: parseNum(row['salary']),
      bio: row['bio'] as String?,
      specializations: specs,
      yearsExperience: parseNum(row['years_experience']) ?? 0,
    );
  }
}
