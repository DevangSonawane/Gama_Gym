import 'package:flutter/material.dart';

import 'auth/auth_controller.dart';
import 'env.dart';
import 'router.dart';
import 'theme.dart';

class App extends StatefulWidget {
  const App({super.key, required this.env});

  final AppEnv env;

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late final AuthController _authController;
  late final AppRouter _router;

  @override
  void initState() {
    super.initState();
    _authController = AuthController()..initialize();
    _router = AppRouter(authController: _authController);
  }

  @override
  void dispose() {
    _authController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _authController,
      builder: (context, _) {
        return MaterialApp.router(
          title: 'GAMA',
          theme: buildAppTheme(),
          debugShowCheckedModeBanner: false,
          routerConfig: _router.router,
        );
      },
    );
  }
}
