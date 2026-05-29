import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/staff_repository.dart';
import '../../models/app_user.dart';
import '../../models/staff_member.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class StaffViewScreen extends StatefulWidget {
  const StaffViewScreen({
    super.key,
    required this.authController,
    required this.staffId,
  });

  final AuthController authController;
  final String staffId;

  @override
  State<StaffViewScreen> createState() => _StaffViewScreenState();
}

class _StaffViewScreenState extends State<StaffViewScreen> {
  final _repo = StaffRepository();
  bool _loading = true;
  String? _error;
  StaffMember? _staff;

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
    _safeSetState(() {
      _loading = true;
      _error = null;
    });
    try {
      _staff = await _repo.getStaff(widget.staffId);
      if (_staff == null) _error = 'Staff member not found';
    } catch (e) {
      _error = e.toString();
    } finally {
      _safeSetState(() => _loading = false);
    }
  }

  String _fmtShortDate(DateTime? dt) {
    if (dt == null) return '-';
    return dt.toLocal().toIso8601String().split('T').first;
  }

  ({Color fg, Color bg, Color border}) _badgeColorsForDepartment(
    String department,
  ) {
    switch (department) {
      case 'Fitness':
        return (
          fg: AppTokens.brand,
          bg: AppTokens.brand.withValues(alpha: 0.10),
          border: AppTokens.brand.withValues(alpha: 0.18),
        );
      case 'Operations':
        return (
          fg: const Color(0xFF1D4ED8),
          bg: const Color(0xFF1D4ED8).withValues(alpha: 0.10),
          border: const Color(0xFF1D4ED8).withValues(alpha: 0.18),
        );
      case 'Management':
        return (
          fg: const Color(0xFF7C3AED),
          bg: const Color(0xFF7C3AED).withValues(alpha: 0.10),
          border: const Color(0xFF7C3AED).withValues(alpha: 0.18),
        );
      default:
        return (
          fg: Colors.black87,
          bg: Colors.black.withValues(alpha: 0.06),
          border: Colors.black.withValues(alpha: 0.10),
        );
    }
  }

  ({Color fg, Color bg, Color border}) _badgeColorsForRole(AppRole role) {
    switch (role) {
      case AppRole.trainer:
        return (
          fg: AppTokens.brand,
          bg: AppTokens.brand.withValues(alpha: 0.10),
          border: AppTokens.brand.withValues(alpha: 0.18),
        );
      case AppRole.staff:
        return (
          fg: const Color(0xFF1D4ED8),
          bg: const Color(0xFF1D4ED8).withValues(alpha: 0.10),
          border: const Color(0xFF1D4ED8).withValues(alpha: 0.18),
        );
      case AppRole.manager:
        return (
          fg: const Color(0xFF7C3AED),
          bg: const Color(0xFF7C3AED).withValues(alpha: 0.10),
          border: const Color(0xFF7C3AED).withValues(alpha: 0.18),
        );
      case AppRole.admin:
        return (
          fg: Colors.black87,
          bg: Colors.black.withValues(alpha: 0.06),
          border: Colors.black.withValues(alpha: 0.10),
        );
      case AppRole.member:
        return (
          fg: Colors.black87,
          bg: Colors.black.withValues(alpha: 0.06),
          border: Colors.black.withValues(alpha: 0.10),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final canEdit =
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.admin);

    final staff = _staff;
    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null || staff == null
              ? EmptyState(
                  title: 'Staff',
                  subtitle: _error ?? 'Staff member not found.',
                  icon: Icons.badge_outlined,
                  action: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      side: BorderSide(color: Colors.black.withValues(alpha: 0.10)),
                      foregroundColor: Colors.black87,
                    ),
                    onPressed: () => context.go('/dashboard?tab=staff'),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    label: const Text('Back to Staff'),
                  ),
                )
              : SafeArea(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
                    children: [
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isWide = constraints.maxWidth >= 980;

                          Widget badge({
                            required String text,
                            required Color fg,
                            required Color bg,
                            required Color border,
                          }) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: bg,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: border),
                              ),
                              child: Text(
                                text,
                                style: TextStyle(
                                  color: fg,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                            );
                          }

                          final back = OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              side: BorderSide(
                                color: Colors.black.withValues(alpha: 0.10),
                              ),
                              foregroundColor: Colors.black87,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                            ),
                            onPressed: () => context.canPop()
                                ? context.pop()
                                : context.go('/dashboard?tab=staff'),
                            icon: const Icon(Icons.arrow_back, size: 18),
                            label: const Text('Back'),
                          );

                          final edit = FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppTokens.brand,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            onPressed: () =>
                                context.push('/staff/${widget.staffId}/edit'),
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            label: const Text(
                              'Edit Profile',
                              style: TextStyle(fontWeight: FontWeight.w900),
                            ),
                          );

                          final roleColors = _badgeColorsForRole(staff.role);
                          final deptColors =
                              _badgeColorsForDepartment(staff.department);

                          final header = Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  back,
                                  const Spacer(),
                                  if (canEdit) edit,
                                ],
                              ),
                              const SizedBox(height: 14),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    height: 48,
                                    width: 48,
                                    decoration: BoxDecoration(
                                      color: AppTokens.brand,
                                      borderRadius: BorderRadius.circular(14),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTokens.brand.withValues(
                                            alpha: 0.20,
                                          ),
                                          blurRadius: 18,
                                          offset: const Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.person_outline,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          staff.fullName,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: Theme.of(context)
                                              .textTheme
                                              .headlineSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w900,
                                              ),
                                        ),
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          children: [
                                            badge(
                                              text:
                                                  staff.role.name.toUpperCase(),
                                              fg: roleColors.fg,
                                              bg: roleColors.bg,
                                              border: roleColors.border,
                                            ),
                                            badge(
                                              text: staff.department.isEmpty
                                                  ? 'Department'
                                                  : staff.department,
                                              fg: deptColors.fg,
                                              bg: deptColors.bg,
                                              border: deptColors.border,
                                            ),
                                            Text(
                                              'Joined ${_fmtShortDate(staff.hireDate ?? staff.createdAt)}',
                                              style: TextStyle(
                                                color: Theme.of(context)
                                                    .colorScheme
                                                    .onSurfaceVariant,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          );

                          Widget infoTile({
                            required IconData icon,
                            required String label,
                            required String value,
                          }) {
                            final muted =
                                Theme.of(context).colorScheme.onSurfaceVariant;
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(icon, size: 16, color: muted),
                                    const SizedBox(width: 8),
                                    Text(
                                      label,
                                      style: TextStyle(
                                        color: muted,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  value,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            );
                          }

                          Widget chipBadge(String text) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: AppTokens.brand.withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color:
                                      AppTokens.brand.withValues(alpha: 0.18),
                                ),
                              ),
                              child: Text(
                                text,
                                style: const TextStyle(
                                  color: AppTokens.brand,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                            );
                          }

                          final personal = ReactCard(
                            header: const ReactCardHeader(
                              icon: Icons.person_outline,
                              title: 'Personal Information',
                              subtitle: 'Basic contact details',
                            ),
                            child: LayoutBuilder(
                              builder: (context, c) {
                                final twoCol = c.maxWidth >= 640;
                                final tiles = [
                                  infoTile(
                                    icon: Icons.mail_outline,
                                    label: 'Email Address',
                                    value: staff.email,
                                  ),
                                  infoTile(
                                    icon: Icons.phone_outlined,
                                    label: 'Phone Number',
                                    value: (staff.phone ?? '').trim().isEmpty
                                        ? 'N/A'
                                        : staff.phone!.trim(),
                                  ),
                                  infoTile(
                                    icon: Icons.badge_outlined,
                                    label: 'Employee ID',
                                    value:
                                        (staff.employeeId ?? '').trim().isEmpty
                                            ? 'N/A'
                                            : staff.employeeId!.trim(),
                                  ),
                                  infoTile(
                                    icon: Icons.place_outlined,
                                    label: 'Location',
                                    value: 'Main Branch',
                                  ),
                                ];

                                if (!twoCol) {
                                  return Column(
                                    children: [
                                      for (final t in tiles) ...[
                                        t,
                                        if (t != tiles.last)
                                          const SizedBox(height: 16),
                                      ],
                                    ],
                                  );
                                }

                                return Column(
                                  children: [
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(child: tiles[0]),
                                        const SizedBox(width: 16),
                                        Expanded(child: tiles[1]),
                                      ],
                                    ),
                                    const SizedBox(height: 18),
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(child: tiles[2]),
                                        const SizedBox(width: 16),
                                        Expanded(child: tiles[3]),
                                      ],
                                    ),
                                  ],
                                );
                              },
                            ),
                          );

                          final professional = ReactCard(
                            header: const ReactCardHeader(
                              icon: Icons.work_outline,
                              title: 'Professional Details',
                              subtitle: 'Role, department, and compensation',
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                LayoutBuilder(
                                  builder: (context, c) {
                                    final twoCol = c.maxWidth >= 640;
                                    final salary = staff.salary ?? 0;
                                    final tiles = [
                                      infoTile(
                                        icon: Icons.military_tech_outlined,
                                        label: 'Position',
                                        value: staff.position.isEmpty
                                            ? '-'
                                            : staff.position,
                                      ),
                                      infoTile(
                                        icon: Icons.apartment_outlined,
                                        label: 'Department',
                                        value: staff.department.isEmpty
                                            ? '-'
                                            : staff.department,
                                      ),
                                      infoTile(
                                        icon: Icons.currency_rupee,
                                        label: 'Salary',
                                        value: '₹${salary.toStringAsFixed(0)}',
                                      ),
                                      infoTile(
                                        icon: Icons.timeline_outlined,
                                        label: 'Experience',
                                        value:
                                            '${staff.yearsExperience.toStringAsFixed(1)} years',
                                      ),
                                    ];

                                    if (!twoCol) {
                                      return Column(
                                        children: [
                                          for (final t in tiles) ...[
                                            t,
                                            if (t != tiles.last)
                                              const SizedBox(height: 16),
                                          ],
                                        ],
                                      );
                                    }

                                    return Column(
                                      children: [
                                        Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Expanded(child: tiles[0]),
                                            const SizedBox(width: 16),
                                            Expanded(child: tiles[1]),
                                          ],
                                        ),
                                        const SizedBox(height: 18),
                                        Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Expanded(child: tiles[2]),
                                            const SizedBox(width: 16),
                                            Expanded(child: tiles[3]),
                                          ],
                                        ),
                                      ],
                                    );
                                  },
                                ),
                                const SizedBox(height: 18),
                                Text(
                                  'Specializations',
                                  style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                if (staff.specializations.isEmpty)
                                  Text(
                                    'No specializations listed',
                                    style: TextStyle(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                      fontStyle: FontStyle.italic,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  )
                                else
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      for (final s in staff.specializations)
                                        chipBadge(s),
                                    ],
                                  ),
                              ],
                            ),
                          );

                          final status = ReactCard(
                            header: const ReactCardHeader(
                              icon: Icons.verified_outlined,
                              title: 'Employment Status',
                              subtitle: 'Role and employment overview',
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Current Role',
                                  style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  staff.role.name.toUpperCase(),
                                  style: const TextStyle(
                                    color: AppTokens.brand,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color:
                                        AppTokens.brand.withValues(alpha: 0.06),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: AppTokens.brand.withValues(
                                        alpha: 0.12,
                                      ),
                                    ),
                                  ),
                                  child: Column(
                                    children: [
                                      _KeyValueRow(
                                        label: 'Department',
                                        value: staff.department.isEmpty
                                            ? '-'
                                            : staff.department,
                                        valueColor: AppTokens.brand,
                                      ),
                                      const SizedBox(height: 10),
                                      Divider(
                                        height: 1,
                                        color:
                                            AppTokens.brand.withValues(alpha: 0.10),
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Text(
                                            'Status',
                                            style: TextStyle(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const Spacer(),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: AppTokens.brand,
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                            ),
                                            child: const Text(
                                              'Active',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w900,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                _KeyValueRow(
                                  label: 'Started',
                                  value: _fmtShortDate(
                                    staff.hireDate ?? staff.createdAt,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                _KeyValueRow(
                                  label: 'Last Updated',
                                  value: _fmtShortDate(staff.updatedAt),
                                ),
                              ],
                            ),
                          );

                          final schedule = ReactCard(
                            header: const ReactCardHeader(
                              icon: Icons.schedule_outlined,
                              title: 'Schedule',
                              subtitle: 'Work and class schedule',
                            ),
                            child: Column(
                              children: [
                                const SizedBox(height: 12),
                                Icon(
                                  Icons.calendar_month_outlined,
                                  size: 44,
                                  color: Colors.black.withValues(alpha: 0.18),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Schedule management coming soon',
                                  style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 8),
                              ],
                            ),
                          );

                          final left = Column(
                            children: [
                              personal,
                              const SizedBox(height: 14),
                              professional,
                            ],
                          );

                          final right = Column(
                            children: [
                              status,
                              const SizedBox(height: 14),
                              schedule,
                            ],
                          );

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              header,
                              const SizedBox(height: 18),
                              if (!isWide) ...[
                                left,
                                const SizedBox(height: 14),
                                right,
                              ] else
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(flex: 2, child: left),
                                    const SizedBox(width: 16),
                                    Expanded(child: right),
                                  ],
                                ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _KeyValueRow extends StatelessWidget {
  const _KeyValueRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(color: muted, fontWeight: FontWeight.w700),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
