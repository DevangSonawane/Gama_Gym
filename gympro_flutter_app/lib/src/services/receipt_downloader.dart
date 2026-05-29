import 'dart:typed_data';

import 'receipt_downloader_io.dart'
    if (dart.library.html) 'receipt_downloader_web.dart' as impl;

class ReceiptDownloader {
  static Future<String> downloadPdf({
    required Uint8List bytes,
    required String filename,
  }) {
    final safeName = _sanitizeFilename(filename);
    return impl.downloadPdf(bytes: bytes, filename: safeName);
  }
}

String _sanitizeFilename(String input) {
  var name = input.trim();
  if (name.isEmpty) name = 'Receipt.pdf';

  // Strip any path components.
  name = name.replaceAll(RegExp(r'[\\/]+'), '_');

  // Replace characters that are invalid on Windows/macOS.
  name = name.replaceAll(RegExp(r'[:*?"<>|\r\n\t]+'), '_');

  // Avoid leading dots or separators.
  name = name.replaceAll(RegExp(r'^[._-]+'), '');
  if (name.isEmpty) name = 'Receipt.pdf';

  if (!name.toLowerCase().endsWith('.pdf')) name = '$name.pdf';
  return name;
}
