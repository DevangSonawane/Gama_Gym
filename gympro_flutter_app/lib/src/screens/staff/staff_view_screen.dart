import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/staff_repository.dart';
import '../../models/staff_member.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';

class StaffViewScreen extends StatefulWidget {
  const StaffViewScreen({super.key, required this.authController, required this.staffId});

  final AuthController authController;
  final String staffId;

  @override
  State<StaffViewScreen> createState() => _StaffViewScreenState();
}

class _StaffViewScreenState extends State<StaffViewScreen> {
  final _repo = StaffRepository();
  bool _loading = true;
  String? _error;
  StaffMember? _staff;

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
      _staff = await _repo.getStaff(widget.staffId);
      if (_staff == null) _error = 'Staff member not found';
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
        title: const Text('Delete staff member?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;

    try {
      await _repo.deleteStaff(widget.staffId);
      if (!mounted) return;
      context.go('/dashboard?tab=staff');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(
        title: const Text('Staff'),
        actions: [
          IconButton(
            onPressed: _loading || _staff == null ? null : () => context.go('/staff/${widget.staffId}/edit'),
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
                  child: AppSurface(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_staff!.fullName, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 10),
                        _InfoRow(label: 'Email', value: _staff!.email),
                        _InfoRow(label: 'Phone', value: _staff!.phone ?? '-'),
                        _InfoRow(label: 'Role', value: _staff!.role.name.toUpperCase()),
                        _InfoRow(label: 'Department', value: _staff!.department),
                        _InfoRow(label: 'Position', value: _staff!.position),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: TextStyle(color: muted, fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}
