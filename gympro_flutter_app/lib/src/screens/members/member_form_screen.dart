import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../data/staff_repository.dart';
import '../../gym_context.dart';
import '../../models/app_user.dart';
import '../../models/staff_member.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class MemberFormScreen extends StatefulWidget {
  const MemberFormScreen({
    super.key,
    required this.authController,
    this.memberId,
  });

  final AuthController authController;
  final String? memberId;

  @override
  State<MemberFormScreen> createState() => _MemberFormScreenState();
}

class _MemberFormScreenState extends State<MemberFormScreen> {
  final _repo = MembersRepository();
  final _staffRepo = StaffRepository();
  final _formKey = GlobalKey<FormState>();

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _dob = TextEditingController();
  final _weight = TextEditingController();
  final _height = TextEditingController();
  final _heightFeet = TextEditingController();
  final _heightInches = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergencyPhone = TextEditingController();
  final _emergencyRelationship = TextEditingController();

  String _membershipType = 'Gym';
  String _weightUnit = 'kg';
  String _heightUnit = 'cm';
  String _trainerId = '';
  bool _isActive = true;
  bool _loading = false;
  bool _loadingTrainers = true;
  String? _error;
  List<StaffMember> _trainers = const [];

  @override
  void initState() {
    super.initState();
    _loadTrainers();
    if (widget.memberId != null) _load();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    _dob.dispose();
    _weight.dispose();
    _height.dispose();
    _heightFeet.dispose();
    _heightInches.dispose();
    _emergencyName.dispose();
    _emergencyPhone.dispose();
    _emergencyRelationship.dispose();
    super.dispose();
  }

