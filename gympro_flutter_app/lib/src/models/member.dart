class Member {
  const Member({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.membershipType,
    required this.status,
    this.phone,
    this.dob,
    this.trainerId,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String membershipType;
  final String status;
  final String? phone;
  final DateTime? dob;
  final String? trainerId;

  String get fullName => '$firstName $lastName'.trim();

  static Member fromRow(Map<String, dynamic> row) {
    DateTime? dob;
    final dobRaw = row['dob'];
    if (dobRaw is String && dobRaw.isNotEmpty) {
      dob = DateTime.tryParse(dobRaw);
    }

    return Member(
      id: (row['id'] as String?) ?? '',
      firstName: (row['first_name'] as String?) ?? '',
      lastName: (row['last_name'] as String?) ?? '',
      email: (row['email'] as String?) ?? '',
      phone: row['phone'] as String?,
      membershipType: (row['membership_type'] as String?) ?? '',
      status: (row['status'] as String?) ?? '',
      dob: dob,
      trainerId: row['trainer_id'] as String?,
    );
  }
}

