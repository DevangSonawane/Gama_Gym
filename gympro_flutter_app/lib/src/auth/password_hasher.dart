import 'dart:convert';

import 'package:crypto/crypto.dart';

String sha256Hex(String input) {
  final bytes = utf8.encode(input);
  return sha256.convert(bytes).toString();
}

