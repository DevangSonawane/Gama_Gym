import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/classes_repository.dart';
import '../../models/app_user.dart';
import '../../models/class_schedule.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

class ClassesTab extends StatefulWidget {
  const ClassesTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<ClassesTab> createState() => _ClassesTabState();
}

class _ClassesTabState extends State<ClassesTab> {
  final _repo = ClassesRepository();
  final _search = TextEditingController();

  bool _loading = true;
  String? _error;
  List<ClassSchedule> _schedules = const [];
  String _category = 'all';

  void _safeSetState(VoidCallback fn) {
    if (!mounted) return;
    setState(fn);
  }

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    _safeSetState(() {
      _loading = true;
      _error = null;
    });
    try {
      final schedules = await _repo.listSchedules();
      _safeSetState(() => _schedules = schedules);
    } catch (e) {
      _safeSetState(() => _error = e.toString());
    } finally {
      _safeSetState(() => _loading = false);
    }
  }

  List<String> get _categories {
    final set = <String>{};
    for (final s in _schedules) {
      final c = s.gymClass.category.trim();
      if (c.isNotEmpty) set.add(c);
    }
    final list = set.toList()..sort();
    return ['all', ...list];
  }

  List<ClassSchedule> get _filtered {
    final q = _search.text.trim().toLowerCase();
    return _schedules.where((s) {
      final className = s.gymClass.name.toLowerCase();
      final instructor = s.gymClass.instructor?.fullName.toLowerCase() ?? '';
      final matchesSearch =
          q.isEmpty || className.contains(q) || instructor.contains(q);
      final matchesCategory =
          _category == 'all' || s.gymClass.category == _category;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  bool get _canCreate {
    return widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.admin);
  }

  Future<void> _openBooking(ClassSchedule schedule) async {
    await showDialog<void>(
      context: context,
      builder: (context) {
        final loc = MaterialLocalizations.of(context);
        return AlertDialog(
          title: const Text('Confirm booking'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('You are about to book a spot in ${schedule.gymClass.name}.'),
              const SizedBox(height: 12),
              _DialogRow(
                label: 'Date',
                value: loc.formatFullDate(schedule.date),
              ),
              _DialogRow(
                label: 'Time',
                value: '${schedule.startTime} - ${schedule.endTime}',
              ),
              _DialogRow(
                label: 'Instructor',
                value: schedule.gymClass.instructor?.fullName ?? 'Unknown',
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total', style: TextStyle(fontWeight: FontWeight.w800)),
                  Text(
                    'INR ${schedule.gymClass.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppTokens.brand,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(this.context).showSnackBar(
                  const SnackBar(content: Text('Class booked successfully!')),
                );
              },
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final schedules = _filtered;
    final isWide = MediaQuery.of(context).size.width >= 920;

    return ColoredBox(
      color: AppTokens.pageBg,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_month_outlined,
                            color: AppTokens.brand,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'Class Schedule',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Book and manage your fitness classes',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_canCreate)
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTokens.brand,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () => context.go('/classes/new'),
                    icon: const Icon(Icons.add),
                    label: const Text('Create'),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            AppSurface(
              padding: const EdgeInsets.all(14),
              child: LayoutBuilder(
                builder: (context, c) {
                  final isNarrow = c.maxWidth < 680;
                  final categoryItems = _categories;

                  final categoryDropdown = DropdownButtonFormField<String>(
                    initialValue:
                        categoryItems.contains(_category) ? _category : 'all',
                    decoration: InputDecoration(
                      labelText: 'Category',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                        ),
                      ),
                    ),
                    items: [
                      for (final v in categoryItems)
                        DropdownMenuItem(
                          value: v,
                          child: Text(v == 'all' ? 'All Categories' : v),
                        ),
                    ],
                    onChanged: (v) {
                      if (v == null) return;
                      setState(() => _category = v);
                    },
                  );

                  if (isNarrow) {
                    return Column(
                      children: [
                        AppSearchField(
                          controller: _search,
                          hintText: 'Search classes or instructors...',
                        ),
                        const SizedBox(height: 12),
                        categoryDropdown,
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(
                        child: AppSearchField(
                          controller: _search,
                          hintText: 'Search classes or instructors...',
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(width: 220, child: categoryDropdown),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 28),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              AppSurface(child: Text(_error!))
            else if (schedules.isEmpty)
              const EmptyState(
                title: 'No classes scheduled',
                subtitle: 'Create a class and add a schedule to start booking.',
                icon: Icons.calendar_month_outlined,
              )
            else
              LayoutBuilder(
                builder: (context, c) {
                  int cols = 1;
                  if (c.maxWidth >= 1050) {
                    cols = 3;
                  } else if (c.maxWidth >= 700) {
                    cols = 2;
                  }

                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: cols,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: isWide ? 1.25 : 1.05,
                    ),
                    itemCount: schedules.length,
                    itemBuilder: (context, i) =>
                        _ScheduleCard(schedule: schedules[i], onBook: _openBooking),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.schedule, required this.onBook});

  final ClassSchedule schedule;
  final ValueChanged<ClassSchedule> onBook;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final gymClass = schedule.gymClass;
    final muted = scheme.onSurfaceVariant;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () => onBook(schedule),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
            boxShadow: AppTokens.softShadow(opacity: 0.05),
          ),
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _CategoryBadge(text: gymClass.category),
                              const SizedBox(height: 8),
                              Text(
                                gymClass.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    Icons.schedule,
                                    size: 16,
                                    color: muted,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      '${schedule.startTime} - ${schedule.endTime} (${gymClass.durationMinutes} min)',
                                      style: TextStyle(
                                        color: muted,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'INR ${gymClass.price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: AppTokens.brand,
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              'per session',
                              style: TextStyle(
                                color: muted,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(
                            color: Colors.black.withValues(alpha: 0.04),
                          ),
                          bottom: BorderSide(
                            color: Colors.black.withValues(alpha: 0.04),
                          ),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            height: 40,
                            width: 40,
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Icon(
                              Icons.people_outline,
                              color: Colors.black.withValues(alpha: 0.35),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  gymClass.instructor?.fullName ?? 'Unknown Trainer',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Instructor',
                                  style: TextStyle(
                                    color: muted,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.place_outlined,
                                    size: 16,
                                    color: muted,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    schedule.roomName,
                                    style: TextStyle(
                                      color: muted,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              _OutlineBadge(text: gymClass.difficulty),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: DefaultTextStyle.of(context).style.copyWith(
                                    fontSize: 13,
                                  ),
                              children: [
                                TextSpan(
                                  text: '${schedule.bookedCount}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                TextSpan(
                                  text: '/${gymClass.capacity} spots',
                                  style: TextStyle(
                                    color: muted,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: () => onBook(schedule),
                          child: const Text('Book Now'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                  ],
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  height: 3,
                  color: Colors.black.withValues(alpha: 0.04),
                  child: FractionallySizedBox(
                    widthFactor: schedule.fillPercent,
                    alignment: Alignment.centerLeft,
                    child: const ColoredBox(color: AppTokens.brand),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryBadge extends StatelessWidget {
  const _CategoryBadge({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTokens.brand.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        text.isEmpty ? 'General' : text,
        style: const TextStyle(
          color: AppTokens.brand,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _OutlineBadge extends StatelessWidget {
  const _OutlineBadge({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.black.withValues(alpha: 0.12)),
      ),
      child: Text(
        text.isEmpty ? 'Beginner' : text,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 12,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _DialogRow extends StatelessWidget {
  const _DialogRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(color: muted, fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
