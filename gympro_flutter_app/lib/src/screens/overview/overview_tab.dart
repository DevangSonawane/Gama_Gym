import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../data/payments_repository.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';

class OverviewTab extends StatefulWidget {
  const OverviewTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<OverviewTab> {
  final _membersRepo = MembersRepository();
  final _paymentsRepo = PaymentsRepository();

  int? _memberCount;
  double? _totalRevenue;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final members = await _membersRepo.listMembers();
      final payments = await _paymentsRepo.listPayments();
      final revenue = payments
          .where((p) => p.status.toUpperCase() == 'COMPLETED')
          .fold<double>(0, (sum, p) => sum + p.amount);
      setState(() {
        _memberCount = members.length;
        _totalRevenue = revenue;
      });
    } catch (_) {
      setState(() {
        _memberCount = null;
        _totalRevenue = null;
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authController.user!;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          AppSurface(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back, ${user.firstName}',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Here’s what’s happening at your gym today.',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    color: AppTokens.brand.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.auto_awesome, color: AppTokens.brand),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const AppSectionTitle(
            title: 'Quick stats',
            subtitle: 'A simple snapshot of your business.',
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 520;
              final children = [
                _StatCard(
                  title: 'Members',
                  value: _loading ? null : (_memberCount?.toString() ?? '—'),
                  icon: Icons.people_outline,
                  onTap: () => context.go('/dashboard?tab=members'),
                ),
                _StatCard(
                  title: 'Revenue',
                  value: _loading ? null : (_totalRevenue == null ? '—' : 'INR ${_totalRevenue!.toStringAsFixed(0)}'),
                  icon: Icons.payments_outlined,
                  onTap: () => context.go('/dashboard?tab=payments'),
                ),
                _StatCard(
                  title: 'Classes',
                  value: '—',
                  icon: Icons.calendar_month_outlined,
                  onTap: () => context.go('/dashboard?tab=classes'),
                ),
              ];

              if (isNarrow) {
                return Column(
                  children: [
                    for (final c in children) ...[
                      c,
                      const SizedBox(height: 10),
                    ],
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(child: children[0]),
                  const SizedBox(width: 10),
                  Expanded(child: children[1]),
                  const SizedBox(width: 10),
                  Expanded(child: children[2]),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          const AppSectionTitle(
            title: 'Actions',
            subtitle: 'Common tasks and shortcuts.',
          ),
          const SizedBox(height: 12),
          AppSurface(
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _ActionPill(
                  icon: Icons.person_add_alt_1,
                  label: 'Add member',
                  onTap: () => context.go('/members/new'),
                ),
                _ActionPill(
                  icon: Icons.badge_outlined,
                  label: 'Add staff',
                  onTap: () => context.go('/staff/new'),
                ),
                _ActionPill(
                  icon: Icons.receipt_long_outlined,
                  label: 'New payment',
                  onTap: () => context.go('/payments/new'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String? value;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: AppTokens.r20,
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: AppTokens.r20,
          border: Border.all(color: AppTokens.brand.withValues(alpha: 0.10)),
          boxShadow: AppTokens.softShadow(opacity: 0.06),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: AppTokens.brand.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppTokens.brand),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    value ?? '…',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}

class _ActionPill extends StatelessWidget {
  const _ActionPill({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: AppTokens.pill,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTokens.brand.withValues(alpha: 0.08),
          borderRadius: AppTokens.pill,
          border: Border.all(color: AppTokens.brand.withValues(alpha: 0.14)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: AppTokens.brand),
            const SizedBox(width: 10),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}

