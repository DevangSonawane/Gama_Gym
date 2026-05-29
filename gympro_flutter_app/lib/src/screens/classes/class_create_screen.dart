import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/classes_repository.dart';
import '../../data/staff_repository.dart';
import '../../gym_context.dart';
import '../../models/app_user.dart';
import '../../models/staff_member.dart';
import '../../ui/app_tokens.dart';
import '../../ui/react_cards.dart';

class ClassCreateScreen extends StatefulWidget {
  const ClassCreateScreen({super.key, required this.authController});

  final AuthController authController;

  @override
  State<ClassCreateScreen> createState() => _ClassCreateScreenState();
}

class _ClassCreateScreenState extends State<ClassCreateScreen> {
  final _classesRepo = ClassesRepository();
  final _staffRepo = StaffRepository();

  final _name = TextEditingController();
  final _description = TextEditingController();
  final _capacity = TextEditingController(text: '20');
  final _price = TextEditingController(text: '15');
  final _startTime = TextEditingController();
  final _endTime = TextEditingController();
  final _equipment = TextEditingController();

  final _formKey = GlobalKey<FormState>();

  bool _loading = true;
  bool _submitting = false;
  String? _error;

  List<StaffMember> _trainers = const [];
  String _instructorId = '';
  String _category = '';
  String _difficulty = 'Beginner';
  String _durationMinutes = '60';
  final List<String> _equipmentItems = [];
  String _startTimeValue = '';
  String _endTimeValue = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _capacity.dispose();
    _price.dispose();
    _startTime.dispose();
    _endTime.dispose();
    _equipment.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final staff = await _staffRepo.listStaff();
      _trainers = staff.where((s) => s.role == AppRole.trainer).toList()
        ..sort((a, b) => a.firstName.compareTo(b.firstName));
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _addEquipment() {
    final v = _equipment.text.trim();
    if (v.isEmpty) return;
    if (_equipmentItems.contains(v)) return;
    setState(() {
      _equipmentItems.add(v);
      _equipment.clear();
    });
  }

  void _removeEquipment(String v) {
    setState(() => _equipmentItems.remove(v));
  }

  String _trainerLabel(StaffMember t) {
    final name = t.fullName.isEmpty ? t.email : t.fullName;
    final specs = t.specializations;
    if (specs.isEmpty) return name;
    return '$name (${specs.join(', ')})';
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  Future<void> _pickTime({
    required TextEditingController controller,
    required ValueChanged<String> onValue,
    TimeOfDay? initial,
  }) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: initial ?? TimeOfDay.now(),
    );
    if (picked == null) return;
    if (!mounted) return;

