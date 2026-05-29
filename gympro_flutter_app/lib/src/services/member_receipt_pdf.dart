import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../models/member.dart';

class MemberReceiptPdf {
  static const _brand = PdfColor.fromInt(0xFF00BC7D);
  static const _dark = PdfColor.fromInt(0xFF0F172A);

  static Future<({Uint8List bytes, String receiptNumber})> build({
    required Member member,
  }) async {
    final receiptNumber =
        'REC-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    final issuedAt = DateTime.now();
    final validFrom = DateTime.now();
    final validUntil = DateTime(
      validFrom.year + 1,
      validFrom.month,
      validFrom.day,
    );

    final logoBytes = await _tryLoadAsset('assets/images/gamalog.png');
    final logoProvider = logoBytes == null ? null : pw.MemoryImage(logoBytes);

    final baseMonthly = _membershipPrice(
      member.membershipType.isEmpty ? 'Gym' : member.membershipType,
    );
    // React implementation multiplies by 80 (kept for parity).
    final baseFee = baseMonthly.toDouble() * 80;
    final gst = baseFee * 0.18;
    final total = baseFee + gst;

    final doc = pw.Document();

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: pw.EdgeInsets.zero,
        build: (context) {
          return pw.Stack(
            children: [
              // Page background.
              pw.Positioned.fill(
                child: pw.Container(color: const PdfColor.fromInt(0xFFF4F7FA)),
              ),
              pw.Column(
                children: [
                  _header(
                    logoProvider: logoProvider,
                    receiptNumber: receiptNumber,
                    issuedAt: issuedAt,
                  ),
                  pw.SizedBox(height: 10),
                  pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(horizontal: 14),
                    child: pw.Column(
                      children: [
                        _sectionTitle('MEMBER INFORMATION'),
                        pw.SizedBox(height: 10),
                        _memberInfoCard(member),
                        pw.SizedBox(height: 14),
                        _sectionTitle('MEMBERSHIP DETAILS'),
                        pw.SizedBox(height: 10),
                        _membershipDetailsTable(
                          member: member,
                          validFrom: validFrom,
                          validUntil: validUntil,
                        ),
                        pw.SizedBox(height: 14),
                        _sectionTitle('PAYMENT SUMMARY'),
                        pw.SizedBox(height: 10),
                        _paymentSummaryCard(
                          baseFee: baseFee,
                          gst: gst,
                          total: total,
                        ),
                        pw.SizedBox(height: 14),
                        _noteCard(),
                      ],
                    ),
                  ),
                  pw.Spacer(),
                  _footer(),
                ],
              ),
            ],
          );
        },
      ),
    );

    return (bytes: await doc.save(), receiptNumber: receiptNumber);
  }

  static pw.Widget _header({
    required pw.ImageProvider? logoProvider,
    required String receiptNumber,
    required DateTime issuedAt,
  }) {
    return pw.Container(
      height: 122,
      child: pw.Stack(
        children: [
          // White header bar.
          pw.Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: pw.Container(height: 58, color: PdfColors.white),
          ),
          // Thin top green stripe.
          pw.Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: pw.Container(height: 3, color: _brand),
          ),
          // Accent strip under header.
          pw.Positioned(
            left: 0,
            right: 0,
            top: 58,
            child: pw.Container(height: 4, color: _brand),
          ),
          pw.Positioned(
            left: 14,
            top: 8,
            child: logoProvider == null
                ? pw.Text(
                    'GAMA',
                    style: pw.TextStyle(
                      fontSize: 20,
                      fontWeight: pw.FontWeight.bold,
                      color: _brand,
                    ),
                  )
                : pw.Image(logoProvider, width: 55, height: 22),
          ),
          pw.Positioned(
            right: 14,
            top: 14,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(
                  'GAMA FITNESS CENTER',
                  style: pw.TextStyle(
                    fontSize: 13,
                    fontWeight: pw.FontWeight.bold,
                    color: _dark,
                  ),
                ),
                pw.SizedBox(height: 4),
                pw.Text(
                  'support@gamagym.com  |  www.gamagym.com',
                  style: pw.TextStyle(
                    fontSize: 7.5,
                    color: const PdfColor.fromInt(0xFF64748B),
                  ),
                ),
                pw.Text(
                  '+91 98765 43210  |  123 Fitness Street, Mumbai',
                  style: pw.TextStyle(
                    fontSize: 7.5,
                    color: const PdfColor.fromInt(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          pw.Positioned(
            left: 14,
            top: 48,
            child: pw.Text(
              'MEMBERSHIP RECEIPT',
              style: pw.TextStyle(
                fontSize: 8,
                fontWeight: pw.FontWeight.bold,
                color: _brand,
              ),
            ),
          ),
          // Meta strip.
          pw.Positioned(
            left: 14,
            right: 14,
            top: 68,
            child: pw.Container(
              padding: const pw.EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              decoration: pw.BoxDecoration(
                color: _dark,
                borderRadius: pw.BorderRadius.circular(6),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  _metaCol('RECEIPT NUMBER', receiptNumber),
                  _metaCol('DATE ISSUED', _fmtLongDate(issuedAt)),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'STATUS',
                        style: pw.TextStyle(
                          fontSize: 7,
                          color: const PdfColor.fromInt(0xFF64748B),
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: pw.BoxDecoration(
                          color: _brand,
                          borderRadius: pw.BorderRadius.circular(4),
                        ),
                        child: pw.Text(
                          'PAID',
                          style: pw.TextStyle(
                            fontSize: 7.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _metaCol(String label, String value) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 7,
            color: const PdfColor.fromInt(0xFF64748B),
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: pw.FontWeight.bold,
            color: const PdfColor.fromInt(0xFFE2E8F0),
          ),
        ),
      ],
    );
  }

  static pw.Widget _sectionTitle(String title) {
    return pw.Row(
      children: [
        pw.Container(width: 3, height: 12, color: _brand),
        pw.SizedBox(width: 6),
        pw.Text(
          title,
          style: pw.TextStyle(
            fontSize: 10,
            fontWeight: pw.FontWeight.bold,
            color: _dark,
          ),
        ),
      ],
    );
  }

  static pw.Widget _memberInfoCard(Member member) {
    final initials = [
      if (member.firstName.isNotEmpty) member.firstName[0],
      if (member.lastName.isNotEmpty) member.lastName[0],
    ].join().toUpperCase();

    return pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 56,
            height: 56,
            decoration: pw.BoxDecoration(
              color: const PdfColor.fromInt(0xFFD1FAE5),
              shape: pw.BoxShape.circle,
            ),
            alignment: pw.Alignment.center,
            child: pw.Text(
              initials.isEmpty ? '?' : initials,
              style: pw.TextStyle(
                fontSize: 13,
                fontWeight: pw.FontWeight.bold,
                color: const PdfColor.fromInt(0xFF009664),
              ),
            ),
          ),
          pw.SizedBox(width: 14),
          pw.Expanded(
            child: pw.Column(
              children: [
                pw.Row(
                  children: [
                    pw.Expanded(
                      child: _infoField(
                        'FULL NAME',
                        '${member.firstName} ${member.lastName}'.trim(),
                        bold: true,
                      ),
                    ),
                    pw.SizedBox(width: 12),
                    pw.Expanded(
                      child: _infoField('EMAIL ADDRESS', member.email),
                    ),
                  ],
                ),
                pw.SizedBox(height: 10),
                pw.Row(
                  children: [
                    pw.Expanded(
                      child: _infoField(
                        'PHONE NUMBER',
                        (member.phone ?? '').trim().isEmpty
                            ? 'Not provided'
                            : member.phone!,
                      ),
                    ),
                    pw.SizedBox(width: 12),
                    pw.Expanded(
                      child: _infoField(
                        'DATE OF BIRTH',
                        member.dob == null
                            ? 'Not provided'
                            : _fmtLongDate(member.dob!),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _infoField(String label, String value, {bool bold = false}) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 7,
            color: const PdfColor.fromInt(0xFF64748B),
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          value.isEmpty ? 'Not provided' : value,
          style: pw.TextStyle(
            fontSize: bold ? 10 : 9,
            fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
            color: _dark,
          ),
        ),
      ],
    );
  }

  static pw.Widget _membershipDetailsTable({
    required Member member,
    required DateTime validFrom,
    required DateTime validUntil,
  }) {
    final rows = <List<String>>[
      [
        'Membership Plan',
        member.membershipType.isEmpty ? 'Gym' : member.membershipType,
      ],
      [
        'Account Status',
        member.status.toUpperCase() == 'ACTIVE' ? 'Active' : 'Inactive',
      ],
      [
        'Member Since',
        member.createdAt == null ? '—' : _fmtLongDate(member.createdAt!),
      ],
      ['Valid From', _fmtLongDate(validFrom)],
      ['Valid Until', _fmtLongDate(validUntil)],
    ];

    return pw.Container(
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Table(
        border: pw.TableBorder.symmetric(
          inside: pw.BorderSide(
            color: const PdfColor.fromInt(0xFFE2E8F0),
            width: 0.3,
          ),
        ),
        columnWidths: const {0: pw.FixedColumnWidth(140)},
        children: [
          for (var i = 0; i < rows.length; i++)
            pw.TableRow(
              decoration: pw.BoxDecoration(
                color: i.isOdd
                    ? const PdfColor.fromInt(0xFFF0FDF4)
                    : PdfColors.white,
              ),
              children: [
                pw.Padding(
                  padding: const pw.EdgeInsets.fromLTRB(10, 8, 10, 8),
                  child: pw.Text(
                    rows[i][0],
                    style: pw.TextStyle(
                      fontSize: 8.5,
                      fontWeight: pw.FontWeight.bold,
                      color: const PdfColor.fromInt(0xFF475569),
                    ),
                  ),
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.fromLTRB(10, 8, 10, 8),
                  child: pw.Text(
                    rows[i][1],
                    style: const pw.TextStyle(fontSize: 9.5, color: _dark),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  static pw.Widget _paymentSummaryCard({
    required double baseFee,
    required double gst,
    required double total,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        children: [
          _payRow('Monthly Membership Fee', _fmtInr2(baseFee)),
          pw.SizedBox(height: 10),
          _payRow('GST (18%)', _fmtInr2(gst)),
          pw.SizedBox(height: 10),
          pw.Divider(color: const PdfColor.fromInt(0xFFE2E8F0), thickness: 0.6),
          pw.SizedBox(height: 8),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: pw.BoxDecoration(
              color: _dark,
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'TOTAL AMOUNT',
                  style: pw.TextStyle(
                    color: PdfColors.white,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
                pw.Text(
                  _fmtInr2(total),
                  style: pw.TextStyle(
                    color: _brand,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _payRow(String label, String value) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 9.5,
            color: const PdfColor.fromInt(0xFF475569),
          ),
        ),
        pw.Text(value, style: pw.TextStyle(fontSize: 9.5, color: _dark)),
      ],
    );
  }

  static pw.Widget _noteCard() {
    return pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: const PdfColor.fromInt(0xFFFEFCE8),
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(
          color: const PdfColor.fromInt(0xFFFDE047),
          width: 0.4,
        ),
      ),
      child: pw.RichText(
        text: pw.TextSpan(
          children: [
            pw.TextSpan(
              text: 'NOTE: ',
              style: pw.TextStyle(
                fontSize: 7.5,
                fontWeight: pw.FontWeight.bold,
                color: const PdfColor.fromInt(0xFF854D0E),
              ),
            ),
            pw.TextSpan(
              text:
                  'This is a computer-generated receipt and does not require a physical signature.\n'
                  'Please retain this for your records. Queries? Reach us at support@gamagym.com',
              style: const pw.TextStyle(
                fontSize: 7.5,
                color: PdfColor.fromInt(0xFF854D0E),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _footer() {
    return pw.Container(
      height: 28,
      width: double.infinity,
      color: _dark,
      child: pw.Stack(
        children: [
          pw.Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: pw.Container(height: 2, color: _brand),
          ),
          pw.Center(
            child: pw.Column(
              mainAxisAlignment: pw.MainAxisAlignment.center,
              children: [
                pw.Text(
                  'Thank you for being part of the GAMA Family!',
                  style: pw.TextStyle(
                    color: PdfColors.white,
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 10.5,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  'support@gamagym.com  •  www.gamagym.com  •  +91 98765 43210',
                  style: pw.TextStyle(
                    color: const PdfColor.fromInt(0xFF64748B),
                    fontSize: 7.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static int _membershipPrice(String membership) {
    switch (membership.trim()) {
      case 'Gym':
        return 999;
      case 'Gym + Cardio':
        return 1999;
      case 'Gym + Cardio + Crossfit':
        return 3499;
      default:
        return 999;
    }
  }

  static String _fmtLongDate(DateTime dt) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  static String _fmtInr2(num v) {
    final neg = v < 0;
    final abs = v.abs();
    final whole = abs.floor();
    final frac = ((abs - whole) * 100).round().clamp(0, 99);
    final s = '${_fmtInt(whole)}.${frac.toString().padLeft(2, '0')}';
    return '${neg ? '-' : ''}₹$s';
  }

  static String _fmtInt(int v) {
    final s = v.toString();
    final re = RegExp(r'(\d)(?=(\d{3})+(?!\d))');
    return s.replaceAllMapped(re, (m) => '${m[1]},');
  }

  static Future<Uint8List?> _tryLoadAsset(String path) async {
    try {
      final data = await rootBundle.load(path);
      return data.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }
}
