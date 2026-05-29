import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class UserViewScreen extends StatefulWidget {
  const UserViewScreen({
    super.key,
    required this.authController,
    required this.userId,
  });

  final AuthController authController;
  final String userId;

  @override
  State<UserViewScreen> createState() => _UserViewScreenState();
}

class _UserViewScreenState extends State<UserViewScreen> {
  final _repo = UsersRepository();
  bool _loading = true;
  String? _error;
  UserRow? _user;

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
      _user = await _repo.getUser(widget.userId);
      if (_user == null) _error = 'User not found';
    } catch (e) {
      _error = e.toString();
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

  String _date(DateTime? dt) {
    if (dt == null) return '-';
    return dt.toLocal().toIso8601String().split('T').first;
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
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
      ),
    );
    if (ok != true) return;
    try {
      await _repo.deleteUser(widget.userId);
      if (!mounted) return;
      context.go('/users');
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

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ReactPageHeader(
                          title: 'User Details',
                          subtitle: 'View user profile and system information',
                          backLabel: 'Back to Users',
                          onBack: () => context.go('/users'),
                          icon: Icons.person_outline,
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
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () =>
                            context.go('/users/${widget.userId}/edit'),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text(
                          'Edit User',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final wide = constraints.maxWidth >= 980;
                      final roleAccent = _roleAccent(_user!.role);
                      final initials = [
                        if (_user!.firstName.isNotEmpty) _user!.firstName[0],
                        if (_user!.lastName.isNotEmpty) _user!.lastName[0],
                      ].join().toUpperCase();

                      final personal = ReactCard(
                        header: const ReactCardHeader(
                          icon: Icons.person_outline,
                          title: 'Personal Information',
                          subtitle: 'Profile and contact details',
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  height: 72,
                                  width: 72,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        AppTokens.brand,
                                        AppTokens.brandDark,
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(999),
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
                                  alignment: Alignment.center,
                                  child: Text(
                                    initials.isEmpty ? '?' : initials,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 20,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _user!.fullName.isEmpty
                                            ? _user!.email
                                            : _user!.fullName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 22,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 8,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: roleAccent.withValues(
                                                alpha: 0.10,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                              border: Border.all(
                                                color: roleAccent.withValues(
                                                  alpha: 0.25,
                                                ),
                                              ),
                                            ),
                                            child: Text(
                                              _user!.role,
                                              style: TextStyle(
                                                color: roleAccent,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: _user!.isActive
                                                  ? AppTokens.brand.withValues(
                                                      alpha: 0.08,
                                                    )
                                                  : Colors.black.withValues(
                                                      alpha: 0.06,
                                                    ),
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                              border: Border.all(
                                                color: _user!.isActive
                                                    ? AppTokens.brand
                                                          .withValues(
                                                            alpha: 0.20,
                                                          )
                                                    : Colors.black.withValues(
                                                        alpha: 0.10,
                                                      ),
                                              ),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  _user!.isActive
                                                      ? Icons
                                                            .check_circle_outline
                                                      : Icons.cancel_outlined,
                                                  size: 14,
                                                  color: _user!.isActive
                                                      ? AppTokens.brand
                                                      : Colors.black54,
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  _user!.isActive
                                                      ? 'Active'
                                                      : 'Inactive',
                                                  style: TextStyle(
                                                    color: _user!.isActive
                                                        ? AppTokens.brand
                                                        : Colors.black54,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(height: 1),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 24,
                              runSpacing: 14,
                              children: [
                                _InfoLine(
                                  label: 'Email Address',
                                  icon: Icons.mail_outline,
                                  value: _user!.email,
                                ),
                                _InfoLine(
                                  label: 'Phone Number',
                                  icon: Icons.phone_outlined,
                                  value: (_user!.phoneNumber ?? '').isEmpty
                                      ? 'N/A'
                                      : _user!.phoneNumber!,
                                ),
                              ],
                            ),
                          ],
                        ),
                      );

                      final system = ReactCard(
                        header: const ReactCardHeader(
                          icon: Icons.shield_outlined,
                          title: 'System Information',
                          subtitle: 'Metadata and timestamps',
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'User ID',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: Colors.black.withValues(alpha: 0.06),
                                ),
                              ),
                              child: Text(
                                _user!.id,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            _InfoLine(
                              label: 'Created At',
                              icon: Icons.calendar_today_outlined,
                              value: _date(_user!.createdAt),
                            ),
                            const SizedBox(height: 10),
                            _InfoLine(
                              label: 'Last Updated',
                              icon: Icons.access_time_outlined,
                              value: _date(_user!.updatedAt),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  side: BorderSide(
                                    color: Colors.red.withValues(alpha: 0.35),
                                  ),
                                  foregroundColor: Colors.red,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                ),
                                onPressed: _delete,
                                icon: const Icon(Icons.delete_outline),
                                label: const Text(
                                  'Delete User',
                                  style: TextStyle(fontWeight: FontWeight.w900),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );

                      if (!wide) {
                        return Column(
                          children: [
                            personal,
                            const SizedBox(height: 14),
                            system,
                          ],
                        );
                      }

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 2, child: personal),
                          const SizedBox(width: 16),
                          Expanded(child: system),
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

class _InfoLine extends StatelessWidget {
  const _InfoLine({
    required this.label,
    required this.icon,
    required this.value,
  });

  final String label;
  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            color: muted,
            fontWeight: FontWeight.w800,
            fontSize: 11,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: muted),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
