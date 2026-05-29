import 'gym_class.dart';

class ClassSchedule {
  const ClassSchedule({
    required this.id,
    required this.gymId,
    required this.classId,
    required this.gymClass,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.roomName,
    required this.bookedCount,
    required this.waitlistCount,
    required this.status,
  });

  final String id;
  final String gymId;
  final String classId;
  final GymClass gymClass;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String roomName;
  final int bookedCount;
  final int waitlistCount;
  final String status;

  double get fillPercent {
    final cap = gymClass.capacity <= 0 ? 1 : gymClass.capacity;
    final pct = bookedCount / cap;
    if (pct.isNaN || pct.isInfinite) return 0;
    return pct.clamp(0, 1);
  }
}

