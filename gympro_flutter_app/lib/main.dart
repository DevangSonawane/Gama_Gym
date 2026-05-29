import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app.dart';
import 'src/env.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: '.env');
    final env = AppEnv.fromDotEnv(dotenv);

    await Supabase.initialize(
      url: env.supabaseUrl,
      anonKey: env.supabaseAnonKey,
    );

    runApp(App(env: env));
  } catch (e, st) {
    runApp(BootFailureApp(error: e, stackTrace: st));
  }
}

class BootFailureApp extends StatelessWidget {
  const BootFailureApp({super.key, required this.error, required this.stackTrace});

  final Object error;
  final StackTrace stackTrace;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GAMA (Boot Error)',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ListView(
              children: [
                const Text(
                  'App failed to start',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Most common causes:\n'
                  '- `.env` not bundled as an asset\n'
                  '- Missing `SUPABASE_URL` / `SUPABASE_ANON_KEY`\n'
                  '- Invalid Supabase config\n',
                ),
                const SizedBox(height: 12),
                Text('Error: $error'),
                const SizedBox(height: 12),
                const Text('Stack trace:'),
                const SizedBox(height: 6),
                Text(
                  stackTrace.toString(),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
