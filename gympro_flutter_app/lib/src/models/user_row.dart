class UserRow {
  const UserRow({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    required this.isActive,
    this.phoneNumber,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final bool isActive;
  final String? phoneNumber;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName'.trim();

  static UserRow fromRow(Map<String, dynamic> row) {
    return UserRow(
      id: (row['id'] as String?) ?? '',
      firstName: (row['first_name'] as String?) ?? '',
      lastName: (row['last_name'] as String?) ?? '',
      email: (row['email'] as String?) ?? '',
      phoneNumber: row['phone_number'] as String?,
      role: (row['role'] as String?) ?? 'member',
      isActive: (row['is_active'] as bool?) ?? true,
      createdAt: DateTime.tryParse((row['created_at'] as String?) ?? ''),
      updatedAt: DateTime.tryParse((row['updated_at'] as String?) ?? ''),
    );
  }
}
