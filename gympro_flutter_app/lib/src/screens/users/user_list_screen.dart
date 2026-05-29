import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class UserListScreen extends StatefulWidget {
  const UserListScreen({super.key, required this.authController});

  final AuthController authController;

  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  final _repo = UsersRepository();
  final _search = TextEditingController();

  bool _loading = true;
  String? _error;
  List<UserRow> _users = const [];
  String _roleFilter = 'all';

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

  Color _roleAccent(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return const Color(0xFF6D28D9);
      case 'manager':
        return const Color(0xFF2563EB);
      case 'trainer':
        return const Color(0xFF0891B2);
      case 'member':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFF6B7280);
    }
  }

  Widget _pill({
    required BuildContext context,
    required String text,
    required Color fg,
    required Color bg,
    Color? border,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border ?? Colors.transparent),
      ),
      child: Text(
        text,
        style: TextStyle(fontWeight: FontWeight.w700, color: fg, fontSize: 12),
      ),
    );
  }

  Future<void> _confirmDelete(String userId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Are you absolutely sure?'),
          content: const Text(
            'This action cannot be undone. This will permanently delete the user and remove their access to the system.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete User'),
            ),
          ],
        );
      },
    );
    if (ok != true) return;
    try {
      await _repo.deleteUser(userId);
      if (!mounted) return;
      setState(() => _users = _users.where((u) => u.id != userId).toList());
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User deleted successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.authController.hasRole(AppRole.admin)) {
      return const Scaffold(
        body: EmptyState(
          title: 'Access denied',
          subtitle: 'Admin only.',
          icon: Icons.lock_outline,
        ),
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

    final filteredRows = _roleFilter == 'all'
        ? rows
        : rows.where((u) => u.role.toLowerCase() == _roleFilter).toList();

    final stats = <String, int>{
      'Total Users': _users.length,
      'Active': _users.where((u) => u.isActive).length,
      'Admins': _users.where((u) => u.role.toLowerCase() == 'admin').length,
      'Managers': _users.where((u) => u.role.toLowerCase() == 'manager').length,
      'Trainers': _users.where((u) => u.role.toLowerCase() == 'trainer').length,
      'Members': _users.where((u) => u.role.toLowerCase() == 'member').length,
    };

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: ReactPageHeader(
                      title: 'User Management',
                      subtitle: 'Manage system users and their roles',
                      backLabel: 'Back to Dashboard',
                      onBack: () => context.go('/dashboard?tab=overview'),
                      icon: Icons.auto_awesome,
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTokens.brand,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    onPressed: () => context.go('/users/new'),
                    icon: const Icon(Icons.person_add_alt_1),
                    label: const Text(
                      'Create New User',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final w = constraints.maxWidth;
                  final cross = w >= 980 ? 6 : (w >= 640 ? 3 : 2);
                  return GridView.count(
                    crossAxisCount: cross,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: w >= 980 ? 1.45 : 1.7,
                    children: [
                      for (final entry in stats.entries)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.black.withValues(alpha: 0.05),
                            ),
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
                                entry.key,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${entry.value}',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: entry.key == 'Total Users'
                                      ? AppTokens.brand
                                      : _roleAccent(
                                          entry.key
                                              .replaceAll('Total Users', '')
                                              .trim()
                                              .toLowerCase(),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 16),
              ReactCard(
                header: const ReactCardHeader(
                  icon: Icons.groups_outlined,
                  title: 'Users Directory',
                  subtitle: 'Search and manage users',
                ),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _search,
                            decoration: const InputDecoration(
                              hintText: 'Search users...',
                              prefixIcon: Icon(Icons.search),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 190,
                          child: DropdownButtonFormField<String>(
                            initialValue: _roleFilter,
                            decoration: const InputDecoration(
                              hintText: 'Filter by role',
                              border: OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'all',
                                child: Text('All Roles'),
                              ),
                              DropdownMenuItem(
                                value: 'admin',
                                child: Text('Admin'),
                              ),
                              DropdownMenuItem(
                                value: 'manager',
                                child: Text('Manager'),
                              ),
                              DropdownMenuItem(
                                value: 'trainer',
                                child: Text('Trainer'),
                              ),
                              DropdownMenuItem(
                                value: 'member',
                                child: Text('Member'),
                              ),
                            ],
                            onChanged: (v) =>
                                setState(() => _roleFilter = v ?? 'all'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    if (_loading)
                      const Padding(
                        padding: EdgeInsets.only(top: 18, bottom: 18),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (_error != null)
                      Text(
                        _error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w800,
                        ),
                      )
                    else if (filteredRows.isEmpty)
                      const Padding(
                        padding: EdgeInsets.only(top: 16, bottom: 10),
                        child: EmptyState(
                          title: 'No users found',
                          subtitle: 'Try adjusting your filters.',
                          icon: Icons.search_off,
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Colors.black.withValues(alpha: 0.06),
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          children: [
                            for (final u in filteredRows) ...[
                              _UserDirectoryRow(
                                user: u,
                                roleAccent: _roleAccent(u.role),
                                rolePill: _pill(
                                  context: context,
                                  text: u.role,
                                  fg: _roleAccent(u.role),
                                  bg: _roleAccent(
                                    u.role,
                                  ).withValues(alpha: 0.10),
                                  border: _roleAccent(
                                    u.role,
                                  ).withValues(alpha: 0.25),
                                ),
                                statusPill: _pill(
                                  context: context,
                                  text: u.isActive ? 'Active' : 'Inactive',
                                  fg: u.isActive
                                      ? AppTokens.brand
                                      : Colors.black54,
                                  bg: u.isActive
                                      ? AppTokens.brand.withValues(alpha: 0.10)
                                      : Colors.black.withValues(alpha: 0.06),
                                  border: u.isActive
                                      ? AppTokens.brand.withValues(alpha: 0.20)
                                      : Colors.black.withValues(alpha: 0.10),
                                ),
                                onView: () => context.go('/users/${u.id}'),
                                onEdit: () => context.go('/users/${u.id}/edit'),
                                onDelete: () => _confirmDelete(u.id),
                              ),
                              if (u.id != filteredRows.last.id)
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
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UserDirectoryRow extends StatelessWidget {
  const _UserDirectoryRow({
    required this.user,
    required this.roleAccent,
    required this.rolePill,
    required this.statusPill,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
  });

  final UserRow user;
  final Color roleAccent;
  final Widget rolePill;
  final Widget statusPill;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    final initials = [
      if (user.firstName.isNotEmpty) user.firstName[0],
      if (user.lastName.isNotEmpty) user.lastName[0],
    ].join().toUpperCase();

    return InkWell(
      onTap: onView,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTokens.brand, AppTokens.brandDark],
                ),
                borderRadius: BorderRadius.circular(999),
                boxShadow: [
                  BoxShadow(
                    color: AppTokens.brand.withValues(alpha: 0.20),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Text(
                initials.isEmpty ? '?' : initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.fullName.isEmpty ? user.email : user.fullName,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 10,
                    runSpacing: 4,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.mail_outline, size: 16, color: muted),
                          const SizedBox(width: 6),
                          Text(
                            user.email,
                            style: TextStyle(
                              color: muted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      if ((user.phoneNumber ?? '').trim().isNotEmpty)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.phone_outlined, size: 16, color: muted),
                            const SizedBox(width: 6),
                            Text(
                              user.phoneNumber!,
                              style: TextStyle(
                                color: muted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [rolePill, const SizedBox(height: 8), statusPill],
            ),
            const SizedBox(width: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'View',
                  onPressed: onView,
                  icon: const Icon(Icons.visibility_outlined),
                ),
                IconButton(
                  tooltip: 'Edit',
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                ),
                PopupMenuButton<String>(
                  tooltip: 'More',
                  onSelected: (v) {
                    if (v == 'delete') onDelete();
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete User'),
                        ],
                      ),
                    ),
                  ],
                  icon: const Icon(Icons.more_vert),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
