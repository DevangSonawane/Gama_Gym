import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';
import '../analytics/analytics_tab.dart';
import '../classes/classes_tab.dart';
import '../members/members_tab.dart';
import '../overview/overview_tab.dart';
import '../staff/staff_tab.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

class _NavItem {
  const _NavItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.tab,
    this.roles,
  });

  final String id;
  final String label;
  final IconData icon;
  final String tab;
  final List<AppRole>? roles;
}

class DashboardShell extends StatelessWidget {
  const DashboardShell({
    super.key,
    required this.authController,
    required this.tab,
  });

  final AuthController authController;
  final String tab;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: authController,
      builder: (context, _) {
        if (authController.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final user = authController.user;
        if (user == null) {
          return EmptyState(
            title: 'Session expired',
            subtitle: 'Please sign in again.',
            icon: Icons.login,
            action: FilledButton(
              onPressed: () => context.go('/login'),
              child: const Text('Go to Login'),
            ),
          );
        }

        final effectiveTab = tab.trim().isEmpty
            ? 'overview'
            : tab.trim().toLowerCase();

        final allItems = <_NavItem>[
          const _NavItem(
            id: 'overview',
            label: 'Overview',
            icon: Icons.dashboard_outlined,
            tab: 'overview',
          ),
          const _NavItem(
            id: 'members',
            label: 'Members',
            icon: Icons.people_outline,
            tab: 'members',
            roles: [
              AppRole.trainer,
              AppRole.staff,
              AppRole.manager,
              AppRole.admin,
            ],
          ),
          const _NavItem(
            id: 'classes',
            label: 'Classes',
            icon: Icons.calendar_month_outlined,
            tab: 'classes',
          ),
          const _NavItem(
            id: 'staff',
            label: 'Staff',
            icon: Icons.badge_outlined,
            tab: 'staff',
            roles: [AppRole.manager, AppRole.admin],
          ),
          const _NavItem(
            id: 'analytics',
            label: 'Analytics',
            icon: Icons.bar_chart_outlined,
            tab: 'analytics',
            roles: [AppRole.manager, AppRole.admin],
          ),
        ];

        final items = allItems
            .where((i) => i.roles == null || i.roles!.contains(user.role))
            .toList();
        final selectedIndex = items.indexWhere((i) => i.tab == effectiveTab);
        final safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
        final activeTab = items[safeIndex].tab;

        void goTab(String nextTab) {
          context.go('/dashboard?tab=$nextTab');
        }

        final isWide = MediaQuery.of(context).size.width >= 900;

        Widget buildBody() {
          switch (activeTab) {
            case 'overview':
              return OverviewTab(authController: authController);
            case 'members':
              return MembersTab(authController: authController);
            case 'staff':
              return StaffTab(authController: authController);
            case 'users':
              return _UsersTab(authController: authController);
            case 'classes':
              return ClassesTab(authController: authController);
            case 'analytics':
              return AnalyticsTab(authController: authController);
            default:
              return const EmptyState(
                title: 'Not found',
                subtitle: 'This dashboard section does not exist.',
                icon: Icons.help_outline,
              );
          }
        }

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (didPop) return;

            final r = GoRouter.of(context);
            if (r.canPop()) {
              r.pop();
              return;
            }

            if (activeTab != 'overview') {
              context.go('/dashboard?tab=overview');
              return;
            }

            // Allow app to close from overview by popping the root.
            Navigator.of(context).maybePop();
          },
          child: Scaffold(
            backgroundColor: AppTokens.pageBg,
            appBar: AppBar(
              centerTitle: false,
              titleSpacing: 0,
              title: Align(
                alignment: Alignment.centerLeft,
                child: Image.asset(
                  'assets/images/gamalog.png',
                  height: 90,
                  fit: BoxFit.contain,
                  alignment: Alignment.centerLeft,
                ),
              ),
              actions: [
                IconButton(
                  tooltip: 'Profile',
                  onPressed: () => authController.hasRole(AppRole.admin)
                      ? context.push('/users')
                      : context.go('/dashboard?tab=overview'),
                  icon: const Icon(Icons.account_circle_outlined),
                ),
                IconButton(
                  tooltip: 'Logout',
                  onPressed: authController.logout,
                  icon: const Icon(Icons.logout),
                ),
                const SizedBox(width: 4),
              ],
            ),
            body: SafeArea(bottom: false, child: buildBody()),
            bottomNavigationBar: isWide
                ? null
                : _FloatingPillNav(
                    items: items,
                    selectedIndex: safeIndex,
                    onSelected: (i) => goTab(items[i].tab),
                  ),
          ),
        );
      },
    );
  }
}

