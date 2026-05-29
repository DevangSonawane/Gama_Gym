import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../data/payments_repository.dart';
import '../../models/app_user.dart';
import '../../ui/app_tokens.dart';
import '../../ui/empty_state.dart';
import '../../ui/react_cards.dart';

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
  final _promoCode = TextEditingController();

  String _type = 'MEMBERSHIP';
  String _method = 'STRIPE';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _memberId.dispose();
    _amount.dispose();
    _description.dispose();
    _promoCode.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final paymentId = await _repo.createPayment(
        memberId: _memberId.text.trim(),
        amount: double.parse(_amount.text.trim()),
        type: _type,
        method: _method,
        description: _description.text.trim(),
      );
      if (paymentId.isNotEmpty) {
        await _repo.createInvoiceForPayment(paymentId);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment processed and invoice generated')),
      );
      context.go('/dashboard?tab=payments');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  bool get _allowed {
    return widget.authController.hasRole(AppRole.admin) ||
        widget.authController.hasRole(AppRole.manager) ||
        widget.authController.hasRole(AppRole.staff);
  }

  double get _amountValue => double.tryParse(_amount.text.trim()) ?? 0;

  @override
  Widget build(BuildContext context) {
    if (!_allowed) {
      return const Scaffold(
        body: EmptyState(
          title: 'Access denied',
          subtitle: 'You do not have permission to process payments.',
          icon: Icons.lock_outline,
        ),
      );
    }

    final isWide = MediaQuery.of(context).size.width >= 980;

    return Scaffold(
      backgroundColor: AppTokens.pageBg,
      appBar: AppBar(title: const Text(''), toolbarHeight: 0),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ReactPageHeader(
              title: 'Process Payment',
              subtitle: 'Record a new transaction for a member',
              backLabel: 'Back to Payments',
              onBack: () => context.go('/dashboard?tab=payments'),
              icon: Icons.receipt_long_outlined,
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

                  final paymentDetails = ReactCard(
                    header: const ReactCardHeader(
                      icon: Icons.credit_card_outlined,
                      title: 'Payment Details',
                      subtitle: 'Member, type, method, and description',
                    ),
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _memberId,
                          decoration: const InputDecoration(
                            labelText: 'Member ID *',
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Required' : null,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _type,
                                decoration: const InputDecoration(
                                  labelText: 'Type',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'MEMBERSHIP',
                                    child: Text('MEMBERSHIP'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'CLASS',
                                    child: Text('CLASS'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'OTHER',
                                    child: Text('OTHER'),
                                  ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _type = v ?? 'MEMBERSHIP'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _method,
                                decoration: const InputDecoration(
                                  labelText: 'Method',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'STRIPE',
                                    child: Text('STRIPE'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'PAYPAL',
                                    child: Text('PAYPAL'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'CASH',
                                    child: Text('CASH'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'BANK_TRANSFER',
                                    child: Text('BANK_TRANSFER'),
                                  ),
                                ],
                                onChanged: (v) =>
                                    setState(() => _method = v ?? 'STRIPE'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _description,
                          decoration: const InputDecoration(
                            labelText: 'Description *',
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Required' : null,
                        ),
                      ],
                    ),
                  );

                  final promo = ReactCard(
                    header: const ReactCardHeader(
                      icon: Icons.sell_outlined,
                      title: 'Promo Code',
                      subtitle: 'Optional discount code',
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _promoCode,
                                decoration: const InputDecoration(
                                  labelText: 'Promo code',
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                side: BorderSide(
                                  color: Colors.black.withValues(alpha: 0.10),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 14,
                                ),
                              ),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Promo apply not implemented yet.',
                                    ),
                                  ),
                                );
                              },
                              child: const Text('Apply'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.auto_awesome,
                              size: 14,
                              color: AppTokens.brand,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Enter a valid promo code to apply discount automatically.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );

                  final amountCard = GradientReactCard(
                    title: 'Total Amount',
                    subtitle: 'Enter payment amount',
                    icon: Icons.attach_money_outlined,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _amount,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                          ),
                          decoration: InputDecoration(
                            hintText: '0.00',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: BorderSide(
                                color: Colors.black.withValues(alpha: 0.12),
                                width: 2,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: BorderSide(
                                color: Colors.black.withValues(alpha: 0.12),
                                width: 2,
                              ),
                            ),
                            prefixIcon: const Icon(
                              Icons.currency_rupee,
                              size: 28,
                              color: Colors.black38,
                            ),
                            filled: true,
                            fillColor: const Color(0xFFF3F4F6),
                          ),
                          validator: (v) => (v == null ||
                                  double.tryParse(v.trim()) == null)
                              ? 'Enter a number'
                              : null,
                          onChanged: (_) => setState(() {}),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTokens.brand.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppTokens.brand.withValues(alpha: 0.12),
                            ),
                          ),
                          child: Column(
                            children: [
                              _AmountRow(
                                label: 'Subtotal',
                                value:
                                    'INR ${_amountValue.toStringAsFixed(2)}',
                              ),
                              const SizedBox(height: 6),
                              const _AmountRow(
                                label: 'Tax (0%)',
                                value: 'INR 0.00',
                              ),
                              const SizedBox(height: 10),
                              Container(
                                height: 1,
                                color: AppTokens.brand.withValues(alpha: 0.12),
                              ),
                              const SizedBox(height: 10),
                              _AmountRow(
                                label: 'Total',
                                value:
                                    'INR ${_amountValue.toStringAsFixed(2)}',
                                isTotal: true,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppTokens.brand,
                              padding: const EdgeInsets.symmetric(vertical: 14),
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
                                    'Process Payment',
                                    style: TextStyle(fontWeight: FontWeight.w900),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (!wide) {
                    return Column(
                      children: [
                        paymentDetails,
                        const SizedBox(height: 14),
                        promo,
                        const SizedBox(height: 14),
                        amountCard,
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
                            paymentDetails,
                            const SizedBox(height: 14),
                            promo,
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(child: amountCard),
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

class _AmountRow extends StatelessWidget {
  const _AmountRow({
    required this.label,
    required this.value,
    this.isTotal = false,
  });

  final String label;
  final String value;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: muted,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: isTotal ? 18 : 14,
            color: isTotal ? AppTokens.brand : Colors.black87,
          ),
        ),
      ],
    );
  }
}
