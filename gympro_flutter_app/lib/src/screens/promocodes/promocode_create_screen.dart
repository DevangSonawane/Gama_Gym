import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/auth_controller.dart';

class PromoCodeCreateScreen extends StatefulWidget {
  const PromoCodeCreateScreen({super.key, required this.authController});

  final AuthController authController;

  @override
  State<PromoCodeCreateScreen> createState() => _PromoCodeCreateScreenState();
}

class _PromoCodeCreateScreenState extends State<PromoCodeCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _code = TextEditingController();
  final _desc = TextEditingController();
  final _value = TextEditingController();
  final _validFrom = TextEditingController();
  final _validTo = TextEditingController();

  String _type = 'percentage';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    _desc.dispose();
    _value.dispose();
    _validFrom.dispose();
    _validTo.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.from('promo_codes').insert({
        'code': _code.text.trim().toUpperCase(),
        'description': _desc.text.trim(),
        'type': _type,
        'value': double.parse(_value.text.trim()),
        'valid_from': _validFrom.text.trim(),
        'valid_to': _validTo.text.trim(),
        'usage_limit': null,
        'used_count': 0,
        'is_active': true,
        'applicable_services': ['membership', 'class'],
      });
      if (!mounted) return;
      context.go('/dashboard?tab=payments');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Promo Code')),
      body: ListView(
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
                      controller: _code,
                      decoration: const InputDecoration(labelText: 'Code', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _desc,
                      decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _type,
                      decoration: const InputDecoration(labelText: 'Type', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'percentage', child: Text('percentage')),
                        DropdownMenuItem(value: 'fixed', child: Text('fixed')),
                      ],
                      onChanged: (v) => setState(() => _type = v ?? 'percentage'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _value,
                      decoration: const InputDecoration(labelText: 'Value', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                      validator: (v) => (v == null || double.tryParse(v.trim()) == null) ? 'Enter a number' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _validFrom,
                      decoration: const InputDecoration(labelText: 'Valid from (YYYY-MM-DD)', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _validTo,
                      decoration: const InputDecoration(labelText: 'Valid to (YYYY-MM-DD)', border: OutlineInputBorder()),
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
