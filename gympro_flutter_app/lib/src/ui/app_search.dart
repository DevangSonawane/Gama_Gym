import 'package:flutter/material.dart';

import 'app_tokens.dart';

class AppSearchField extends StatelessWidget {
  const AppSearchField({
    super.key,
    required this.controller,
    required this.hintText,
  });

  final TextEditingController controller;
  final String hintText;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: AppTokens.pill, borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppTokens.pill,
          borderSide: BorderSide(color: AppTokens.brand.withValues(alpha: 0.10)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppTokens.pill,
          borderSide: BorderSide(color: AppTokens.brand.withValues(alpha: 0.45), width: 1.3),
        ),
      ),
    );
  }
}

