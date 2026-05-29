import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/payments_repository.dart';

class PaymentCreateScreen extends StatefulWidget {
  const PaymentCreateScreen({super.key, required this.authController});

  final AuthController authController;

  @override
  State<PaymentCreateScreen> createState() => _PaymentCreateScreenState();
}

class _PaymentCreateScreenState extends State<PaymentCreateScreen> {
  final _repo = PaymentsRepository();
  final _formKey = GlobalKey<FormState>();

  final _memberId = TextEditingController();
  final _amount = TextEditingController();
  final _description = TextEditingController();

  String _type = 'MEMBERSHIP';
  String _method = 'STRIPE';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _memberId.dispose();
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _repo.createPayment(
        memberId: _memberId.text.trim(),
        amount: double.parse(_amount.text.trim()),
        type: _type,
        method: _method,
        description: _description.text.trim(),
      );
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
      appBar: AppBar(title: const Text('Process Payment')),
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
                      controller: _memberId,
                      decoration: const InputDecoration(labelText: 'Member ID', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _amount,
                      decoration: const InputDecoration(labelText: 'Amount', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                      validator: (v) => (v == null || double.tryParse(v.trim()) == null) ? 'Enter a number' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _type,
                      decoration: const InputDecoration(labelText: 'Type', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'MEMBERSHIP', child: Text('MEMBERSHIP')),
                        DropdownMenuItem(value: 'CLASS', child: Text('CLASS')),
                        DropdownMenuItem(value: 'OTHER', child: Text('OTHER')),
                      ],
                      onChanged: (v) => setState(() => _type = v ?? 'MEMBERSHIP'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _method,
                      decoration: const InputDecoration(labelText: 'Method', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'STRIPE', child: Text('STRIPE')),
                        DropdownMenuItem(value: 'PAYPAL', child: Text('PAYPAL')),
                        DropdownMenuItem(value: 'CASH', child: Text('CASH')),
                        DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('BANK_TRANSFER')),
                      ],
                      onChanged: (v) => setState(() => _method = v ?? 'STRIPE'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _description,
                      decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
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
