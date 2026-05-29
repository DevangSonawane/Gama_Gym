import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/staff_repository.dart';
import '../../models/app_user.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class StaffFormScreen extends StatefulWidget {
  const StaffFormScreen({
    super.key,
    required this.authController,
    this.staffId,
  });

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
  final _position = TextEditingController();
  String _department = 'Fitness';
  final _salary = TextEditingController();

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
    _position.dispose();
    _salary.dispose();
    super.dispose();
  }

  bool get _allowed {
    return widget.authController.hasRole(AppRole.admin) ||
        widget.authController.hasRole(AppRole.manager);
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
      _department = staff.department.isEmpty ? 'Fitness' : staff.department;
      _position.text = staff.position;
      _role = staff.role;
      _salary.text = (staff.salary ?? 0).toStringAsFixed(0);
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
      final salary = double.parse(_salary.text.trim());

      if (widget.staffId == null) {
        await _repo.createStaff(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          role: _role,
          department: _department.trim(),
          position: _position.text.trim(),
          salary: salary,
          bio: null,
          specializations: const [],
          yearsExperience: 0,
        );
      } else {
        await _repo.updateStaff(
          id: widget.staffId!,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          role: _role,
          department: _department.trim(),
          position: _position.text.trim(),
          salary: salary,
          bio: null,
          specializations: const [],
          yearsExperience: 0,
        );
      }
      if (!mounted) return;
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/dashboard?tab=staff');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.staffId == null
        ? 'Add Staff Member'
        : 'Edit Staff Member';
    final isWide = MediaQuery.of(context).size.width >= 980;

    if (!_allowed) {
      return const Scaffold(
        body: EmptyState(
          title: 'Access denied',
          subtitle: 'You do not have permission to add staff.',
          icon: Icons.lock_outline,
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: _loading && widget.staffId != null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ReactPageHeader(
                    title: title,
                    subtitle: 'Onboard a new employee, trainer, or manager.',
                    backLabel: 'Back to Staff',
                    onBack: () =>
                        context.canPop() ? context.pop() : context.go('/dashboard?tab=staff'),
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
                          fontWeight: FontWeight.w700,
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

                        const departments = <String>[
                          'Fitness',
                          'Operations',
                          'Sales',
                          'Management',
                        ];

                        final personalInfo = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.person_outline,
                            title: 'Personal Information',
                            subtitle: 'Basic details about the staff member',
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
                                decoration: const InputDecoration(
                                  labelText: 'Email Address *',
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.emailAddress,
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty)
                                    ? 'Required'
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _phone,
                                decoration: const InputDecoration(
                                  labelText: 'Phone Number',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ],
                          ),
                        );

                        final employmentDetails = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.work_outline,
                            title: 'Employment Details',
                            subtitle: 'Role and department configuration',
                          ),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _position,
                                decoration: const InputDecoration(
                                  labelText: 'Position Title',
                                  hintText: 'e.g. Senior Trainer',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty)
                                    ? 'Required'
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _department,
                                decoration: const InputDecoration(
                                  labelText: 'Department',
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  for (final d in departments)
                                    DropdownMenuItem(value: d, child: Text(d)),
                                ],
                                onChanged: (v) => setState(
                                  () => _department = v ?? 'Fitness',
                                ),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<AppRole>(
                                initialValue: _role,
                                decoration: const InputDecoration(
                                  labelText: 'System Role',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: AppRole.staff,
                                    child: Text('Staff'),
                                  ),
                                  DropdownMenuItem(
                                    value: AppRole.trainer,
                                    child: Text('Trainer'),
                                  ),
                                  DropdownMenuItem(
                                    value: AppRole.manager,
                                    child: Text('Manager'),
                                  ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _role = v ?? AppRole.staff),
                              ),
                            ],
                          ),
                        );

                        final compensation = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.attach_money_outlined,
                            title: 'Compensation',
                            subtitle: 'Set salary and benefits',
                          ),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _salary,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Annual Salary (₹)',
                                  hintText: '0.00',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) {
                                  final n = double.tryParse(v?.trim() ?? '');
                                  if (n == null) return 'Required';
                                  if (n < 0) return 'Invalid';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppTokens.brand.withValues(
                                    alpha: 0.06,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: AppTokens.brand.withValues(
                                      alpha: 0.12,
                                    ),
                                  ),
                                ),
                                child: const Text(
                                  'Gym Access\nStaff members receive full gym access and employee benefits automatically.',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                        );

                        final summary = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.check_circle_outline,
                            title: 'Summary',
                            subtitle: 'Review and create staff member',
                          ),
                          child: Column(
                            children: [
                              _SummaryRow(
                                label: 'Department',
                                value: _department.trim().isEmpty
                                    ? '-'
                                    : _department.trim(),
                              ),
                              const SizedBox(height: 10),
                              _SummaryRow(
                                label: 'Role',
                                value: _role.name.toUpperCase(),
                              ),
                              const SizedBox(height: 14),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
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
                                  child: _loading
                                      ? const SizedBox(
                                          height: 18,
                                          width: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : Text(
                                          widget.staffId == null
                                              ? 'Create Staff Member'
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
                              personalInfo,
                              const SizedBox(height: 14),
                              employmentDetails,
                              const SizedBox(height: 14),
                              compensation,
                              const SizedBox(height: 14),
                              summary,
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Column(
                                children: [
                                  personalInfo,
                                  const SizedBox(height: 14),
                                  employmentDetails,
                                  const SizedBox(height: 14),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                children: [
                                  compensation,
                                  const SizedBox(height: 14),
                                  summary,
                                ],
                              ),
                            ),
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: muted, fontWeight: FontWeight.w700),
        ),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900)),
      ],
    );
  }
}