  bool get _allowed {
    return widget.authController.hasRole(AppRole.admin) ||
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.staff);
  }

  double _membershipPrice(String membership) {
    switch (membership) {
      case 'Gym':
        return 39.99;
      case 'Gym + Cardio':
        return 59.99;
      case 'Gym + Cardio + Crossfit':
        return 89.99;
      default:
        return 39.99;
    }
  }

  String _trainerLabel(StaffMember t) {
    final name = t.fullName.isEmpty ? t.email : t.fullName;
    final specs = t.specializations;
    if (specs.isEmpty) return name;
    return '$name (${specs.join(', ')})';
  }

  Future<void> _loadTrainers() async {
    setState(() {
      _loadingTrainers = true;
    });
    try {
      final staff = await _staffRepo.listStaff();
      final trainers = staff.where((s) => s.role == AppRole.trainer).toList()
        ..sort((a, b) => a.firstName.compareTo(b.firstName));
      if (!mounted) return;
      setState(() => _trainers = trainers);
    } catch (e) {
      // Trainers are optional; keep going.
    } finally {
      if (mounted) setState(() => _loadingTrainers = false);
    }
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
      _membershipType = member.membershipType.isEmpty
          ? 'Gym'
          : member.membershipType;
      _isActive = member.status.toUpperCase() != 'INACTIVE';
      _trainerId = member.trainerId ?? '';
      if (member.dob != null) {
        _dob.text = member.dob!.toIso8601String().split('T').first;
      }
      if (member.weight != null) {
        _weight.text = member.weight!.toStringAsFixed(0);
      }
      if (member.heightCm != null) {
        _height.text = member.heightCm!.toStringAsFixed(0);
      }
      _emergencyName.text = member.emergencyContactName ?? '';
      _emergencyPhone.text = member.emergencyContactPhone ?? '';
      _emergencyRelationship.text = member.emergencyContactRelationship ?? '';
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
      final gymId = GymContext.defaultGymId;
      if (gymId.isEmpty) {
        throw StateError('DEFAULT_GYM_ID missing in .env');
      }

      DateTime? dob;
      final dobStr = _dob.text.trim();
      if (dobStr.isNotEmpty) {
        dob = DateTime.tryParse(dobStr);
      }

      double? weight;
      final weightStr = _weight.text.trim();
      if (weightStr.isNotEmpty) {
        final raw = double.tryParse(weightStr);
        if (raw != null) {
          weight = _weightUnit == 'lbs' ? raw * 0.45359237 : raw;
        }
      }

      double? heightCm;
      if (_heightUnit == 'cm') {
        final h = double.tryParse(_height.text.trim());
        if (h != null) heightCm = h;
      } else {
        final ft = double.tryParse(_heightFeet.text.trim());
        final inch = double.tryParse(_heightInches.text.trim());
        if (ft != null) {
          final totalInches = (ft * 12) + (inch ?? 0);
          heightCm = totalInches * 2.54;
        }
      }

      final planPrice = _membershipPrice(_membershipType);

      if (widget.memberId == null) {
        await _repo.createMember(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          dob: dob,
          membershipType: _membershipType,
          planPrice: planPrice,
          weight: weight,
          heightCm: heightCm,
          trainerId: _trainerId,
          emergencyContactName: _emergencyName.text.trim(),
          emergencyContactPhone: _emergencyPhone.text.trim(),
          emergencyContactRelationship: _emergencyRelationship.text.trim(),
          isActive: _isActive,
        );
      } else {
        await _repo.updateMember(
          id: widget.memberId!,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          dob: dob,
          membershipType: _membershipType,
          planPrice: planPrice,
          weight: weight,
          heightCm: heightCm,
          trainerId: _trainerId,
          emergencyContactName: _emergencyName.text.trim(),
          emergencyContactPhone: _emergencyPhone.text.trim(),
          emergencyContactRelationship: _emergencyRelationship.text.trim(),
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
    final title = widget.memberId == null ? 'Add New Member' : 'Edit Member';
    final isWide = MediaQuery.of(context).size.width >= 980;

    if (!_allowed) {
      return const Scaffold(
        body: EmptyState(
          title: 'Access denied',
          subtitle: 'You do not have permission to add members.',
          icon: Icons.lock_outline,
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: _loading && widget.memberId != null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  ReactPageHeader(
                    title: title,
                    subtitle:
                        'Create a new membership account and set up their profile',
                    backLabel: 'Back to Members',
                    onBack: () => context.go('/dashboard?tab=members'),
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

                        final personal = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.person_outline,
                            title: 'Personal Information',
                            subtitle: 'Basic details about the member',
                            accent: AppTokens.brand,
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
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _dob,
                                decoration: const InputDecoration(
                                  labelText: 'Date of Birth',
                                  hintText: 'YYYY-MM-DD',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ],
                          ),
                        );

                        final assignTrainer = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.badge_outlined,
                            title: 'Assign Trainer',
                            subtitle: 'Choose a trainer for this member',
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              DropdownButtonFormField<String>(
                                initialValue: _trainerId,
                                decoration: const InputDecoration(
                                  labelText: 'Trainer',
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  const DropdownMenuItem(
                                    value: '',
                                    child: Text('Select Trainer'),
                                  ),
                                  if (_loadingTrainers)
                                    const DropdownMenuItem(
                                      value: '__loading__',
                                      enabled: false,
                                      child: Text('Loading trainers...'),
                                    )
                                  else
                                    for (final t in _trainers)
                                      DropdownMenuItem(
                                        value: t.id,
                                        child: Text(_trainerLabel(t)),
                                      ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _trainerId = v ?? ''),
                              ),
                            ],
                          ),
                        );

                        final emergency = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.emergency_outlined,
                            title: 'Emergency Contact',
                            subtitle: 'Who to contact in case of emergency',
                          ),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _emergencyName,
                                decoration: const InputDecoration(
                                  labelText: 'Contact Name',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _emergencyPhone,
                                decoration: const InputDecoration(
                                  labelText: 'Contact Phone',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _emergencyRelationship,
                                decoration: const InputDecoration(
                                  labelText: 'Relationship',
                                  hintText: 'Spouse, Parent, etc.',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ],
                          ),
                        );

                        final stats = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.monitor_heart_outlined,
                            title: 'Physical Stats',
                            subtitle: 'Optional measurements for the profile',
                            accent: AppTokens.brand,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Weight',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _weight,
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(
                                        hintText: '70',
                                        border: OutlineInputBorder(),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  SizedBox(
                                    width: 92,
                                    child: DropdownButtonFormField<String>(
                                      initialValue: _weightUnit,
                                      decoration: const InputDecoration(
                                        border: OutlineInputBorder(),
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: 'kg',
                                          child: Text('kg'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'lbs',
                                          child: Text('lbs'),
                                        ),
                                      ],
                                      onChanged: (v) => setState(
                                        () => _weightUnit = v ?? 'kg',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Height',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (_heightUnit == 'cm')
                                    Expanded(
                                      child: TextFormField(
                                        controller: _height,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          hintText: '175',
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                    )
                                  else ...[
                                    Expanded(
                                      child: TextFormField(
                                        controller: _heightFeet,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          hintText: '5',
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _heightInches,
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          hintText: '9',
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                    ),
                                  ],
                                  const SizedBox(width: 12),
                                  SizedBox(
                                    width: 92,
                                    child: DropdownButtonFormField<String>(
                                      initialValue: _heightUnit,
                                      decoration: const InputDecoration(
                                        border: OutlineInputBorder(),
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: 'cm',
                                          child: Text('cm'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'ft',
                                          child: Text('ft'),
                                        ),
                                      ],
                                      onChanged: (v) => setState(
                                        () => _heightUnit = v ?? 'cm',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );

                        final membership = GradientReactCard(
                          title: 'Membership Plan',
                          subtitle: 'Select the best plan for the member',
                          icon: Icons.credit_card_outlined,
                          child: Column(
                            children: [
                              for (final plan in const [
                                'Gym',
                                'Gym + Cardio',
                                'Gym + Cardio + Crossfit',
                              ]) ...[
                                _PlanTile(
                                  plan: plan,
                                  selected: _membershipType == plan,
                                  price: _membershipPrice(plan),
                                  onTap: () =>
                                      setState(() => _membershipType = plan),
                                ),
                                const SizedBox(height: 10),
                              ],
                              const Divider(height: 22),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Monthly Total',
                                    style: TextStyle(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.onSurfaceVariant,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    '\$${_membershipPrice(_membershipType).toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      color: AppTokens.brand,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 22,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              SwitchListTile(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('Active'),
                                value: _isActive,
                                onChanged: (v) => setState(() => _isActive = v),
                              ),
                              const SizedBox(height: 10),
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
                                      : const Text(
                                          'Create Member Account',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                child: TextButton(
                                  onPressed: () =>
                                      context.go('/dashboard?tab=members'),
                                  child: const Text('Cancel'),
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
                              assignTrainer,
                              const SizedBox(height: 14),
                              emergency,
                              const SizedBox(height: 14),
                              stats,
                              const SizedBox(height: 14),
                              membership,
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
                                  personal,
                                  const SizedBox(height: 14),
                                  assignTrainer,
                                  const SizedBox(height: 14),
                                  emergency,
                                  const SizedBox(height: 14),
                                  stats,
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(child: membership),
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

class _PlanTile extends StatelessWidget {
  const _PlanTile({
    required this.plan,
    required this.selected,
    required this.price,
    required this.onTap,
  });

  final String plan;
  final bool selected;
  final double price;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final border = selected
        ? AppTokens.brand
        : Colors.black.withValues(alpha: 0.06);
    final bg = selected
        ? AppTokens.brand.withValues(alpha: 0.06)
        : Colors.white;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: border, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                plan,
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  color: selected ? AppTokens.brand : Colors.black87,
                ),
              ),
            ),
            Text(
              '\$${price.toStringAsFixed(2)}/mo',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: selected ? AppTokens.brand : Colors.black87,
              ),
            ),
            const SizedBox(width: 10),
            Icon(
              selected ? Icons.check_circle : Icons.circle_outlined,
              color: selected ? AppTokens.brand : Colors.black38,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
