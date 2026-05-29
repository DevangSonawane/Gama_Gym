import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';

class MemberFormScreen extends StatefulWidget {
  const MemberFormScreen({super.key, required this.authController, this.memberId});

  final AuthController authController;
  final String? memberId;

  @override
  State<MemberFormScreen> createState() => _MemberFormScreenState();
}

class _MemberFormScreenState extends State<MemberFormScreen> {
  final _repo = MembersRepository();
  final _formKey = GlobalKey<FormState>();

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();

  String _membershipType = 'Gym';
  bool _isActive = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.memberId != null) _load();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final member = await _repo.getMember(widget.memberId!);
      if (member == null) {
        setState(() => _error = 'Member not found');
        return;
      }
      _first.text = member.firstName;
      _last.text = member.lastName;
      _email.text = member.email;
      _phone.text = member.phone ?? '';
      _membershipType = member.membershipType.isEmpty ? 'Gym' : member.membershipType;
      _isActive = member.status.toUpperCase() != 'INACTIVE';
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
      if (widget.memberId == null) {
        await _repo.createMember(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          membershipType: _membershipType,
          isActive: _isActive,
        );
      } else {
        await _repo.updateMember(
          id: widget.memberId!,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          membershipType: _membershipType,
          isActive: _isActive,
        );
      }
      if (!mounted) return;
      context.go('/dashboard?tab=members');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.memberId == null ? 'Add Member' : 'Edit Member';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _loading && widget.memberId != null
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
                            initialValue: _membershipType,
                            decoration: const InputDecoration(labelText: 'Membership type', border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'Gym', child: Text('Gym')),
                              DropdownMenuItem(value: 'Gym + Cardio', child: Text('Gym + Cardio')),
                              DropdownMenuItem(value: 'Gym + Cardio + Crossfit', child: Text('Gym + Cardio + Crossfit')),
                            ],
                            onChanged: (v) => setState(() => _membershipType = v ?? 'Gym'),
                          ),
                          const SizedBox(height: 8),
                          SwitchListTile(
                            title: const Text('Active'),
                            value: _isActive,
                            onChanged: (v) => setState(() => _isActive = v),
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
