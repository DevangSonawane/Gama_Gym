import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/staff_repository.dart';
import '../../models/app_user.dart';

class StaffFormScreen extends StatefulWidget {
  const StaffFormScreen({super.key, required this.authController, this.staffId});

  final AuthController authController;
  final String? staffId;

  @override
  State<StaffFormScreen> createState() => _StaffFormScreenState();
}

class _StaffFormScreenState extends State<StaffFormScreen> {
  final _repo = StaffRepository();
  final _formKey = GlobalKey<FormState>();

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _department = TextEditingController(text: 'Fitness');
  final _position = TextEditingController(text: 'Trainer');

  AppRole _role = AppRole.staff;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.staffId != null) _load();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    _department.dispose();
    _position.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final staff = await _repo.getStaff(widget.staffId!);
      if (staff == null) {
        setState(() => _error = 'Staff member not found');
        return;
      }
      _first.text = staff.firstName;
      _last.text = staff.lastName;
      _email.text = staff.email;
      _phone.text = staff.phone ?? '';
      _department.text = staff.department;
      _position.text = staff.position;
      _role = staff.role;
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.staffId == null) {
        await _repo.createStaff(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          role: _role,
          department: _department.text.trim(),
          position: _position.text.trim(),
        );
      } else {
        await _repo.updateStaff(
          id: widget.staffId!,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          role: _role,
          department: _department.text.trim(),
          position: _position.text.trim(),
        );
      }
      if (!mounted) return;
      context.go('/dashboard?tab=staff');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.staffId == null ? 'Add Staff' : 'Edit Staff';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _loading && widget.staffId != null
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
                          DropdownButtonFormField<AppRole>(
                            initialValue: _role,
                            decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: AppRole.staff, child: Text('STAFF')),
                              DropdownMenuItem(value: AppRole.trainer, child: Text('TRAINER')),
                              DropdownMenuItem(value: AppRole.manager, child: Text('MANAGER')),
                            ],
                            onChanged: (v) => setState(() => _role = v ?? AppRole.staff),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _department,
                            decoration: const InputDecoration(labelText: 'Department', border: OutlineInputBorder()),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _position,
                            decoration: const InputDecoration(labelText: 'Position', border: OutlineInputBorder()),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
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
