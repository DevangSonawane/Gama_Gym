import 'package:flutter/material.dart';

const _brand = Color(0xFF00BC7D);
const _border = Color(0xFFE5E7EB); // Tailwind gray-200

OutlineInputBorder _roundedBorder(Color color, {double width = 1}) {
  return OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: BorderSide(color: color, width: width),
  );
}

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: _brand,
    brightness: Brightness.light,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: const Color(0xFFF7F8FA),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: _brand,
      selectionColor: Color(0x3300BC7D),
      selectionHandleColor: _brand,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
    ),
    cardTheme: const CardThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: _roundedBorder(_border),
      enabledBorder: _roundedBorder(_border),
      focusedBorder: _roundedBorder(_brand, width: 1.6),
      errorBorder: _roundedBorder(scheme.error),
      focusedErrorBorder: _roundedBorder(scheme.error, width: 1.6),
      hintStyle: TextStyle(color: scheme.onSurfaceVariant.withValues(alpha: 0.85)),
      labelStyle: TextStyle(color: scheme.onSurfaceVariant),
    ),
  );
}
