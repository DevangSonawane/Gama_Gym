import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'auth/auth_controller.dart';
import 'screens/dashboard/dashboard_shell.dart';
import 'screens/login_screen.dart';
import 'screens/members/member_form_screen.dart';
import 'screens/members/member_view_screen.dart';
import 'screens/payments/payment_create_screen.dart';
import 'screens/promocodes/promocode_create_screen.dart';
import 'screens/staff/staff_form_screen.dart';
import 'screens/staff/staff_view_screen.dart';
import 'screens/users/user_form_screen.dart';
import 'screens/users/user_list_screen.dart';
import 'screens/users/user_view_screen.dart';

class AppRouter {
  AppRouter({required AuthController authController})
    : router = GoRouter(
        initialLocation: '/dashboard',
        refreshListenable: authController,
        redirect: (context, state) {
          final isAuthed = authController.isAuthenticated;
          final isLoading = authController.isLoading;
          final atLogin = state.matchedLocation == '/login';

          if (isLoading) return null;
          if (!isAuthed && !atLogin) return '/login';
          if (isAuthed && atLogin) return '/dashboard';

          // Guard: the Users section is admin-only. If a non-admin navigates here,
          // bounce them back to dashboard instead of showing a blank/unreachable page.
          if (state.matchedLocation.startsWith('/users') &&
              authController.user?.role.name != 'admin') {
            return '/dashboard';
          }
          return null;
        },
        routes: [
          GoRoute(
            path: '/login',
            builder: (context, state) =>
                LoginScreen(authController: authController),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (context, state) {
              final tab = state.uri.queryParameters['tab'] ?? 'overview';
              return DashboardShell(
                key: ValueKey('dashboard:$tab'),
                authController: authController,
                tab: tab,
              );
            },
          ),
          GoRoute(
            path: '/users',
            builder: (context, state) =>
                UserListScreen(authController: authController),
          ),
          GoRoute(
            path: '/users/new',
            builder: (context, state) =>
                UserFormScreen(authController: authController),
          ),
          GoRoute(
            path: '/users/:id',
            builder: (context, state) => UserViewScreen(
              authController: authController,
              userId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/users/:id/edit',
            builder: (context, state) => UserFormScreen(
              authController: authController,
              userId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/members/new',
            builder: (context, state) =>
                MemberFormScreen(authController: authController),
          ),
          GoRoute(
            path: '/members/:id',
            builder: (context, state) => MemberViewScreen(
              authController: authController,
              memberId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/members/:id/edit',
            builder: (context, state) => MemberFormScreen(
              authController: authController,
              memberId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/staff/new',
            builder: (context, state) =>
                StaffFormScreen(authController: authController),
          ),
          GoRoute(
            path: '/staff/:id',
            builder: (context, state) => StaffViewScreen(
              authController: authController,
              staffId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/staff/:id/edit',
            builder: (context, state) => StaffFormScreen(
              authController: authController,
              staffId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/payments/new',
            builder: (context, state) =>
                PaymentCreateScreen(authController: authController),
          ),
          GoRoute(
            path: '/promocodes/new',
            builder: (context, state) =>
                PromoCodeCreateScreen(authController: authController),
          ),
        ],
        errorBuilder: (context, state) => Scaffold(
          body: Center(child: Text(state.error?.toString() ?? 'Route error')),
        ),
      );

  final GoRouter router;
}