    final loc = MaterialLocalizations.of(context);
    controller.text = loc.formatTimeOfDay(picked);
    onValue('${_two(picked.hour)}:${_two(picked.minute)}');
  }

  Future<void> _submit() async {
    if (_submitting) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final gymId = GymContext.defaultGymId;
    if (gymId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('DEFAULT_GYM_ID missing in .env')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final cap = int.parse(_capacity.text.trim());
      final duration = int.parse(_durationMinutes.trim());
      final price = double.parse(_price.text.trim());

      final classId = await _classesRepo.createClass(
        gymId: gymId,
        name: _name.text.trim(),
        description: _description.text.trim(),
        instructorId: _instructorId.trim().isEmpty
            ? null
            : _instructorId.trim(),
        capacity: cap,
        durationMinutes: duration,
        price: price,
        category: _category.trim().isEmpty ? 'General' : _category.trim(),
        difficulty: _difficulty,
        equipment: _equipmentItems,
        isActive: true,
      );

      final start = _startTimeValue.trim();
      final end = _endTimeValue.trim();
      if (classId.isNotEmpty && start.isNotEmpty && end.isNotEmpty) {
        final tomorrow = DateTime.now().add(const Duration(days: 1));
        try {
          await _classesRepo.createSchedule(
            gymId: gymId,
            classId: classId,
            date: tomorrow,
            startTime: start,
            endTime: end,
          );
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Class created, but schedule failed: ${e.toString()}',
                ),
              ),
            );
          }
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Class created successfully!')),
      );
      context.go('/dashboard?tab=classes');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canCreate =
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.admin);

    if (!canCreate) {
      return const Scaffold(body: Center(child: Text('Access denied')));
    }

    final isWide = MediaQuery.of(context).size.width >= 980;

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
                  ReactPageHeader(
                    title: 'Create New Class',
                    subtitle:
                        'Set up a new fitness class, schedule, and capacity.',
                    backLabel: 'Back to Classes',
                    onBack: () => context.go('/dashboard?tab=classes'),
                    icon: Icons.auto_awesome_outlined,
                  ),
                  const SizedBox(height: 16),
                  Form(
                    key: _formKey,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final wide = isWide || constraints.maxWidth >= 980;

                        final categories = const [
                          '',
                          'Yoga',
                          'HIIT',
                          'Strength',
                          'Cardio',
                          'Pilates',
                          'Boxing',
                          'Dance',
                        ];

                        final basicInfo = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.local_offer_outlined,
                            title: 'Basic Information',
                            subtitle: 'General details about the class',
                          ),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _name,
                                decoration: const InputDecoration(
                                  labelText: 'Class Name',
                                  hintText: 'e.g. Morning Yoga Flow',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) =>
                                    (v == null || v.trim().isEmpty)
                                    ? 'Required'
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _category,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Category',
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  for (final c in categories)
                                    DropdownMenuItem(
                                      value: c,
                                      child: Text(
                                        c.isEmpty ? 'Select Category' : c,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _category = v ?? ''),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _difficulty,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Difficulty Level',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'Beginner',
                                    child: Text(
                                      'Beginner',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 'Intermediate',
                                    child: Text(
                                      'Intermediate',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 'Advanced',
                                    child: Text(
                                      'Advanced',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                                onChanged: (v) => setState(
                                  () => _difficulty = v ?? 'Beginner',
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _description,
                                maxLines: 4,
                                decoration: const InputDecoration(
                                  labelText: 'Description',
                                  hintText:
                                      'Describe the class content, goals, and what to expect...',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ],
                          ),
                        );

                        final instructorSchedule = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.people_outline,
                            title: 'Instructor & Schedule',
                            subtitle: 'Who is teaching and when',
                          ),
                          child: Column(
                            children: [
                              DropdownButtonFormField<String>(
                                initialValue: _instructorId,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Trainer',
                                  border: OutlineInputBorder(),
                                ),
                                selectedItemBuilder: (context) {
                                  final items = <String>[
                                    '',
                                    ..._trainers.map((t) => t.id),
                                  ];
                                  return items
                                      .map(
                                        (id) => Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            id.isEmpty
                                                ? 'Select Trainer'
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
                                    setState(() => _instructorId = v ?? ''),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _startTime,
                                      readOnly: true,
                                      decoration: const InputDecoration(
                                        labelText: 'Start Time',
                                        hintText: '--:-- --',
                                        border: OutlineInputBorder(),
                                      ),
                                      onTap: () => _pickTime(
                                        controller: _startTime,
                                        onValue: (v) => _startTimeValue = v,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _endTime,
                                      readOnly: true,
                                      decoration: const InputDecoration(
                                        labelText: 'End Time',
                                        hintText: '--:-- --',
                                        border: OutlineInputBorder(),
                                      ),
                                      onTap: () => _pickTime(
                                        controller: _endTime,
                                        onValue: (v) => _endTimeValue = v,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );

                        final capacityPricing = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.payments_outlined,
                            title: 'Capacity & Pricing',
                            subtitle: 'Set price, duration, and capacity',
                          ),
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _price,
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                      signed: false,
                                      decimal: true,
                                    ),
                                decoration: const InputDecoration(
                                  labelText: 'Price per Session (₹)',
                                  prefixText: '₹ ',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (v) {
                                  final n = double.tryParse(v?.trim() ?? '');
                                  if (n == null || n < 0) return 'Invalid';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _capacity,
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(
                                        labelText: 'Max Capacity',
                                        border: OutlineInputBorder(),
                                      ),
                                      validator: (v) {
                                        final n = int.tryParse(v?.trim() ?? '');
                                        if (n == null || n <= 0) {
                                          return 'Invalid';
                                        }
                                        return null;
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: DropdownButtonFormField<String>(
                                      initialValue: _durationMinutes,
                                      isExpanded: true,
                                      decoration: const InputDecoration(
                                        labelText: 'Duration (minutes)',
                                        border: OutlineInputBorder(),
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: '30',
                                          child: Text(
                                            '30 minutes',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        DropdownMenuItem(
                                          value: '45',
                                          child: Text(
                                            '45 minutes',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        DropdownMenuItem(
                                          value: '60',
                                          child: Text(
                                            '60 minutes',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        DropdownMenuItem(
                                          value: '90',
                                          child: Text(
                                            '90 minutes',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        DropdownMenuItem(
                                          value: '120',
                                          child: Text(
                                            '120 minutes',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                      onChanged: (v) => setState(
                                        () => _durationMinutes = v ?? '60',
                                      ),
                                      validator: (v) {
                                        if (v == null || v.trim().isEmpty) {
                                          return 'Required';
                                        }
                                        return null;
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );

                        final equipment = ReactCard(
                          header: const ReactCardHeader(
                            icon: Icons.layers_outlined,
                            title: 'Equipment',
                            subtitle: 'Add equipment...',
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _equipment,
                                      decoration: const InputDecoration(
                                        hintText: 'Add equipment...',
                                        border: OutlineInputBorder(),
                                      ),
                                      onFieldSubmitted: (_) => _addEquipment(),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  FilledButton(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppTokens.brand,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    onPressed: _addEquipment,
                                    child: const Icon(
                                      Icons.check_circle_outline,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              if (_equipmentItems.isEmpty)
                                Text(
                                  'No equipment added yet',
                                  style: TextStyle(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurfaceVariant,
                                    fontWeight: FontWeight.w600,
                                  ),
                                )
                              else
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    for (final e in _equipmentItems)
                                      InkWell(
                                        borderRadius: BorderRadius.circular(12),
                                        onTap: () => _removeEquipment(e),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 10,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withValues(
                                              alpha: 0.04,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                e,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                '×',
                                                style: TextStyle(
                                                  color: Theme.of(context)
                                                      .colorScheme
                                                      .onSurfaceVariant,
                                                  fontWeight: FontWeight.w900,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                            ],
                          ),
                        );

                        final actions = ReactCard(
                          header: const SizedBox.shrink(),
                          child: Column(
                            children: [
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
                                  onPressed: _submitting ? null : _submit,
                                  child: _submitting
                                      ? const SizedBox(
                                          height: 18,
                                          width: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          'Create Class',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    side: BorderSide(
                                      color: Colors.black.withValues(
                                        alpha: 0.12,
                                      ),
                                    ),
                                    foregroundColor: Colors.black87,
                                  ),
                                  onPressed: _submitting
                                      ? null
                                      : () => context.go(
                                          '/dashboard?tab=classes',
                                        ),
                                  child: const Text(
                                    'Cancel',
                                    style: TextStyle(
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
                              basicInfo,
                              const SizedBox(height: 14),
                              instructorSchedule,
                              const SizedBox(height: 14),
                              capacityPricing,
                              const SizedBox(height: 14),
                              equipment,
                              const SizedBox(height: 14),
                              actions,
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
                                  basicInfo,
                                  const SizedBox(height: 14),
                                  instructorSchedule,
                                  const SizedBox(height: 14),
                                  capacityPricing,
                                  const SizedBox(height: 14),
                                  equipment,
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(child: Column(children: [actions])),
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
