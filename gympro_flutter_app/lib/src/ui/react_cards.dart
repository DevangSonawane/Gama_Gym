import 'package:flutter/material.dart';

import 'app_tokens.dart';

class ReactPageHeader extends StatelessWidget {
  const ReactPageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.backLabel,
    required this.onBack,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final String backLabel;
  final VoidCallback onBack;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    final showBackLabel = backLabel.trim().isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        showBackLabel
            ? OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  side: BorderSide(color: Colors.black.withValues(alpha: 0.10)),
                  foregroundColor: Colors.black87,
                ),
                onPressed: onBack,
                icon: const Icon(Icons.arrow_back, size: 18),
                label: Text(backLabel),
              )
            : OutlinedButton(
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  side: BorderSide(color: Colors.black.withValues(alpha: 0.10)),
                  foregroundColor: Colors.black87,
                  minimumSize: const Size(44, 44),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                ),
                onPressed: onBack,
                child: const Icon(Icons.arrow_back, size: 18),
              ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                color: AppTokens.brand,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppTokens.brand.withValues(alpha: 0.20),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: muted, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class ReactCardHeader extends StatelessWidget {
  const ReactCardHeader({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.accent = AppTokens.brand,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF3F4F6), Colors.white],
        ),
        border: Border(
          bottom: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      child: Row(
        children: [
          Container(
            height: 34,
            width: 34,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: accent, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(color: muted, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ReactCard extends StatelessWidget {
  const ReactCard({
    super.key,
    required this.header,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget header;
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          header,
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

class GradientReactCard extends StatelessWidget {
  const GradientReactCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final mutedOn = Colors.white.withValues(alpha: 0.82);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTokens.brand, AppTokens.brandDark],
              ),
            ),
            child: Row(
              children: [
                Icon(icon, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: mutedOn,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(padding: const EdgeInsets.all(16), child: child),
        ],
      ),
    );
  }
}
