import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../models/app_user.dart';
import '../../models/member.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class MemberViewScreen extends StatefulWidget {
  const MemberViewScreen({
    super.key,
    required this.authController,
    required this.memberId,
  });

  final AuthController authController;
  final String memberId;

  @override
  State<MemberViewScreen> createState() => _MemberViewScreenState();
}

class _MemberViewScreenState extends State<MemberViewScreen> {
  final _repo = MembersRepository();
  bool _loading = true;
  String? _error;
  Member? _member;

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
      _member = await _repo.getMember(widget.memberId);
      if (_member == null) {
        _error = 'Member not found';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canEdit =
        widget.authController.hasRole(AppRole.admin) ||
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.staff);

    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppTokens.pageBg,
        body: Center(
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

    if (_member == null) {
      return const Scaffold(
        body: EmptyState(
          title: 'Member Not Found',
          subtitle: 'Return to Members and try again.',
          icon: Icons.person_off_outlined,
        ),
      );
    }

    String date(DateTime? dt) =>
        dt == null ? '-' : dt.toLocal().toIso8601String().split('T').first;

    final isActive = _member!.status.toUpperCase() == 'ACTIVE';
    final memberSince = date(_member!.createdAt);

    Widget pill({
      required String text,
      required Color fg,
      required Color bg,
      Color? border,
      IconData? icon,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: border ?? Colors.transparent),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: fg),
              const SizedBox(width: 6),
            ],
            Flexible(
              child: Text(
                text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: fg,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final narrow = constraints.maxWidth < 520;
                final veryNarrow = constraints.maxWidth < 360;

                final back = OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    side: BorderSide(
                      color: Colors.black.withValues(alpha: 0.10),
                    ),
                    foregroundColor: Colors.black87,
                    minimumSize: const Size(44, 44),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  onPressed: () => context.go('/dashboard?tab=members'),
                  child: const Icon(Icons.arrow_back, size: 18),
                );

                final edit = veryNarrow
                    ? SizedBox(
                        height: 44,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTokens.brand,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                          ),
                          onPressed: () =>
                              context.go('/members/${widget.memberId}/edit'),
                          child: const Icon(Icons.edit_outlined),
                        ),
                      )
                    : FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTokens.brand,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          minimumSize: const Size(0, 44),
                        ),
                        onPressed: () =>
                            context.go('/members/${widget.memberId}/edit'),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit Profile'),
                      );

                final actionsRow = Row(
                  children: [
                    back,
                    const Spacer(),
                    if (canEdit) Flexible(child: edit),
                  ],
                );

                final titleBlock = Row(
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
                            color: AppTokens.brand.withValues(alpha: 0.20),
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
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _member!.fullName,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 10,
                            runSpacing: 8,
                            children: [
                              ConstrainedBox(
                                constraints: const BoxConstraints(
                                  maxWidth: 220,
                                ),
                                child: pill(
                                  text: isActive ? 'Active Member' : 'Inactive',
                                  fg: isActive ? AppTokens.brand : Colors.red,
                                  bg: isActive
                                      ? AppTokens.brand.withValues(alpha: 0.10)
                                      : Colors.red.withValues(alpha: 0.08),
                                  border: isActive
                                      ? AppTokens.brand.withValues(alpha: 0.20)
                                      : Colors.red.withValues(alpha: 0.20),
                                  icon: isActive
                                      ? Icons.check_circle_outline
                                      : Icons.cancel_outlined,
                                ),
                              ),
                              Text(
                                'Member since $memberSince',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );

                if (!narrow) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      actionsRow,
                      const SizedBox(height: 12),
                      titleBlock,
                    ],
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    actionsRow,
                    const SizedBox(height: 12),
                    titleBlock,
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                final wide = constraints.maxWidth >= 980;
                final gridCols = constraints.maxWidth >= 720 ? 2 : 1;
                final loc = MaterialLocalizations.of(context);

                String fmtDate(DateTime? dt) {
                  if (dt == null) return 'N/A';
                  return loc.formatMediumDate(dt.toLocal());
                }

                final startDate = _member!.createdAt;
                final renewalDate = startDate == null
                    ? null
                    : DateTime(
                        startDate.year + 1,
                        startDate.month,
                        startDate.day,
                      );

                final personal = ReactCard(
                  header: const ReactCardHeader(
                    icon: Icons.person_outline,
                    title: 'Personal Information',
                    subtitle: 'Contact details and basic info',
                  ),
                  child: GridView.count(
                    crossAxisCount: gridCols,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: gridCols == 2 ? 2.8 : 3.2,
                    children: [
                      _InfoTile(
                        icon: Icons.mail_outline,
                        label: 'Email Address',
                        value: _member!.email,
                      ),
                      _InfoTile(
                        icon: Icons.phone_outlined,
                        label: 'Phone Number',
                        value: (_member!.phone ?? '').isEmpty
                            ? 'N/A'
                            : _member!.phone!,
                      ),
                      _InfoTile(
                        icon: Icons.calendar_today_outlined,
                        label: 'Date of Birth',
                        value: fmtDate(_member!.dob),
                      ),
                      const _InfoTile(
                        icon: Icons.location_on_outlined,
                        label: 'Address',
                        value: 'N/A',
                      ),
                    ],
                  ),
                );

                final stats = ReactCard(
                  header: const ReactCardHeader(
                    icon: Icons.monitor_heart_outlined,
                    title: 'Physical Statistics',
                    subtitle: 'Body measurements for tracking progress',
                  ),
                  child: GridView.count(
                    crossAxisCount: gridCols,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: gridCols == 2 ? 3.0 : 3.2,
                    children: [
                      _InfoTile(
                        icon: Icons.scale_outlined,
                        label: 'Weight',
                        value: _member!.weight == null
                            ? 'N/A'
                            : '${_member!.weight!.toStringAsFixed(0)} kg',
                      ),
                      _InfoTile(
                        icon: Icons.straighten_outlined,
                        label: 'Height',
                        value: _member!.heightCm == null
                            ? 'N/A'
                            : '${_member!.heightCm!.toStringAsFixed(0)} cm',
                      ),
                    ],
                  ),
                );

                final membership = _MembershipPlanCard(
                  plan: _member!.membershipType.isEmpty
                      ? 'Gym'
                      : _member!.membershipType,
                  monthlyFee: _member!.planPrice ?? 0,
                  isActive: isActive,
                  startDate: fmtDate(startDate),
                  renewalDate: fmtDate(renewalDate),
                );

                final emergency = ReactCard(
                  header: const ReactCardHeader(
                    icon: Icons.emergency_outlined,
                    title: 'Emergency Contact',
                    subtitle: 'Who to contact in case of emergency',
                  ),
                  child: GridView.count(
                    crossAxisCount: gridCols,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: gridCols == 2 ? 2.8 : 3.2,
                    children: [
                      _InfoTile(
                        icon: Icons.person_outline,
                        label: 'Contact Name',
                        value: (_member!.emergencyContactName ?? '').isEmpty
                            ? 'N/A'
                            : _member!.emergencyContactName!,
                      ),
                      _InfoTile(
                        icon: Icons.phone_outlined,
                        label: 'Contact Phone',
                        value: (_member!.emergencyContactPhone ?? '').isEmpty
                            ? 'N/A'
                            : _member!.emergencyContactPhone!,
                      ),
                      _InfoTile(
                        icon: Icons.link_outlined,
                        label: 'Relationship',
                        value:
                            (_member!.emergencyContactRelationship ?? '')
                                .isEmpty
                            ? 'N/A'
                            : _member!.emergencyContactRelationship!,
                      ),
                      if (gridCols == 2) const SizedBox.shrink(),
                    ],
                  ),
                );

                if (!wide) {
                  return Column(
                    children: [
                      personal,
                      const SizedBox(height: 14),
                      stats,
                      const SizedBox(height: 14),
                      emergency,
                      const SizedBox(height: 14),
                      membership,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Column(
                        children: [
                          personal,
                          const SizedBox(height: 14),
                          stats,
                          const SizedBox(height: 14),
                          emergency,
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(child: membership),
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

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: muted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: muted,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          value,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
        ),
      ],
    );
  }
}

class _MembershipPlanCard extends StatelessWidget {
  const _MembershipPlanCard({
    required this.plan,
    required this.monthlyFee,
    required this.isActive,
    required this.startDate,
    required this.renewalDate,
  });

  final String plan;
  final double monthlyFee;
  final bool isActive;
  final String startDate;
  final String renewalDate;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    Widget statusBadge() {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive
              ? AppTokens.brand.withValues(alpha: 0.10)
              : Colors.black.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isActive
                ? AppTokens.brand.withValues(alpha: 0.20)
                : Colors.black.withValues(alpha: 0.10),
          ),
        ),
        child: Text(
          isActive ? 'Active' : 'Inactive',
          style: TextStyle(
            color: isActive ? AppTokens.brand : Colors.black54,
            fontWeight: FontWeight.w900,
            fontSize: 12,
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -90,
            top: -90,
            child: Container(
              height: 240,
              width: 240,
              decoration: BoxDecoration(
                color: AppTokens.brand.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(240),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const ReactCardHeader(
                icon: Icons.credit_card_outlined,
                title: 'Membership Plan',
                subtitle: 'Membership details and status',
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Plan',
                      style: TextStyle(
                        color: muted,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      plan,
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
                        color: AppTokens.brand.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Monthly Fee',
                                style: TextStyle(
                                  color: Colors.black.withValues(alpha: 0.62),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                '\$${monthlyFee.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  color: AppTokens.brand,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 20,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            height: 1,
                            color: AppTokens.brand.withValues(alpha: 0.10),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Status',
                                style: TextStyle(
                                  color: Colors.black.withValues(alpha: 0.62),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              statusBadge(),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Start Date',
                          style: TextStyle(
                            color: muted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          startDate,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Renewal Date',
                          style: TextStyle(
                            color: muted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          renewalDate,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
