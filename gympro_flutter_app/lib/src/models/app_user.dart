enum AppRole {
  admin,
  manager,
  trainer,
  staff,
  member,
}

AppRole parseAppRole(String raw) {
  final v = raw.trim();
  if (v.isEmpty) return AppRole.member;
  switch (v.toLowerCase()) {
    case 'admin':
      return AppRole.admin;
    case 'manager':
      return AppRole.manager;
    case 'trainer':
      return AppRole.trainer;
    case 'staff':
      return AppRole.staff;
    case 'member':
      return AppRole.member;
  }
  switch (v.toUpperCase()) {
    case 'ADMIN':
      return AppRole.admin;
    case 'MANAGER':
      return AppRole.manager;
    case 'TRAINER':
      return AppRole.trainer;
    case 'STAFF':
      return AppRole.staff;
    case 'MEMBER':
      return AppRole.member;
  }
  return AppRole.member;
}

class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.isActive,
    this.phoneNumber,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phoneNumber;
  final AppRole role;
  final bool isActive;

  String get fullName => '$firstName $lastName'.trim();

  Map<String, Object?> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        'role': role.name,
        'isActive': isActive,
      };

  static AppUser fromJson(Map<String, Object?> json) {
    return AppUser(
      id: (json['id'] as String?) ?? '',
      email: (json['email'] as String?) ?? '',
      firstName: (json['firstName'] as String?) ?? '',
      lastName: (json['lastName'] as String?) ?? '',
      phoneNumber: json['phoneNumber'] as String?,
      role: parseAppRole((json['role'] as String?) ?? ''),
      isActive: (json['isActive'] as bool?) ?? true,
    );
  }
}

