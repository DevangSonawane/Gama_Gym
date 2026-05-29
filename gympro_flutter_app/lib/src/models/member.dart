class Member {
  const Member({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.membershipType,
    required this.planPrice,
    required this.status,
    this.phone,
    this.dob,
    this.weight,
    this.heightCm,
    this.trainerId,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.emergencyContactRelationship,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String membershipType;
  final double? planPrice;
  final String status;
  final String? phone;
  final DateTime? dob;
  final double? weight;
  final double? heightCm;
  final String? trainerId;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? emergencyContactRelationship;

  String get fullName => '$firstName $lastName'.trim();

  static Member fromRow(Map<String, dynamic> row) {
    DateTime? dob;
    final dobRaw = row['dob'];
    if (dobRaw is String && dobRaw.isNotEmpty) {
      dob = DateTime.tryParse(dobRaw);
    }

    double? parseNum(Object? v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    return Member(
      id: (row['id'] as String?) ?? '',
      firstName: (row['first_name'] as String?) ?? '',
      lastName: (row['last_name'] as String?) ?? '',
      email: (row['email'] as String?) ?? '',
      phone: row['phone'] as String?,
      membershipType: (row['membership_type'] as String?) ?? '',
      planPrice: parseNum(row['plan_price']),
      status: (row['status'] as String?) ?? '',
      dob: dob,
      weight: parseNum(row['weight']),
      heightCm: parseNum(row['height']),
      trainerId: row['trainer_id'] as String?,
      emergencyContactName: row['emergency_contact_name'] as String?,
      emergencyContactPhone: row['emergency_contact_phone'] as String?,
      emergencyContactRelationship:
          row['emergency_contact_relationship'] as String?,
    );
  }
}
