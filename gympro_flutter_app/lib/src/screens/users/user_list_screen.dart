import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

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
      return Scaffold(
        appBar: AppBar(title: const Text('Users')),
        body: const Center(child: Text('Access denied (admin only).')),
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

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(
        title: const Text('Users'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard?tab=overview'),
        ),
        actions: [
          IconButton(
            tooltip: 'Create user',
            onPressed: () => context.go('/users/new'),
            icon: const Icon(Icons.person_add_alt_1),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            AppSearchField(controller: _search, hintText: 'Search users...'),
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
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: Container(
                          height: 40,
                          width: 40,
                          decoration: BoxDecoration(
                            color: AppTokens.brand.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            u.firstName.isEmpty ? '?' : u.firstName[0].toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.w800, color: AppTokens.brand),
                          ),
                        ),
                        title: Text(u.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(
                          '${u.email}\n${u.role} • ${u.isActive ? 'active' : 'inactive'}',
                          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        isThreeLine: true,
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.go('/users/${u.id}'),
                      ),
                      if (u.id != rows.last.id)
                        Divider(height: 1, color: Colors.black.withValues(alpha: 0.06)),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
