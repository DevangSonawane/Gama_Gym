import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../data/staff_repository.dart';
import '../../data/users_repository.dart';
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
  final _usersRepo = UsersRepository();
  final _formKey = GlobalKey<FormState>();

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _dob = TextEditingController();
  final _address = TextEditingController();
  final _weight = TextEditingController();
  final _height = TextEditingController();
  final _heightFeet = TextEditingController();
  final _heightInches = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergencyPhone = TextEditingController();
  final _emergencyRelationship = TextEditingController();

  String _billingCycle = '1_month';
  String _membershipType = 'Basic';
  String _weightUnit = 'kg';
  String _heightUnit = 'cm';
  String _trainerId = '';
  bool _isActive = true;
  bool _loading = false;
  bool _loadingTrainers = true;
  bool _showPassword = false;
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
    _password.dispose();
    _phone.dispose();
    _dob.dispose();
    _address.dispose();
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

  static const _membershipPlans = <String, Map<String, Object>>{
    'Basic': {
      'name': 'Basic Gym',
      'description': 'Access to gym equipment',
      'features': ['Gym Equipment Access', 'Locker Room', 'Free Parking'],
      'prices': {
        '1_month': 999,
        '3_months': 2699,
        '6_months': 4999,
        'yearly': 8999,
      },
    },
    'Premium': {
      'name': 'Premium Gym + Cardio',
      'description': 'Gym + Cardio classes',
      'features': [
        'All Basic Features',
        'Unlimited Cardio Classes',
        'Nutrition Consultation',
      ],
      'prices': {
        '1_month': 1999,
        '3_months': 5399,
        '6_months': 9999,
        'yearly': 17999,
      },
    },
    'Elite': {
      'name': 'Elite All Access',
      'description': 'Complete fitness experience',
      'features': [
        'All Premium Features',
        'Crossfit Classes',
        'Personal Trainer (1x/week)',
        'Sauna Access',
      ],
      'prices': {
        '1_month': 3499,
        '3_months': 9499,
        '6_months': 17499,
        'yearly': 31499,
      },
    },
  };

  static const _cycleOrder = ['1_month', '3_months', '6_months', 'yearly'];

  int _membershipPrice(String planKey, String cycle) {
    final plan = _membershipPlans[planKey];
    if (plan == null) return 0;
    final prices = plan['prices'] as Map<String, Object>;
    final v = prices[cycle];
    if (v is int) return v;
    if (v is num) return v.round();
    return 0;
  }

  int _membershipTotalPrice() =>
      _membershipPrice(_membershipType, _billingCycle);

  String _cycleDisplayName(String cycle) {
    switch (cycle) {
      case '1_month':
        return '1 Month';
      case '3_months':
        return '3 Months';
      case '6_months':
        return '6 Months';
      case 'yearly':
        return 'Yearly';
      default:
        return '1 Month';
    }
  }

  String _cycleLabel(String cycle) {
    switch (cycle) {
      case '1_month':
        return '/month';
      case '3_months':
        return '/3 months';
      case '6_months':
        return '/6 months';
      case 'yearly':
        return '/year';
      default:
        return '/month';
    }
  }

  String _dbMembershipType(String planKey) {
    switch (planKey) {
      case 'Basic':
        return 'Gym';
      case 'Premium':
        return 'Gym + Cardio';
      case 'Elite':
        return 'Gym + Cardio + Crossfit';
      default:
        return 'Gym';
    }
  }

  String _planKeyFromDbMembershipType(String membershipType) {
    switch (membershipType.trim()) {
      case 'Gym':
        return 'Basic';
      case 'Gym + Cardio':
        return 'Premium';
      case 'Gym + Cardio + Crossfit':
        return 'Elite';
      default:
        return 'Basic';
    }
  }

  DateTime? _parseDob(String raw) {
    final v = raw.trim();
    if (v.isEmpty) return null;
    if (v.contains('/')) {
      final parts = v.split('/');
      if (parts.length == 3) {
        final dd = int.tryParse(parts[0]);
        final mm = int.tryParse(parts[1]);
        final yyyy = int.tryParse(parts[2]);
        if (dd != null && mm != null && yyyy != null) {
          return DateTime(yyyy, mm, dd);
        }
      }
    }
    return DateTime.tryParse(v);
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
          ? 'Basic'
          : _planKeyFromDbMembershipType(member.membershipType);
      _isActive = member.status.toUpperCase() != 'INACTIVE';
      _trainerId = member.trainerId ?? '';
      _billingCycle =
          (member.billingCycle == null || member.billingCycle!.trim().isEmpty)
          ? '1_month'
          : member.billingCycle!.trim();
      _address.text = member.address ?? '';
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

      final dob = _parseDob(_dob.text);

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

      final membershipType = _dbMembershipType(_membershipType);
      final planPrice = _membershipTotalPrice().toDouble();

      if (widget.memberId == null) {
        await _usersRepo.createUser(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phoneNumber: _phone.text.trim(),
          password: _password.text.trim(),
          role: 'member',
          isActive: _isActive,
        );

        await _repo.createMember(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          dob: dob,
          membershipType: membershipType,
          membershipBillingCycle: _billingCycle,
          planPrice: planPrice,
          address: _address.text.trim(),
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
          membershipType: membershipType,
          membershipBillingCycle: _billingCycle,
          planPrice: planPrice,
          address: _address.text.trim(),
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
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/dashboard?tab=members');
      }
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
                    onBack: () => context.canPop()
                        ? context.pop()
                        : context.go('/dashboard?tab=members'),
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
                              if (widget.memberId == null) ...[
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _password,
                                  decoration: InputDecoration(
                                    labelText: 'Login Password *',
                                    hintText: 'Create a password',
                                    border: const OutlineInputBorder(),
                                    suffixIcon: IconButton(
                                      tooltip: _showPassword
                                          ? 'Hide password'
                                          : 'Show password',
                                      onPressed: () => setState(
                                        () => _showPassword = !_showPassword,
                                      ),
                                      icon: Icon(
                                        _showPassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                      ),
                                    ),
                                  ),
                                  obscureText: !_showPassword,
                                  enableSuggestions: false,
                                  autocorrect: false,
                                  validator: (v) =>
                                      (v == null || v.trim().isEmpty)
                                      ? 'Required'
                                      : null,
                                ),
                              ],
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
                                  hintText: 'dd/mm/yyyy',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _address,
                                decoration: const InputDecoration(
                                  labelText: 'Address',
                                  border: OutlineInputBorder(),
                                ),
                                minLines: 2,
                                maxLines: 3,
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
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Trainer',
                                  border: OutlineInputBorder(),
                                ),
                                selectedItemBuilder: (context) {
                                  final items = <String>[
                                    '',
                                    if (_loadingTrainers)
                                      '__loading__'
                                    else
                                      ..._trainers.map((t) => t.id),
                                  ];
                                  return items
                                      .map(
                                        (id) => Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            id.isEmpty
                                                ? 'Select Trainer'
                                                : id == '__loading__'
                                                ? 'Loading trainers...'
                                                : () {
                                                    StaffMember? match;
                                                    for (final t in _trainers) {
                                                      if (t.id == id) {
                                                        match = t;
                                                        break;
                                                      }
                                                    }
                                                    if (match == null) {
                                                      return 'Unknown trainer';
                                                    }
                                                    return _trainerLabel(match);
                                                  }(),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      )
                                      .toList();
                                },
                                items: [
                                  const DropdownMenuItem(
                                    value: '',
                                    child: Text(
                                      'Select Trainer',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (_loadingTrainers)
                                    const DropdownMenuItem(
                                      value: '__loading__',
                                      enabled: false,
                                      child: Text(
                                        'Loading trainers...',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    )
                                  else
                                    for (final t in _trainers)
                                      DropdownMenuItem(
                                        value: t.id,
                                        child: Text(
                                          _trainerLabel(t),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
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
                            title: 'Physical Statistics',
                            subtitle: 'Body measurements for tracking progress',
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

                        final billing = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.calendar_month_outlined,
                            title: 'Select Billing Cycle',
                            subtitle:
                                'Choose how often the member will be billed',
                          ),
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final cross = constraints.maxWidth >= 560 ? 4 : 2;
                              return GridView.count(
                                crossAxisCount: cross,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: cross == 4 ? 2.7 : 3.0,
                                children: [
                                  for (final c in _cycleOrder)
                                    _CycleTile(
                                      label: _cycleDisplayName(c),
                                      selected: _billingCycle == c,
                                      onTap: () =>
                                          setState(() => _billingCycle = c),
                                    ),
                                ],
                              );
                            },
                          ),
                        );

                        final plans = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.credit_card_outlined,
                            title: 'Membership Plan',
                            subtitle: 'Select the best plan for the member',
                          ),
                          child: Column(
                            children: [
                              _MembershipPlanCard(
                                title:
                                    _membershipPlans['Basic']!['name']
                                        as String,
                                subtitle:
                                    _membershipPlans['Basic']!['description']
                                        as String,
                                price: _membershipPrice('Basic', _billingCycle),
                                cycleLabel: _cycleLabel(_billingCycle),
                                features:
                                    (_membershipPlans['Basic']!['features']
                                            as List)
                                        .cast<String>(),
                                selected: _membershipType == 'Basic',
                                onTap: () =>
                                    setState(() => _membershipType = 'Basic'),
                              ),
                              const SizedBox(height: 12),
                              _MembershipPlanCard(
                                title:
                                    _membershipPlans['Premium']!['name']
                                        as String,
                                subtitle:
                                    _membershipPlans['Premium']!['description']
                                        as String,
                                price: _membershipPrice(
                                  'Premium',
                                  _billingCycle,
                                ),
                                cycleLabel: _cycleLabel(_billingCycle),
                                features:
                                    (_membershipPlans['Premium']!['features']
                                            as List)
                                        .cast<String>(),
                                selected: _membershipType == 'Premium',
                                onTap: () =>
                                    setState(() => _membershipType = 'Premium'),
                              ),
                              const SizedBox(height: 12),
                              _MembershipPlanCard(
                                title:
                                    _membershipPlans['Elite']!['name']
                                        as String,
                                subtitle:
                                    _membershipPlans['Elite']!['description']
                                        as String,
                                price: _membershipPrice('Elite', _billingCycle),
                                cycleLabel: _cycleLabel(_billingCycle),
                                features:
                                    (_membershipPlans['Elite']!['features']
                                            as List)
                                        .cast<String>(),
                                selected: _membershipType == 'Elite',
                                onTap: () =>
                                    setState(() => _membershipType = 'Elite'),
                              ),
                            ],
                          ),
                        );

                        final summary = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.summarize_outlined,
                            title: 'Summary',
                            subtitle: 'Review the membership selection',
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _SummaryRow(
                                label:
                                    _membershipPlans[_membershipType]!['name']
                                        as String,
                                value: _cycleDisplayName(_billingCycle),
                              ),
                              const SizedBox(height: 10),
                              const Divider(height: 1),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  Text(
                                    '₹${_fmtInt(_membershipTotalPrice())}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 18,
                                      color: AppTokens.brand,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              SwitchListTile(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('Active'),
                                value: _isActive,
                                onChanged: (v) => setState(() => _isActive = v),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: SizedBox(
                                      height: 48,
                                      child: FilledButton(
                                        style: FilledButton.styleFrom(
                                          backgroundColor: AppTokens.brand,
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 14,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                          ),
                                        ),
                                        onPressed: _loading ? null : _submit,
                                        child: _loading
                                            ? const SizedBox(
                                                height: 18,
                                                width: 18,
                                                child:
                                                    CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      color: Colors.white,
                                                    ),
                                              )
                                            : Text(
                                                widget.memberId == null
                                                    ? 'Create'
                                                    : 'Save Changes',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: SizedBox(
                                      height: 48,
                                      child: OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 14,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                          ),
                                          side: BorderSide(
                                            color: Colors.black.withValues(
                                              alpha: 0.12,
                                            ),
                                          ),
                                          foregroundColor: Colors.black87,
                                        ),
                                        onPressed: () => context.canPop()
                                            ? context.pop()
                                            : context.go(
                                                '/dashboard?tab=members',
                                              ),
                                        child: const Text(
                                          'Cancel',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
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
                              billing,
                              const SizedBox(height: 14),
                              plans,
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
                            Expanded(
                              child: Column(
                                children: [
                                  billing,
                                  const SizedBox(height: 14),
                                  plans,
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

class _CycleTile extends StatelessWidget {
  const _CycleTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = selected
        ? AppTokens.brand
        : Colors.black.withValues(alpha: 0.04);
    final fg = selected ? Colors.white : Colors.black87;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: selected
              ? null
              : Border.all(color: Colors.black.withValues(alpha: 0.10)),
        ),
        child: Text(
          label,
          style: TextStyle(fontWeight: FontWeight.w900, color: fg),
        ),
      ),
    );
  }
}

class _MembershipPlanCard extends StatelessWidget {
  const _MembershipPlanCard({
    required this.title,
    required this.subtitle,
    required this.price,
    required this.cycleLabel,
    required this.features,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final int price;
  final String cycleLabel;
  final List<String> features;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final border = selected
        ? AppTokens.brand
        : Colors.black.withValues(alpha: 0.08);
    final bg = selected
        ? AppTokens.brand.withValues(alpha: 0.04)
        : Colors.white;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: border, width: selected ? 2 : 1),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 420;
            final muted = Theme.of(context).colorScheme.onSurfaceVariant;

            final priceBlock = Column(
              crossAxisAlignment: compact
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.end,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: compact
                      ? Alignment.centerLeft
                      : Alignment.centerRight,
                  child: Text(
                    '₹${_fmtInt(price)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      color: selected ? AppTokens.brand : Colors.black87,
                    ),
                  ),
                ),
                Text(
                  cycleLabel,
                  style: TextStyle(color: muted, fontWeight: FontWeight.w700),
                ),
              ],
            );

            return Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (compact) ...[
                      Text(
                        title,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          color: selected ? AppTokens.brand : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: muted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      priceBlock,
                    ] else ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                    color: selected
                                        ? AppTokens.brand
                                        : Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  subtitle,
                                  style: TextStyle(
                                    color: muted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          priceBlock,
                        ],
                      ),
                    ],
                    const SizedBox(height: 10),
                    for (final f in features) ...[
                      Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 18,
                            color: selected ? AppTokens.brand : Colors.black54,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              f,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                ),
                if (selected)
                  const Positioned(
                    top: 0,
                    right: 0,
                    child: Icon(
                      Icons.check_circle,
                      color: AppTokens.brand,
                      size: 22,
                    ),
                  ),
              ],
            );
          },
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
        Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
        Text(
          value,
          style: TextStyle(color: muted, fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

String _fmtInt(int v) {
  final s = v.toString();
  final re = RegExp(r'(\d)(?=(\d{3})+(?!\d))');
  return s.replaceAllMapped(re, (m) => '${m[1]},');
}
