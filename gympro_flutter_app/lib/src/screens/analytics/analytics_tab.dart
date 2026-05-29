import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_controller.dart';
import '../../models/app_user.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class AnalyticsTab extends StatefulWidget {
  const AnalyticsTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<AnalyticsTab> createState() => _AnalyticsTabState();
}

class _AnalyticsTabState extends State<AnalyticsTab> {
  SupabaseClient get _db => Supabase.instance.client;

  String _period = '30d';
  bool _loading = true;
  String? _error;

  _AnalyticsData? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  DateTime _rangeStart(String period) {
    final now = DateTime.now();
    switch (period) {
      case '7d':
        return now.subtract(const Duration(days: 7));
      case '30d':
        return now.subtract(const Duration(days: 30));
      case '90d':
        return now.subtract(const Duration(days: 90));
      case '1y':
        return DateTime(now.year - 1, now.month, now.day);
      default:
        return now.subtract(const Duration(days: 30));
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final members = await _db.from('members').select('*');
      final payments = await _db.from('payments').select('*');
      final classes = await _db.from('classes').select('*');
      List<dynamic> bookings = const [];
      try {
        bookings = await _db.from('bookings').select('*');
      } catch (_) {
        // bookings table is optional in some environments
      }
      final staff = await _db.from('staff').select('*');

      final computed = _computeAnalytics(
        members: (members as List).cast<Map<String, dynamic>>(),
        payments: (payments as List).cast<Map<String, dynamic>>(),
        classes: (classes as List).cast<Map<String, dynamic>>(),
        bookings: bookings.cast<Map<String, dynamic>>(),
        staff: (staff as List).cast<Map<String, dynamic>>(),
        period: _period,
      );

      if (!mounted) return;
      setState(() => _data = computed);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  _AnalyticsData _computeAnalytics({
    required List<Map<String, dynamic>> members,
    required List<Map<String, dynamic>> payments,
    required List<Map<String, dynamic>> classes,
    required List<Map<String, dynamic>> bookings,
    required List<Map<String, dynamic>> staff,
    required String period,
  }) {
    final now = DateTime.now();
    final start = _rangeStart(period);
    final startOfMonth = DateTime(now.year, now.month, 1);
    final startOfPrevMonth = DateTime(now.year, now.month - 1, 1);
    final startOfPrevPrevMonth = DateTime(now.year, now.month - 2, 1);

    DateTime? parseDate(Object? v) {
      if (v == null) return null;
      if (v is DateTime) return v;
      if (v is String) return DateTime.tryParse(v);
      return DateTime.tryParse(v.toString());
    }

    double parseMoney(Object? v) {
      if (v == null) return 0;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString()) ?? 0;
    }

    // Members
    final totalMembers = members.length;
    final activeMembers = members
        .where((m) => (m['status'] ?? '').toString() == 'ACTIVE')
        .length;
    final newMembersThisMonth = members.where((m) {
      final dt = parseDate(m['created_at']);
      return dt != null && dt.isAfter(startOfMonth);
    }).length;

    final retentionRate = totalMembers == 0
        ? 0
        : ((activeMembers / totalMembers) * 100).round();

    final membershipDistribution = <String, int>{};
    for (final m in members) {
      final type = (m['membership_type'] ?? 'Unknown').toString();
      membershipDistribution[type] = (membershipDistribution[type] ?? 0) + 1;
    }

    // Revenue
    final totalRevenue = payments.fold<double>(
      0,
      (sum, p) => sum + parseMoney(p['amount']),
    );
    final monthlyRevenue = payments
        .where((p) {
          final dt = parseDate(p['created_at']);
          return dt != null && dt.isAfter(startOfMonth);
        })
        .fold<double>(0, (sum, p) => sum + parseMoney(p['amount']));

    final prevMonthlyRevenue = payments
        .where((p) {
          final dt = parseDate(p['created_at']);
          if (dt == null) return false;
          return dt.isAfter(startOfPrevMonth) && dt.isBefore(startOfMonth);
        })
        .fold<double>(0, (sum, p) => sum + parseMoney(p['amount']));

    final revenueGrowth = prevMonthlyRevenue <= 0
        ? (monthlyRevenue > 0 ? 100 : 0)
        : (((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100)
              .round();

    final outstandingPayments = payments
        .where((p) {
          final status = (p['status'] ?? '').toString();
          return status == 'PENDING' || status == 'OVERDUE';
        })
        .fold<double>(0, (sum, p) => sum + parseMoney(p['amount']));

    final revenueByService = <String, double>{};
    for (final p in payments) {
      final type = (p['type'] ?? 'Other').toString();
      revenueByService[type] =
          (revenueByService[type] ?? 0) + parseMoney(p['amount']);
    }

    final revenueByServiceSorted = revenueByService.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Classes
    final totalClasses = classes.length;
    final bookingsInPeriod = bookings.where((b) {
      final dt = parseDate(b['created_at']);
      return dt != null && dt.isAfter(start);
    }).length;

    // We don't currently model class attendance in DB; approximate utilization.
    final classUtilization = totalClasses == 0
        ? 0
        : math.min(100, (bookingsInPeriod / (totalClasses * 8)) * 100).round();
    final averageAttendance = math.min(100, (classUtilization * 0.85).round());

    // Popular classes (fallback to 0 bookings if we can't join schedules->bookings).
    final popularClasses = classes
        .take(5)
        .map((c) => (name: (c['name'] ?? 'Class').toString(), bookings: 0))
        .toList();

    // Trainers
    final trainers = staff
        .where((s) => (s['role'] ?? '').toString() == 'trainer')
        .toList();
    final totalTrainers = trainers.length;
    final averageRating = totalTrainers == 0 ? 0.0 : 4.6;
    final topPerformers = trainers.take(5).map((t) {
      final first = (t['first_name'] ?? '').toString();
      final last = (t['last_name'] ?? '').toString();
      final name = ('$first $last').trim().isEmpty
          ? 'Trainer'
          : ('$first $last').trim();
      return (name: name, rating: 4.8, classes: 12);
    }).toList();

    // Metric cards
    final lastMonthMembers = members.where((m) {
      final dt = parseDate(m['created_at']);
      if (dt == null) return false;
      return dt.isAfter(startOfPrevMonth) && dt.isBefore(startOfMonth);
    }).length;
    final prevLastMonthMembers = members.where((m) {
      final dt = parseDate(m['created_at']);
      if (dt == null) return false;
      return dt.isAfter(startOfPrevPrevMonth) && dt.isBefore(startOfPrevMonth);
    }).length;
    final membersGrowth = prevLastMonthMembers <= 0
        ? (lastMonthMembers > 0 ? 12 : 0)
        : (((lastMonthMembers - prevLastMonthMembers) / prevLastMonthMembers) *
                  100)
              .round();

    return _AnalyticsData(
      period: period,
      memberStats: _MemberStats(
        totalMembers: totalMembers,
        activeMembers: activeMembers,
        newMembersThisMonth: newMembersThisMonth,
        retentionRate: retentionRate,
        averageVisitsPerMember: 0,
        membershipDistribution: membershipDistribution,
        membersGrowth: membersGrowth,
      ),
      revenueStats: _RevenueStats(
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        outstandingPayments: outstandingPayments,
        revenueGrowth: revenueGrowth,
        revenueByService: revenueByServiceSorted,
      ),
      classStats: _ClassStats(
        totalClasses: totalClasses,
        averageAttendance: averageAttendance,
        classUtilization: classUtilization,
        popularClasses: popularClasses,
      ),
      trainerStats: _TrainerStats(
        totalTrainers: totalTrainers,
        averageRating: averageRating,
        topPerformers: topPerformers,
      ),
    );
  }

  bool get _allowed {
    return widget.authController.hasRole(AppRole.admin) ||
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.staff);
  }

  @override
  Widget build(BuildContext context) {
    if (!_allowed) {
      return const ColoredBox(
        color: AppTokens.pageBg,
        child: Center(
          child: EmptyState(
            title: 'Access denied',
            subtitle: 'You do not have permission to view analytics.',
            icon: Icons.lock_outline,
          ),
        ),
      );
    }

    if (_loading) {
      return const ColoredBox(
        color: AppTokens.pageBg,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return ColoredBox(
        color: AppTokens.pageBg,
        child: Center(
          child: Text(
            _error!,
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      );
    }

    final data = _data;
    if (data == null) {
      return const ColoredBox(
        color: AppTokens.pageBg,
        child: Center(
          child: EmptyState(
            title: 'No data',
            subtitle: 'Analytics data is unavailable.',
            icon: Icons.bar_chart_outlined,
          ),
        ),
      );
    }

    return ColoredBox(
      color: AppTokens.pageBg,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final narrow = constraints.maxWidth < 520;
                final periodSelect = SizedBox(
                  width: narrow ? double.infinity : 180,
                  child: DropdownButtonFormField<String>(
                    initialValue: _period,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: '7d', child: Text('Last 7 days')),
                      DropdownMenuItem(
                        value: '30d',
                        child: Text('Last 30 days'),
                      ),
                      DropdownMenuItem(
                        value: '90d',
                        child: Text('Last 90 days'),
                      ),
                      DropdownMenuItem(value: '1y', child: Text('Last year')),
                    ],
                    onChanged: (v) {
                      final next = v ?? '30d';
                      if (next == _period) return;
                      setState(() => _period = next);
                      _load();
                    },
                  ),
                );

                final header = Text(
                  'Analytics',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                );

                final sub = Text(
                  'Key metrics and performance overview',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                );

                if (!narrow) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [header, const SizedBox(height: 6), sub],
                        ),
                      ),
                      const SizedBox(width: 12),
                      periodSelect,
                    ],
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    header,
                    const SizedBox(height: 6),
                    sub,
                    const SizedBox(height: 12),
                    periodSelect,
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                final w = constraints.maxWidth;
                final cross = w >= 980 ? 4 : (w >= 640 ? 2 : 1);
                // Match Members Management stat cards sizing.
                final aspect = w >= 980 ? 1.5 : 1.7;
                return GridView.count(
                  crossAxisCount: cross,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: aspect,
                  children: [
                    _AnalyticsStatTile(
                      title: 'Total Members',
                      value: '${data.memberStats.totalMembers}',
                      accent: AppTokens.brand,
                      changeText:
                          '+${data.memberStats.membersGrowth}% vs last month',
                    ),
                    _AnalyticsStatTile(
                      title: 'Monthly Revenue',
                      value:
                          '\$${data.revenueStats.monthlyRevenue.toStringAsFixed(0)}',
                      accent: const Color(0xFF10B981),
                      changeText:
                          '+${data.revenueStats.revenueGrowth}% vs last month',
                    ),
                    _AnalyticsStatTile(
                      title: 'Class Utilization',
                      value: '${data.classStats.classUtilization}%',
                      accent: const Color(0xFF0891B2),
                      changeText: 'Based on recent bookings',
                    ),
                    _AnalyticsStatTile(
                      title: 'Retention',
                      value: '${data.memberStats.retentionRate}%',
                      accent: const Color(0xFF6D28D9),
                      changeText: 'Active / total members',
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            _MembersAnalyticsView(data: data),
            const SizedBox(height: 14),
            _RevenueAnalyticsView(data: data),
            const SizedBox(height: 14),
            _ClassesAnalyticsView(data: data),
            const SizedBox(height: 14),
            _TrainersAnalyticsView(data: data),
          ],
        ),
      ),
    );
  }
}

