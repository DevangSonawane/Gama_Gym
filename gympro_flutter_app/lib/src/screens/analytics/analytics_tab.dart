import 'package:flutter/material.dart';

import '../../auth/auth_controller.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';

class AnalyticsTab extends StatelessWidget {
  const AnalyticsTab({super.key, required this.authController});

  final AuthController authController;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppTokens.pageBg,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        children: const [
          AppSectionTitle(
            title: 'Analytics',
            subtitle: 'Insights and trends for your gym.',
          ),
          SizedBox(height: 12),
          AppSurface(
            child: Text(
              'Analytics is not wired up yet.\n\n'
              'Tell me which charts you want first (revenue, members, retention, attendance), '
              'and I’ll build this screen.',
            ),
          ),
        ],
      ),
    );
  }
}

