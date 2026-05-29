import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  const AppEnv({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.defaultGymId,
  });

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String defaultGymId;

  static AppEnv fromDotEnv(DotEnv env) {
    final supabaseUrl = (env.env['SUPABASE_URL'] ?? '').trim();
    final supabaseAnonKey = (env.env['SUPABASE_ANON_KEY'] ?? '').trim();
    final defaultGymId = (env.env['DEFAULT_GYM_ID'] ?? '').trim();

    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw StateError(
        'Missing SUPABASE_URL / SUPABASE_ANON_KEY in .env. '
        'Copy `.env.example` to `.env` and fill the values.',
      );
    }

    return AppEnv(
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: supabaseAnonKey,
      defaultGymId: defaultGymId,
    );
  }
}