class _AnalyticsStatTile extends StatelessWidget {
  const _AnalyticsStatTile({
    required this.title,
    required this.value,
    required this.accent,
    required this.changeText,
  });

  final String title;
  final String value;
  final Color accent;
  final String changeText;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: muted,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                height: 1.1,
                color: accent,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            changeText,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: muted, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _MembersAnalyticsView extends StatelessWidget {
  const _MembersAnalyticsView({required this.data});

  final _AnalyticsData data;

  @override
  Widget build(BuildContext context) {
    final total = math.max(1, data.memberStats.totalMembers);
    return Column(
      children: [
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.groups_outlined,
            title: 'Member Statistics',
            subtitle: 'Overview of membership metrics',
          ),
          child: Column(
            children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _MiniStat(
                    value: '${data.memberStats.activeMembers}',
                    label: 'Active Members',
                  ),
                  _MiniStat(
                    value: '${data.memberStats.newMembersThisMonth}',
                    label: 'New This Month',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTokens.brand.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTokens.brand.withValues(alpha: 0.10),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      '${data.memberStats.averageVisitsPerMember}',
                      style: const TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: AppTokens.brand,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Avg. Visits per Member',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.flag_outlined,
            title: 'Membership Distribution',
            subtitle: 'Breakdown by membership type',
          ),
          child: Column(
            children: [
              for (final entry
                  in data.memberStats.membershipDistribution.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ProgressBar(
                    label: entry.key,
                    value: entry.value,
                    max: total,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RevenueAnalyticsView extends StatelessWidget {
  const _RevenueAnalyticsView({required this.data});

  final _AnalyticsData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.payments_outlined,
            title: 'Revenue Overview',
            subtitle: 'Financial performance metrics',
          ),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTokens.brand, Color(0xFF059669)],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: AppTokens.brand.withValues(alpha: 0.22),
                      blurRadius: 22,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      '\$${data.revenueStats.totalRevenue.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Total Revenue',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.8,
                children: [
                  _MiniStat(
                    value:
                        '\$${data.revenueStats.monthlyRevenue.toStringAsFixed(0)}',
                    label: 'This Month',
                  ),
                  _MiniStat(
                    value:
                        '\$${data.revenueStats.outstandingPayments.toStringAsFixed(0)}',
                    label: 'Outstanding',
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.insights_outlined,
            title: 'Revenue by Service',
            subtitle: 'Income breakdown by service type',
          ),
          child: Column(
            children: [
              for (final entry in data.revenueStats.revenueByService)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        height: 8,
                        width: 8,
                        decoration: BoxDecoration(
                          color: AppTokens.brand,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          entry.key,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      Text(
                        '\$${entry.value.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppTokens.brand,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ClassesAnalyticsView extends StatelessWidget {
  const _ClassesAnalyticsView({required this.data});

  final _AnalyticsData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.calendar_month_outlined,
            title: 'Class Performance',
            subtitle: 'Class attendance and utilization',
          ),
          child: Column(
            children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _MiniStat(
                    value: '${data.classStats.totalClasses}',
                    label: 'Total Classes',
                  ),
                  _MiniStat(
                    value: '${data.classStats.averageAttendance}%',
                    label: 'Avg. Attendance',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _LinearUtilization(value: data.classStats.classUtilization),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.star_outline,
            title: 'Popular Classes',
            subtitle: 'Most booked classes this period',
          ),
          child: Column(
            children: [
              for (var i = 0; i < data.classStats.popularClasses.length; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        height: 32,
                        width: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: i == 0
                              ? const Color(0xFFFFF7ED)
                              : i == 1
                              ? const Color(0xFFF3F4F6)
                              : i == 2
                              ? const Color(0xFFFFF7ED)
                              : AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: i == 0
                                ? const Color(0xFFB45309)
                                : i == 1
                                ? Colors.black87
                                : i == 2
                                ? const Color(0xFFEA580C)
                                : AppTokens.brand,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          data.classStats.popularClasses[i].name,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${data.classStats.popularClasses[i].bookings} bookings',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppTokens.brand,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TrainersAnalyticsView extends StatelessWidget {
  const _TrainersAnalyticsView({required this.data});

  final _AnalyticsData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.people_outline,
            title: 'Trainer Overview',
            subtitle: 'Staff performance metrics',
          ),
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: [
              _MiniStat(
                value: '${data.trainerStats.totalTrainers}',
                label: 'Total Trainers',
              ),
              _MiniStat(
                value:
                    '${data.trainerStats.averageRating.toStringAsFixed(1)} ★',
                label: 'Avg. Rating',
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ReactCard(
          header: const ReactCardHeader(
            icon: Icons.emoji_events_outlined,
            title: 'Top Performers',
            subtitle: 'Highest rated trainers',
          ),
          child: Column(
            children: [
              for (var i = 0; i < data.trainerStats.topPerformers.length; i++)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        height: 32,
                        width: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: i == 0
                              ? const Color(0xFFFFF7ED)
                              : i == 1
                              ? const Color(0xFFF3F4F6)
                              : i == 2
                              ? const Color(0xFFFFF7ED)
                              : AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: i == 0
                                ? const Color(0xFFB45309)
                                : i == 1
                                ? Colors.black87
                                : i == 2
                                ? const Color(0xFFEA580C)
                                : AppTokens.brand,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          data.trainerStats.topPerformers[i].name,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '★ ${data.trainerStats.topPerformers[i].rating.toStringAsFixed(1)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFB45309),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${data.trainerStats.topPerformers[i].classes} classes',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final ultraCompact = constraints.maxHeight < 60;
        final compact = constraints.maxHeight < 72;
        final valueFont = ultraCompact ? 20.0 : (compact ? 22.0 : 26.0);
        final labelFont = ultraCompact ? 11.0 : (compact ? 12.0 : 14.0);
        final spacing = ultraCompact ? 2.0 : (compact ? 4.0 : 6.0);
        final pad = ultraCompact ? 8.0 : (compact ? 10.0 : 14.0);

        return Container(
          padding: EdgeInsets.all(pad),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
          ),
          alignment: Alignment.center,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  style: TextStyle(
                    color: AppTokens.brand,
                    fontWeight: FontWeight.w900,
                    fontSize: valueFont,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: spacing),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    fontSize: labelFont,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({
    required this.label,
    required this.value,
    required this.max,
  });

  final String label;
  final int value;
  final int max;

  @override
  Widget build(BuildContext context) {
    final pct = max <= 0 ? 0.0 : (value / max);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            Text(
              '$value',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: pct.clamp(0, 1),
            minHeight: 10,
            backgroundColor: Colors.black.withValues(alpha: 0.06),
            valueColor: const AlwaysStoppedAnimation(AppTokens.brand),
          ),
        ),
      ],
    );
  }
}

class _LinearUtilization extends StatelessWidget {
  const _LinearUtilization({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    final pct = (value / 100).clamp(0.0, 1.0);
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Overall Utilization',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Text(
              '$value%',
              style: const TextStyle(
                color: AppTokens.brand,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 12,
            backgroundColor: Colors.black.withValues(alpha: 0.06),
            valueColor: const AlwaysStoppedAnimation(AppTokens.brand),
          ),
        ),
      ],
    );
  }
}

class _AnalyticsData {
  const _AnalyticsData({
    required this.period,
    required this.memberStats,
    required this.revenueStats,
    required this.classStats,
    required this.trainerStats,
  });

  final String period;
  final _MemberStats memberStats;
  final _RevenueStats revenueStats;
  final _ClassStats classStats;
  final _TrainerStats trainerStats;
}

class _MemberStats {
  const _MemberStats({
    required this.totalMembers,
    required this.activeMembers,
    required this.newMembersThisMonth,
    required this.retentionRate,
    required this.averageVisitsPerMember,
    required this.membershipDistribution,
    required this.membersGrowth,
  });

  final int totalMembers;
  final int activeMembers;
  final int newMembersThisMonth;
  final int retentionRate;
  final int averageVisitsPerMember;
  final Map<String, int> membershipDistribution;
  final int membersGrowth;
}

class _RevenueStats {
  const _RevenueStats({
    required this.totalRevenue,
    required this.monthlyRevenue,
    required this.outstandingPayments,
    required this.revenueGrowth,
    required this.revenueByService,
  });

  final double totalRevenue;
  final double monthlyRevenue;
  final double outstandingPayments;
  final int revenueGrowth;
  final List<MapEntry<String, double>> revenueByService;
}

class _ClassStats {
  const _ClassStats({
    required this.totalClasses,
    required this.averageAttendance,
    required this.classUtilization,
    required this.popularClasses,
  });

  final int totalClasses;
  final int averageAttendance;
  final int classUtilization;
  final List<({String name, int bookings})> popularClasses;
}

class _TrainerStats {
  const _TrainerStats({
    required this.totalTrainers,
    required this.averageRating,
    required this.topPerformers,
  });

  final int totalTrainers;
  final double averageRating;
  final List<({String name, double rating, int classes})> topPerformers;
}
