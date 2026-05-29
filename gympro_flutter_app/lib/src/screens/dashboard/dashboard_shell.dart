import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../members/members_tab.dart';
import '../payments/payments_tab.dart';
import '../staff/staff_tab.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../overview/overview_tab.dart';

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

        final effectiveTab = tab.trim().isEmpty ? 'overview' : tab.trim();

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
            roles: [AppRole.staff, AppRole.manager, AppRole.admin],
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
            id: 'payments',
            label: 'Payments',
            icon: Icons.payments_outlined,
            tab: 'payments',
            roles: [AppRole.staff, AppRole.manager, AppRole.admin],
          ),
          const _NavItem(
            id: 'analytics',
            label: 'Analytics',
            icon: Icons.bar_chart_outlined,
            tab: 'analytics',
            roles: [AppRole.manager, AppRole.admin],
          ),
          const _NavItem(
            id: 'users',
            label: 'Users',
            icon: Icons.admin_panel_settings_outlined,
            tab: 'users',
            roles: [AppRole.admin],
          ),
        ];

        final items = allItems
            .where((i) => i.roles == null || i.roles!.contains(user.role))
            .toList();
        final selectedIndex = items.indexWhere((i) => i.tab == effectiveTab);
        final safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
        final activeTab = items[safeIndex].tab;

        Widget body() {
          switch (activeTab) {
            case 'overview':
              return OverviewTab(authController: authController);
            case 'members':
              return MembersTab(authController: authController);
            case 'staff':
              return StaffTab(authController: authController);
            case 'payments':
              return PaymentsTab(authController: authController);
            case 'users':
              return _UsersTab(authController: authController);
            default:
              return _PlaceholderTab(
                title: items[safeIndex].label,
                subtitle:
                    'This tab is scaffolded. Next: match the full web UI & features.',
              );
          }
        }

        void goTab(String nextTab) {
          context.go('/dashboard?tab=$nextTab');
        }

        // On small screens, if a tab is not allowed for this role, show an explicit message
        // instead of silently falling back to Overview (which can look like a blank/white page).
        final tabIsAllowed = selectedIndex >= 0;

        final isWide = MediaQuery.of(context).size.width >= 900;

        return Scaffold(
          backgroundColor: AppTokens.pageBg,
          appBar: AppBar(
            title: Text(
              'Welcome back, ${user.firstName}',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            actions: [
              IconButton(
                tooltip: 'Profile',
                onPressed: () => context.go('/dashboard?tab=profile'),
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
          body: !tabIsAllowed
              ? const EmptyState(
                  title: 'Not available',
                  subtitle: 'You don’t have permission to view this section.',
                  icon: Icons.lock_outline,
                )
              : Row(
                  children: [
                    if (isWide)
                      NavigationRail(
                        extended: true,
                        selectedIndex: safeIndex,
                        onDestinationSelected: (i) => goTab(items[i].tab),
                        destinations: [
                          for (final item in items)
                            NavigationRailDestination(
                              icon: Icon(item.icon),
                              label: Text(item.label),
                            ),
                        ],
                      ),
                    Expanded(child: body()),
                  ],
                ),
          bottomNavigationBar: isWide
              ? null
              : _FloatingPillNav(
                  items: items,
                  selectedIndex: safeIndex,
                  onSelected: (i) => goTab(items[i].tab),
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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final users = await _repo.listUsers();
      setState(() => _users = users);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
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

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      title: title,
      subtitle: subtitle,
      icon: Icons.auto_awesome_outlined,
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
    final maxWidth = MediaQuery.of(context).size.width - 32;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Material(
            color: bg,
            elevation: 0,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              constraints: BoxConstraints(maxWidth: maxWidth),
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
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (int i = 0; i < items.length; i++)
                      _PillNavItem(
                        icon: items[i].icon,
                        isSelected: i == selectedIndex,
                        onTap: () => onSelected(i),
                      ),
                  ],
                ),
              ),
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

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Icon(icon, color: fg, size: 24),
        ),
      ),
    );
  }
}
