import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/payments_repository.dart';
import '../../models/payment.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

class PaymentsTab extends StatefulWidget {
  const PaymentsTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  final _repo = PaymentsRepository();
  bool _loading = true;
  String? _error;
  List<Payment> _payments = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final payments = await _repo.listPayments();
      setState(() => _payments = payments);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          const AppSectionTitle(
            title: 'Payments',
            subtitle: 'Track transactions, invoices, and promo codes.',
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SizedBox.shrink(),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppTokens.brand,
                  shape: RoundedRectangleBorder(borderRadius: AppTokens.pill),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onPressed: () => context.go('/payments/new'),
                child: const Icon(Icons.add),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: AppTokens.pill),
                  side: BorderSide(color: AppTokens.brand.withValues(alpha: 0.25)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onPressed: () => context.go('/promocodes/new'),
                child: const Icon(Icons.sell_outlined),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            AppSurface(child: Text(_error!))
          else if (_payments.isEmpty)
            EmptyState(
              title: 'No payments',
              subtitle: 'Record payments and generate invoices.',
              icon: Icons.payments_outlined,
              action: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
                onPressed: () => context.go('/payments/new'),
                child: const Text('New Payment'),
              ),
            )
          else
            AppSurface(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final p in _payments) ...[
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      leading: Container(
                        height: 40,
                        width: 40,
                        decoration: BoxDecoration(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.receipt_long_outlined, color: AppTokens.brand),
                      ),
                      title: Text(
                        '${p.currency} ${p.amount.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      subtitle: Text(
                        '${p.status} • ${p.type}\n${p.description}',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                      isThreeLine: true,
                    ),
                    if (p.id != _payments.last.id)
                      Divider(height: 1, color: Colors.black.withValues(alpha: 0.06)),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}
