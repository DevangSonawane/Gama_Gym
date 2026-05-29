import 'package:flutter/material.dart';

class AppTokens {
  static const brand = Color(0xFF00BC7D);
  static const brandDark = Color(0xFF009664);
  static const pageBg = Color(0xFFF6F8FA);

  static BorderRadius get r12 => BorderRadius.circular(12);
  static BorderRadius get r16 => BorderRadius.circular(16);
  static BorderRadius get r20 => BorderRadius.circular(20);
  static BorderRadius get pill => BorderRadius.circular(999);

  static List<BoxShadow> softShadow({double opacity = 0.08}) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: opacity),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ];
}

