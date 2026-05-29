import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/staff_repository.dart';
import '../../models/app_user.dart';
import '../../models/staff_member.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

class StaffTab extends StatefulWidget {
  const StaffTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<StaffTab> createState() => _StaffTabState();
}

class _StaffTabState extends State<StaffTab> {
  final _repo = StaffRepository();
  final _search = TextEditingController();

  bool _loading = true;
  String? _error;
  List<StaffMember> _staff = const [];

  void _safeSetState(VoidCallback fn) {
    if (!mounted) return;
    setState(fn);
  }

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    _safeSetState(() {
      _loading = true;
      _error = null;
    });
    try {
      final staff = await _repo.listStaff();
      _safeSetState(() => _staff = staff);
    } catch (e) {
      _safeSetState(() => _error = e.toString());
    } finally {
      _safeSetState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _search.text.trim().toLowerCase();
    final rows = q.isEmpty
        ? _staff
        : _staff.where((s) {
            return s.firstName.toLowerCase().contains(q) ||
                s.lastName.toLowerCase().contains(q) ||
                s.email.toLowerCase().contains(q);
          }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          const AppSectionTitle(
            title: 'Staff',
            subtitle: 'Team members, trainers, and managers.',
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppSearchField(
                  controller: _search,
                  hintText: 'Search staff...',
                ),
              ),
              const SizedBox(width: 12),
              if (widget.authController.hasRole(AppRole.manager) ||
                  widget.authController.hasRole(AppRole.admin))
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTokens.brand,
                    shape: RoundedRectangleBorder(borderRadius: AppTokens.pill),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  onPressed: () => context.go('/staff/new'),
                  child: const Icon(Icons.person_add_alt_1),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 28),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            AppSurface(child: Text(_error!))
          else if (rows.isEmpty)
            EmptyState(
              title: 'No staff',
              subtitle: 'Add staff members to manage operations.',
              icon: Icons.badge_outlined,
              action: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
                onPressed: () => context.go('/staff/new'),
                child: const Text('Add Staff'),
              ),
            )
          else
            AppSurface(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final s in rows) ...[
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      leading: Container(
                        height: 40,
                        width: 40,
                        decoration: BoxDecoration(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          s.firstName.isEmpty
                              ? '?'
                              : s.firstName[0].toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTokens.brand,
                          ),
                        ),
                      ),
                      title: Text(
                        s.fullName,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${s.email}\n${s.role.name.toUpperCase()} • ${s.department}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                      isThreeLine: true,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.go('/staff/${s.id}'),
                    ),
                    if (s.id != rows.last.id)
                      Divider(
                        height: 1,
                        color: Colors.black.withValues(alpha: 0.06),
                      ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}
