import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/classes_repository.dart';
import '../../data/equipment_repository.dart';
import '../../data/members_repository.dart';
import '../../data/payments_repository.dart';
import '../../ui/app_tokens.dart';

class OverviewTab extends StatefulWidget {
  const OverviewTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<OverviewTab> createState() => OverviewTabState();
}

class OverviewTabState extends State<OverviewTab> {
  final _classesRepo = ClassesRepository();
  final _equipmentRepo = EquipmentRepository();
  final _membersRepo = MembersRepository();
  final _paymentsRepo = PaymentsRepository();

  int? _memberCount;
  int? _activeClasses;
  int? _equipmentOkPct;
  double? _monthlyRevenue;
  bool _loading = true;

  void _safeSetState(VoidCallback fn) {
    if (!mounted) return;
    setState(fn);
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    _safeSetState(() => _loading = true);
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final startOfNextMonth = DateTime(now.year, now.month + 1, 1);

    int? memberCount;
    double? monthlyRevenue;
    int? activeClasses;
    int? equipmentOkPct;

    try {
      final members = await _membersRepo.listMembers();
      memberCount = members.length;
    } catch (_) {
      memberCount = null;
    }

    try {
      final payments = await _paymentsRepo.listPayments();
      monthlyRevenue = payments
          .where((p) => p.status.toUpperCase() == 'COMPLETED')
          .where((p) {
            final d = (p.paidDate ?? p.dueDate ?? now);
            return !d.isBefore(startOfMonth) && d.isBefore(startOfNextMonth);
          })
          .fold<double>(0, (sum, p) => sum + p.amount);
    } catch (_) {
      monthlyRevenue = null;
    }

    try {
      final schedules = await _classesRepo.listSchedules();
      activeClasses = schedules.where((s) {
        final st = s.status.trim().toLowerCase();
        final isActiveStatus = st != 'cancelled' && st != 'canceled';
        final inMonth =
            !s.date.isBefore(startOfMonth) && s.date.isBefore(startOfNextMonth);
        return isActiveStatus && inMonth;
      }).length;
    } catch (_) {
      activeClasses = null;
    }

    try {
      equipmentOkPct = await _equipmentRepo.fetchOkPercentage();
    } catch (_) {
      equipmentOkPct = null;
    }

    _safeSetState(() {
      _memberCount = memberCount;
      _monthlyRevenue = monthlyRevenue;
      _activeClasses = activeClasses;
      _equipmentOkPct = equipmentOkPct;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authController.user!;
    final isWide = MediaQuery.of(context).size.width >= 920;

    return ColoredBox(
      color: AppTokens.pageBg,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          children: [
            _IntroSection(
              firstName: user.firstName,
              onMembers: () => context.go('/dashboard?tab=members'),
              onSchedule: () => context.go('/dashboard?tab=classes'),
            ),
            const SizedBox(height: 14),
            const _SectionHeader(
              title: 'Key features',
              subtitle: 'Everything you need to run your gym, in one view.',
              icon: Icons.auto_awesome_outlined,
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final isNarrow = constraints.maxWidth < 720;
                const tiles = [
                  _FeatureTile(
                    icon: Icons.trending_up,
                    title: 'Growth at a glance',
                    description:
                        'Track member growth and revenue trends without leaving the dashboard.',
                    gradient: [Color(0xFF00BC7D), Color(0xFF009664)],
                  ),
                  _FeatureTile(
                    icon: Icons.calendar_month_outlined,
                    title: 'Smart scheduling',
                    description:
                        'See how classes are filling up so you can adjust capacity in real time.',
                    gradient: [Color(0xFF00BC7D), Color(0xFF10B981)],
                  ),
                  _FeatureTile(
                    icon: Icons.monitor_heart_outlined,
                    title: 'Operations overview',
                    description:
                        'Monitor staff, payments, and activity to keep your gym running smoothly.',
                    gradient: [Color(0xFF10B981), Color(0xFF14B8A6)],
                  ),
                ];

                if (isNarrow) {
                  return Column(
                    children: [
                      for (final t in tiles) ...[t, const SizedBox(height: 10)],
                    ],
                  );
                }

                return Row(
                  children: [
                    Expanded(child: tiles[0]),
                    const SizedBox(width: 10),
                    Expanded(child: tiles[1]),
                    const SizedBox(width: 10),
                    Expanded(child: tiles[2]),
                  ],
                );
              },
            ),
            const SizedBox(height: 14),
            const _SectionHeader(
              title: 'Quick stats',
              subtitle: 'A snapshot of your business this month.',
              icon: Icons.dashboard_outlined,
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: isWide ? 4 : 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: isWide ? 1.55 : 1.35,
              children: [
                _MetricCard(
                  title: 'Total Members',
                  value: _loading
                      ? null
                      : (_memberCount == null ? '—' : _fmtInt(_memberCount!)),
                  icon: Icons.people_outline,
                  gradient: const [Color(0xFF00BC7D), Color(0xFF009664)],
                  onTap: () => context.go('/dashboard?tab=members'),
                ),
                _MetricCard(
                  title: 'Active Classes',
                  value: _loading
                      ? null
                      : (_activeClasses == null
                            ? '—'
                            : _fmtInt(_activeClasses!)),
                  icon: Icons.calendar_month_outlined,
                  gradient: const [Color(0xFF00BC7D), Color(0xFF10B981)],
                  onTap: () => context.go('/dashboard?tab=classes'),
                ),
                _MetricCard(
                  title: 'Monthly Revenue',
                  value: _loading
                      ? null
                      : (_monthlyRevenue == null
                            ? '—'
                            : '₹${_fmtMoney0(_monthlyRevenue!)}'),
                  icon: Icons.payments_outlined,
                  gradient: const [Color(0xFF10B981), Color(0xFF14B8A6)],
                  onTap: () => context.go('/dashboard?tab=payments'),
                ),
                _MetricCard(
                  title: 'Equipment Status',
                  value: _loading
                      ? null
                      : (_equipmentOkPct == null
                            ? '—'
                            : _fmtInt(_equipmentOkPct!)),
                  icon: Icons.fitness_center,
                  gradient: const [Color(0xFF00BC7D), Color(0xFF0EA5E9)],
                  onTap: () {},
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

String _fmtMoney0(double v) => _fmtInt(v.round());

String _fmtInt(int v) {
  final s = v.toString();
  final re = RegExp(r'(\d)(?=(\d{3})+(?!\d))');
  return s.replaceAllMapped(re, (m) => '${m[1]},');
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 40,
          width: 40,
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
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _IntroSection extends StatelessWidget {
  const _IntroSection({
    required this.firstName,
    required this.onMembers,
    required this.onSchedule,
  });

  final String firstName;
  final VoidCallback onMembers;
  final VoidCallback onSchedule;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.now();
    final weekday = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][date.weekday % 7];
    final month = [
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
    ][date.month - 1];
    final dateLabel = '$weekday, $month ${date.day}';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        boxShadow: AppTokens.softShadow(opacity: 0.06),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back, $firstName',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            "Here's what's happening at your gym today.",
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTokens.brand.withValues(alpha: 0.06),
              borderRadius: AppTokens.pill,
              border: Border.all(
                color: AppTokens.brand.withValues(alpha: 0.12),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  height: 8,
                  width: 8,
                  decoration: const BoxDecoration(
                    color: AppTokens.brand,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Live',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTokens.brand,
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  height: 12,
                  width: 1,
                  color: Colors.black.withValues(alpha: 0.10),
                ),
                const SizedBox(width: 10),
                Icon(
                  Icons.schedule,
                  size: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 6),
                Text(
                  dateLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onMembers,
                  icon: const Icon(Icons.people_outline, size: 18),
                  label: const Text('Members'),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onSchedule,
                  icon: const Icon(Icons.calendar_month_outlined, size: 18),
                  label: const Text('Schedule'),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.gradient,
    required this.onTap,
  });

  final String title;
  final String? value;
  final IconData icon;
  final List<Color> gradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
          boxShadow: AppTokens.softShadow(opacity: 0.06),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 36,
                  width: 36,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: gradient),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: gradient.first.withValues(alpha: 0.22),
                        blurRadius: 18,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white),
                ),
                const Spacer(),
                Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value ?? '…',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    height: 1.0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.description,
    required this.gradient,
  });

  final IconData icon;
  final String title;
  final String description;
  final List<Color> gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        boxShadow: AppTokens.softShadow(opacity: 0.05),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: gradient.first.withValues(alpha: 0.18),
                  blurRadius: 14,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
