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
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final AppRole role;
  final String department;
  final String position;
  final String? phone;

  String get fullName => '$firstName $lastName'.trim();

  static StaffMember fromRow(Map<String, dynamic> row) {
    return StaffMember(
      id: (row['id'] as String?) ?? '',
      firstName: (row['first_name'] as String?) ?? '',
      lastName: (row['last_name'] as String?) ?? '',
      email: (row['email'] as String?) ?? '',
      phone: row['phone'] as String?,
      role: parseAppRole((row['role'] as String?) ?? ''),
      department: (row['department'] as String?) ?? '',
      position: (row['position'] as String?) ?? '',
    );
  }
}

