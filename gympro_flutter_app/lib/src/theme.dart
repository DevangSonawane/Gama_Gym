import 'package:flutter/material.dart';

const _brand = Color(0xFF00BC7D);

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: _brand,
    brightness: Brightness.light,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: const Color(0xFFF7F8FA),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
    ),
    cardTheme: const CardThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.white,
    ),
  );
}
