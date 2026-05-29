import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:file_selector/file_selector.dart';
import 'package:path_provider/path_provider.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

Future<String> downloadPdf({
  required Uint8List bytes,
  required String filename,
}) async {
  if (kDebugMode) {
    debugPrint(
      '[ReceiptDownloader][IO] start platform=${Platform.operatingSystem} '
      'bytes=${bytes.lengthInBytes} filename="$filename"',
    );
  }
  try {
    if (kDebugMode) debugPrint('[ReceiptDownloader][IO] trying Printing.sharePdf');
    await Printing.sharePdf(bytes: bytes, filename: filename);
    if (kDebugMode) debugPrint('[ReceiptDownloader][IO] Printing.sharePdf OK');
    return 'Receipt ready to share';
  } on MissingPluginException catch (e, st) {
    // Some platforms (notably certain desktop builds) don't implement Printing.sharePdf.
    // Fall back to a save dialog.
    if (kDebugMode) {
      debugPrint('[ReceiptDownloader][IO] MissingPluginException: $e');
      debugPrintStack(stackTrace: st);
    }
  } catch (e, st) {
    if (kDebugMode) {
      debugPrint('[ReceiptDownloader][IO] Printing.sharePdf FAILED: $e');
      debugPrintStack(stackTrace: st);
    }
  }

  // Android/iOS: share the file via system share sheet (users can "Save to Files"/Drive/etc.).
  if (Platform.isAndroid || Platform.isIOS) {
    try {
      if (kDebugMode) debugPrint('[ReceiptDownloader][IO] trying share_plus (mobile)');
      final dir = await getTemporaryDirectory();
      final outPath = _joinPath(dir.path, filename);
      await File(outPath).writeAsBytes(bytes, flush: true);
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(outPath, mimeType: 'application/pdf', name: filename)],
          text: 'Receipt',
        ),
      );
      if (kDebugMode) debugPrint('[ReceiptDownloader][IO] share_plus OK -> $outPath');
      return 'Receipt shared';
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[ReceiptDownloader][IO] share_plus FAILED: $e');
        debugPrintStack(stackTrace: st);
      }
      return 'Failed to share receipt: $e';
    }
  }

  try {
    if (kDebugMode) debugPrint('[ReceiptDownloader][IO] trying file_selector save dialog');
    final location = await getSaveLocation(
      suggestedName: filename,
      acceptedTypeGroups: const [
        XTypeGroup(label: 'PDF', extensions: ['pdf']),
      ],
    );
    if (location == null) return 'Download cancelled';
    final xfile = XFile.fromData(
      bytes,
      name: filename,
      mimeType: 'application/pdf',
    );
    await xfile.saveTo(location.path);
    if (kDebugMode) debugPrint('[ReceiptDownloader][IO] file_selector saved -> ${location.path}');
    return 'Saved to ${location.path}';
  } catch (e, st) {
    // If file_selector isn't available, fall back to saving into Downloads.
    if (kDebugMode) {
      debugPrint('[ReceiptDownloader][IO] file_selector FAILED: $e');
      debugPrintStack(stackTrace: st);
    }
  }

  final downloads = _guessDownloadsDirectory();
  if (kDebugMode) {
    debugPrint('[ReceiptDownloader][IO] fallback Downloads dir -> ${downloads.path}');
  }
  if (!downloads.existsSync()) {
    downloads.createSync(recursive: true);
  }
  final outPath = _joinPath(downloads.path, filename);
  try {
    await File(outPath).writeAsBytes(bytes, flush: true);
    if (kDebugMode) debugPrint('[ReceiptDownloader][IO] wrote file -> $outPath');
    return 'Saved to ${downloads.path}';
  } on FileSystemException catch (e) {
    if (kDebugMode) {
      debugPrint('[ReceiptDownloader][IO] write FAILED: ${e.message} (path: $outPath)');
    }
    return 'Failed to save receipt: ${e.message} (path: $outPath)';
  }
}

Directory _guessDownloadsDirectory() {
  final env = Platform.environment;
  String home;
  if (Platform.isWindows) {
    final userProfile = env['USERPROFILE'];
    if (userProfile != null && userProfile.trim().isNotEmpty) {
      home = userProfile;
    } else {
      final homeDrive = env['HOMEDRIVE'] ?? '';
      final homePath = env['HOMEPATH'] ?? '';
      final combined = '$homeDrive$homePath';
      home = combined.trim().isEmpty ? Directory.current.path : combined;
    }
  } else {
    home = env['HOME'] ?? Directory.current.path;
  }

  final downloadsPath = _joinPath(home, 'Downloads');
  final dir = Directory(downloadsPath);
  if (dir.existsSync()) return dir;
  return Directory(home);
}

String _joinPath(String a, String b) {
  final sep = Platform.pathSeparator;
  if (a.endsWith(sep)) return '$a$b';
  return '$a$sep$b';
}
