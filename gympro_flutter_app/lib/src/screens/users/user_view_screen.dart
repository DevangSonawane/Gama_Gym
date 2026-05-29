import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../models/user_row.dart';

class UserViewScreen extends StatefulWidget {
  const UserViewScreen({super.key, required this.authController, required this.userId});

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

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete user?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.authController.hasRole(AppRole.admin)) {
      return Scaffold(
        appBar: AppBar(title: const Text('User')),
        body: const Center(child: Text('Access denied (admin only).')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('User'),
        actions: [
          IconButton(
            onPressed: _loading ? null : () => context.go('/users/${widget.userId}/edit'),
            icon: const Icon(Icons.edit_outlined),
          ),
          IconButton(
            onPressed: _loading ? null : _delete,
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_user!.fullName, style: Theme.of(context).textTheme.headlineSmall),
                          const SizedBox(height: 8),
                          Text('Email: ${_user!.email}'),
                          Text('Phone: ${_user!.phoneNumber ?? '-'}'),
                          Text('Role: ${_user!.role}'),
                          Text('Active: ${_user!.isActive}'),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }
}

