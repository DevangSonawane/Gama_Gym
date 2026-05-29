import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';

class UserFormScreen extends StatefulWidget {
  const UserFormScreen({super.key, required this.authController, this.userId});

  final AuthController authController;
  final String? userId;

  @override
  State<UserFormScreen> createState() => _UserFormScreenState();
}

class _UserFormScreenState extends State<UserFormScreen> {
  final _repo = UsersRepository();
  final _formKey = GlobalKey<FormState>();

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  String _role = 'member';
  bool _isActive = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.userId != null) _load();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final u = await _repo.getUser(widget.userId!);
      if (u == null) {
        setState(() => _error = 'User not found');
        return;
      }
      _first.text = u.firstName;
      _last.text = u.lastName;
      _email.text = u.email;
      _phone.text = u.phoneNumber ?? '';
      _role = u.role;
      _isActive = u.isActive;
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.userId == null) {
      if (_password.text.length < 6) {
        setState(() => _error = 'Password must be at least 6 characters');
        return;
      }
      if (_password.text != _confirm.text) {
        setState(() => _error = 'Passwords do not match');
        return;
      }
    } else {
      if (_password.text.isNotEmpty && _password.text != _confirm.text) {
        setState(() => _error = 'Passwords do not match');
        return;
      }
      if (_password.text.isNotEmpty && _password.text.length < 6) {
        setState(() => _error = 'Password must be at least 6 characters');
        return;
      }
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (widget.userId == null) {
        await _repo.createUser(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phoneNumber: _phone.text.trim(),
          role: _role,
          isActive: _isActive,
          password: _password.text,
        );
      } else {
        await _repo.updateUser(
          id: widget.userId!,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phoneNumber: _phone.text.trim(),
          role: _role,
          isActive: _isActive,
          newPassword: _password.text.isEmpty ? null : _password.text,
        );
      }
      if (!mounted) return;
      context.go('/users');
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
        appBar: AppBar(title: const Text('User')),
        body: const Center(child: Text('Access denied (admin only).')),
      );
    }

    final title = widget.userId == null ? 'Create User' : 'Edit User';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _loading && widget.userId != null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Card(
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(_error!),
                    ),
                  ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _first,
                            decoration: const InputDecoration(labelText: 'First name', border: OutlineInputBorder()),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _last,
                            decoration: const InputDecoration(labelText: 'Last name', border: OutlineInputBorder()),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _email,
                            decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _phone,
                            decoration: const InputDecoration(labelText: 'Phone (optional)', border: OutlineInputBorder()),
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            initialValue: _role,
                            decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'admin', child: Text('admin')),
                              DropdownMenuItem(value: 'manager', child: Text('manager')),
                              DropdownMenuItem(value: 'trainer', child: Text('trainer')),
                              DropdownMenuItem(value: 'member', child: Text('member')),
                            ],
                            onChanged: (v) => setState(() => _role = v ?? 'member'),
                          ),
                          const SizedBox(height: 8),
                          SwitchListTile(
                            title: const Text('Active'),
                            value: _isActive,
                            onChanged: (v) => setState(() => _isActive = v),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _password,
                            decoration: InputDecoration(
                              labelText: widget.userId == null ? 'Password' : 'New password (optional)',
                              border: const OutlineInputBorder(),
                            ),
                            obscureText: true,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _confirm,
                            decoration: const InputDecoration(
                              labelText: 'Confirm password',
                              border: OutlineInputBorder(),
                            ),
                            obscureText: true,
                          ),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: _loading ? null : _submit,
                            child: _loading
                                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text('Save'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
