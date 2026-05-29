import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/members_repository.dart';
import '../../models/member.dart';
import '../../ui/app_search.dart';
import '../../ui/app_surfaces.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';

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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final members = await _repo.listMembers();
      setState(() => _members = members);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _search.text.trim().toLowerCase();
    final rows = q.isEmpty
        ? _members
        : _members.where((m) {
            return m.firstName.toLowerCase().contains(q) ||
                m.lastName.toLowerCase().contains(q) ||
                m.email.toLowerCase().contains(q);
          }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          const AppSectionTitle(
            title: 'Members',
            subtitle: 'Manage member profiles and memberships.',
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: AppSearchField(controller: _search, hintText: 'Search members...')),
              const SizedBox(width: 12),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppTokens.brand,
                  shape: RoundedRectangleBorder(borderRadius: AppTokens.pill),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onPressed: () => context.go('/members/new'),
                child: const Icon(Icons.person_add_alt_1),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 28),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            AppSurface(child: Text(_error!))
          else if (rows.isEmpty)
            EmptyState(
              title: 'No members',
              subtitle: 'Create your first member to get started.',
              icon: Icons.people_outline,
              action: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTokens.brand),
                onPressed: () => context.go('/members/new'),
                child: const Text('Add Member'),
              ),
            )
          else
            AppSurface(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final m in rows) ...[
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      leading: Container(
                        height: 40,
                        width: 40,
                        decoration: BoxDecoration(
                          color: AppTokens.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          m.firstName.isEmpty ? '?' : m.firstName[0].toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppTokens.brand),
                        ),
                      ),
                      title: Text(m.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        '${m.email}\n${m.membershipType} • ${m.status}',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                      isThreeLine: true,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.go('/members/${m.id}'),
                    ),
                    if (m.id != rows.last.id)
                      Divider(height: 1, color: Colors.black.withValues(alpha: 0.06)),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}
