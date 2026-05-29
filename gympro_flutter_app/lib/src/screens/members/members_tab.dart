import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../models/member.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

class MembersTab extends StatefulWidget {
  const MembersTab({super.key, required this.authController});

  final AuthController authController;

  @override
  State<MembersTab> createState() => _MembersTabState();
}

class _MembersTabState extends State<MembersTab> {
  final _repo = MembersRepository();
  final _search = TextEditingController();

  bool _loading = true;
  String? _error;
  List<Member> _members = const [];
  String _planFilter = 'all';

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

  Color _planAccent(String plan) {
    switch (plan) {
      case 'Gym':
        return const Color(0xFF14B8A6);
      case 'Gym + Cardio':
        return const Color(0xFF06B6D4);
      case 'Gym + Cardio + Crossfit':
        return const Color(0xFF16A34A);
      default:
        return AppTokens.brand;
    }
  }

  String _fmtDate(DateTime? dt) {
    if (dt == null) return '-';
    return dt.toLocal().toIso8601String().split('T').first;
  }

  Future<void> _confirmDelete(String memberId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Are you absolutely sure?'),
        content: const Text(
          'This action cannot be undone. This will permanently delete the member.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete Member'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _repo.deleteMember(memberId);
      if (!mounted) return;
      setState(
        () => _members = _members.where((m) => m.id != memberId).toList(),
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Member deleted successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _load() async {
    _safeSetState(() {
      _loading = true;
      _error = null;
    });
    try {
      final members = await _repo.listMembers();
      _safeSetState(() => _members = members);
    } catch (e) {
      _safeSetState(() => _error = e.toString());
    } finally {
      _safeSetState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _search.text.trim().toLowerCase();
    final bySearch = q.isEmpty
        ? _members
        : _members.where((m) {
            return m.firstName.toLowerCase().contains(q) ||
                m.lastName.toLowerCase().contains(q) ||
                m.email.toLowerCase().contains(q);
          }).toList();

    final rows = _planFilter == 'all'
        ? bySearch
        : bySearch.where((m) => m.membershipType == _planFilter).toList();

    final stats = <String, int>{
      'Total Members': _members.length,
      'Active': _members
          .where((m) => m.status.toUpperCase() == 'ACTIVE')
          .length,
      'Gym': _members.where((m) => m.membershipType == 'Gym').length,
      'Gym + Cardio': _members
          .where((m) => m.membershipType == 'Gym + Cardio')
          .length,
      'Full Package': _members
          .where((m) => m.membershipType == 'Gym + Cardio + Crossfit')
          .length,
    };

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final narrow = constraints.maxWidth < 720;

              final bulkUpload = OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  side: BorderSide(color: Colors.black.withValues(alpha: 0.10)),
                  foregroundColor: Colors.black87,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Bulk upload coming soon')),
                  );
                },
                icon: const Icon(Icons.upload_file_outlined, size: 18),
                label: const Text('Bulk Upload'),
              );

              final addMember = FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AppTokens.brand,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () => context.go('/members/new'),
                icon: const Icon(Icons.person_add_alt_1),
                label: const Text(
                  'Add Member',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              );

              if (!narrow) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Expanded(child: _MembersHeader()),
                    const SizedBox(width: 12),
                    bulkUpload,
                    const SizedBox(width: 10),
                    addMember,
                  ],
                );
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _MembersHeader(),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [bulkUpload, addMember],
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final w = constraints.maxWidth;
              final cross = w >= 980 ? 5 : (w >= 640 ? 3 : 2);
              return GridView.count(
                crossAxisCount: cross,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: w >= 980 ? 1.5 : 1.7,
                children: [
                  for (final e in stats.entries)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.black.withValues(alpha: 0.05),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 18,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          Text(
                            e.key,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '${e.value}',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                height: 1.1,
                                color: e.key == 'Total Members'
                                    ? AppTokens.brand
                                    : e.key == 'Active'
                                    ? const Color(0xFF10B981)
                                    : _planAccent(
                                        e.key == 'Full Package'
                                            ? 'Gym + Cardio + Crossfit'
                                            : e.key,
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(height: 16),
          ReactCard(
            header: const ReactCardHeader(
              icon: Icons.groups_outlined,
              title: 'Members Directory',
              subtitle: 'Manage and view all your gym members',
            ),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _search,
                        decoration: const InputDecoration(
                          hintText: 'Search members by name, email...',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 200,
                      child: DropdownButtonFormField<String>(
                        initialValue: _planFilter,
                        decoration: const InputDecoration(
                          hintText: 'Filter by plan',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'all',
                            child: Text('All Memberships'),
                          ),
                          DropdownMenuItem(
                            value: 'Gym',
                            child: Text('Gym Only'),
                          ),
                          DropdownMenuItem(
                            value: 'Gym + Cardio',
                            child: Text('Gym + Cardio'),
                          ),
                          DropdownMenuItem(
                            value: 'Gym + Cardio + Crossfit',
                            child: Text('Full Package'),
                          ),
                        ],
                        onChanged: (v) =>
                            setState(() => _planFilter = v ?? 'all'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.only(top: 18, bottom: 18),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_error != null)
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                      fontWeight: FontWeight.w800,
                    ),
                  )
                else if (rows.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 16, bottom: 10),
                    child: EmptyState(
                      title: 'No members found',
                      subtitle: 'Try adjusting your search or filters.',
                      icon: Icons.search_off,
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.black.withValues(alpha: 0.06),
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (final m in rows) ...[
                          _MemberDirectoryRow(
                            member: m,
                            planAccent: _planAccent(m.membershipType),
                            joinDate: _fmtDate(m.createdAt),
                            onView: () => context.go('/members/${m.id}'),
                            onEdit: () => context.go('/members/${m.id}/edit'),
                            onDelete: () => _confirmDelete(m.id),
                          ),
                          if (m.id != rows.last.id)
                            Divider(
                              height: 1,
                              color: Colors.black.withValues(alpha: 0.06),
                            ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _MembersHeader extends StatelessWidget {
  const _MembersHeader();

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.auto_awesome,
              color: AppTokens.brand.withValues(alpha: 0.95),
            ),
            const SizedBox(width: 10),
            Text(
              'Member Management',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Manage your gym members, memberships, and more.',
          style: TextStyle(color: muted, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _MemberDirectoryRow extends StatelessWidget {
  const _MemberDirectoryRow({
    required this.member,
    required this.planAccent,
    required this.joinDate,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
  });

  final Member member;
  final Color planAccent;
  final String joinDate;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    final initials = [
      if (member.firstName.isNotEmpty) member.firstName[0],
      if (member.lastName.isNotEmpty) member.lastName[0],
    ].join().toUpperCase();

    Widget pill({
      required String text,
      required Color fg,
      required Color bg,
      Color? border,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: border ?? Colors.transparent),
        ),
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: fg,
            fontSize: 12,
          ),
        ),
      );
    }

    Widget moreMenu({bool includeViewEdit = true}) {
      return PopupMenuButton<String>(
        tooltip: 'More',
        onSelected: (v) {
          switch (v) {
            case 'view':
              onView();
              break;
            case 'edit':
              onEdit();
              break;
            case 'delete':
              onDelete();
              break;
          }
        },
        itemBuilder: (context) => [
          if (includeViewEdit)
            const PopupMenuItem(
              value: 'view',
              child: Row(
                children: [
                  Icon(Icons.visibility_outlined),
                  SizedBox(width: 8),
                  Text('View'),
                ],
              ),
            ),
          if (includeViewEdit)
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit_outlined),
                  SizedBox(width: 8),
                  Text('Edit'),
                ],
              ),
            ),
          const PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(Icons.delete_outline, color: Colors.red),
                SizedBox(width: 8),
                Text('Delete Member'),
              ],
            ),
          ),
        ],
        icon: const Icon(Icons.more_vert),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final narrow = constraints.maxWidth < 420;
        final isActive = member.status.toUpperCase() == 'ACTIVE';

        return InkWell(
          onTap: onView,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: 46,
                      width: 46,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTokens.brand, AppTokens.brandDark],
                        ),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: [
                          BoxShadow(
                            color: AppTokens.brand.withValues(alpha: 0.20),
                            blurRadius: 18,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initials.isEmpty ? '?' : initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Positioned(
                      right: -1,
                      bottom: -1,
                      child: Container(
                        height: 12,
                        width: 12,
                        decoration: BoxDecoration(
                          color: isActive ? AppTokens.brand : Colors.black26,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              member.fullName.isEmpty
                                  ? member.email
                                  : member.fullName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          if (narrow) moreMenu(includeViewEdit: true),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 10,
                        runSpacing: 6,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.mail_outline, size: 16, color: muted),
                              const SizedBox(width: 6),
                              Text(
                                member.email,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: muted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          pill(
                            text: member.membershipType.isEmpty
                                ? 'Gym'
                                : member.membershipType,
                            fg: planAccent,
                            bg: planAccent.withValues(alpha: 0.10),
                            border: planAccent.withValues(alpha: 0.25),
                          ),
                          pill(
                            text: isActive ? 'Active' : 'Inactive',
                            fg: isActive ? AppTokens.brand : Colors.black54,
                            bg: isActive
                                ? AppTokens.brand.withValues(alpha: 0.10)
                                : Colors.black.withValues(alpha: 0.06),
                            border: isActive
                                ? AppTokens.brand.withValues(alpha: 0.20)
                                : Colors.black.withValues(alpha: 0.10),
                          ),
                          if (narrow)
                            pill(
                              text: 'Joined $joinDate',
                              fg: Colors.black87,
                              bg: Colors.black.withValues(alpha: 0.04),
                              border: Colors.black.withValues(alpha: 0.06),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (!narrow) ...[
                  const SizedBox(width: 10),
                  Text(
                    joinDate,
                    style: TextStyle(color: muted, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(width: 10),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: 'View',
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 34,
                          minHeight: 34,
                        ),
                        onPressed: onView,
                        icon: const Icon(Icons.visibility_outlined),
                      ),
                      IconButton(
                        tooltip: 'Edit',
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 34,
                          minHeight: 34,
                        ),
                        onPressed: onEdit,
                        icon: const Icon(Icons.edit_outlined),
                      ),
                      moreMenu(includeViewEdit: false),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
