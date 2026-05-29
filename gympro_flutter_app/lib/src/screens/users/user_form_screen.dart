import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/users_repository.dart';
import '../../models/app_user.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

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
      return const Scaffold(
        body: EmptyState(
          title: 'Access denied',
          subtitle: 'Admin only.',
          icon: Icons.lock_outline,
        ),
      );
    }

    final isWide = MediaQuery.of(context).size.width >= 980;
    final title = widget.userId == null ? 'Create New User' : 'Edit User';
    final subtitle = widget.userId == null
        ? 'Add a new user to the system with their role and credentials'
        : 'Update user details, role and security settings';

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: _loading && widget.userId != null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ReactPageHeader(
                    title: title,
                    subtitle: subtitle,
                    backLabel: 'Back to Users',
                    onBack: () => context.go('/users'),
                    icon: Icons.person_add_alt_1,
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) ...[
                    ReactCard(
                      header: ReactCardHeader(
                        icon: Icons.error_outline,
                        title: 'Error',
                        subtitle: 'Please fix the issue and retry.',
                        accent: Theme.of(context).colorScheme.error,
                      ),
                      child: Text(
                        _error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],
                  Form(
                    key: _formKey,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final wide = isWide || constraints.maxWidth >= 980;

                        final personal = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.person_outline,
                            title: 'Personal Information',
                            subtitle: 'Basic details about the user',
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _first,
                                      decoration: const InputDecoration(
                                        labelText: 'First Name *',
                                        border: OutlineInputBorder(),
                                      ),
                                      validator: (v) =>
                                          (v == null || v.trim().isEmpty)
                                          ? 'Required'
                                          : null,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _last,
                                      decoration: const InputDecoration(
                                        labelText: 'Last Name *',
                                        border: OutlineInputBorder(),
                                      ),
                                      validator: (v) =>
                                          (v == null || v.trim().isEmpty)
                                          ? 'Required'
                                          : null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _email,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(
                                  labelText: 'Email *',
                                  prefixIcon: Icon(Icons.mail_outline),
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty)
                                    ? 'Required'
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _phone,
                                keyboardType: TextInputType.phone,
                                decoration: const InputDecoration(
                                  labelText: 'Phone Number',
                                  hintText: '+1-555-0100',
                                  prefixIcon: Icon(Icons.phone_outlined),
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ],
                          ),
                        );

                        final security = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.shield_outlined,
                            title: 'Role & Security',
                            subtitle: 'Role, status, and credentials',
                          ),
                          child: Column(
                            children: [
                              DropdownButtonFormField<String>(
                                initialValue: _role,
                                decoration: const InputDecoration(
                                  labelText: 'Role *',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
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
                                    setState(() => _role = v ?? 'member'),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _isActive ? 'active' : 'inactive',
                                decoration: const InputDecoration(
                                  labelText: 'Status',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'active',
                                    child: Text('Active'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'inactive',
                                    child: Text('Inactive'),
                                  ),
                                ],
                                onChanged: (v) => setState(
                                  () => _isActive = (v ?? 'active') == 'active',
                                ),
                              ),
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _password,
                                obscureText: true,
                                decoration: InputDecoration(
                                  labelText: widget.userId == null
                                      ? 'Password *'
                                      : 'New password (optional)',
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  border: const OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _confirm,
                                obscureText: true,
                                decoration: const InputDecoration(
                                  labelText: 'Confirm Password',
                                  prefixIcon: Icon(Icons.lock_outline),
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton.icon(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppTokens.brand,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  onPressed: _loading ? null : _submit,
                                  icon: _loading
                                      ? const SizedBox(
                                          height: 18,
                                          width: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Icon(Icons.save_outlined),
                                  label: Text(
                                    widget.userId == null
                                        ? 'Create User'
                                        : 'Save Changes',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                    ),
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
                              security,
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 2, child: personal),
                            const SizedBox(width: 16),
                            Expanded(child: security),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
