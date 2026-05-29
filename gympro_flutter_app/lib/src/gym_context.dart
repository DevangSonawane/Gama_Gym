import 'package:flutter_dotenv/flutter_dotenv.dart';

class GymContext {
  static String get defaultGymId => (dotenv.env['DEFAULT_GYM_ID'] ?? '').trim();
}