class _UsersTab extends StatefulWidget {
  const _UsersTab({required this.authController});

  final AuthController authController;

  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  final _repo = UsersRepository();
  final _search = TextEditingController();

  bool _loading = true;
  String? _error;
  List<UserRow> _users = const [];

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
      final users = await _repo.listUsers();
      _safeSetState(() => _users = users);
    } catch (e) {
      _safeSetState(() => _error = e.toString());
    } finally {
      _safeSetState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.authController.hasRole(AppRole.admin)) {
      return const EmptyState(
        title: 'Users',
        subtitle: 'Access denied (admin only).',
        icon: Icons.lock_outline,
      );
    }

    final q = _search.text.trim().toLowerCase();
    final rows = q.isEmpty
        ? _users
        : _users.where((u) {
            return u.firstName.toLowerCase().contains(q) ||
                u.lastName.toLowerCase().contains(q) ||
                u.email.toLowerCase().contains(q) ||
                (u.phoneNumber ?? '').contains(q);
          }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          const AppSectionTitle(
            title: 'Users',
            subtitle: 'Manage system users and roles.',
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppSearchField(
                  controller: _search,
                  hintText: 'Search users...',
                ),
              ),
              const SizedBox(width: 12),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
                onPressed: () => context.go('/users/new'),
                child: const Icon(Icons.person_add_alt_1),
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
          else if (rows.isEmpty)
            EmptyState(
              title: 'No users',
              subtitle: 'Create the first system user.',
              icon: Icons.admin_panel_settings_outlined,
              action: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
                onPressed: () => context.go('/users/new'),
                child: const Text('Create User'),
              ),
            )
          else
            AppSurface(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final u in rows) ...[
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
                          u.firstName.isEmpty
                              ? '?'
                              : u.firstName[0].toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTokens.brand,
                          ),
                        ),
                      ),
                      title: Text(
                        u.fullName,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${u.email}\n${u.role} • ${u.isActive ? 'active' : 'inactive'}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                      isThreeLine: true,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.go('/users/${u.id}'),
                    ),
                    if (u.id != rows.last.id)
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

class _FloatingPillNav extends StatelessWidget {
  const _FloatingPillNav({
    required this.items,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<_NavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = Colors.white.withValues(alpha: 0.92);
    final border = scheme.primary.withValues(alpha: 0.10);
    final bottomInset = MediaQuery.of(context).viewPadding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(12, 0, 12, 12 + bottomInset),
      child: SizedBox(
        height: 64,
        width: double.infinity,
        child: Material(
          color: bg,
          elevation: 0,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.10),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                for (int i = 0; i < items.length; i++)
                  Expanded(
                    child: Center(
                      child: _PillNavItem(
                        icon: items[i].icon,
                        isSelected: i == selectedIndex,
                        onTap: () => onSelected(i),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PillNavItem extends StatelessWidget {
  const _PillNavItem({
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = isSelected ? scheme.onPrimary : scheme.onSurfaceVariant;
    final bg = isSelected ? scheme.primary : Colors.transparent;

    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Icon(icon, color: fg, size: 24),
      ),
    );
  }
}
