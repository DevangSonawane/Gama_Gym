import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_user.dart';
import 'auth_storage.dart';
import 'password_hasher.dart';

class AuthController extends ChangeNotifier {
  final _storage = AuthStorage();

  AppUser? _user;
  bool _isLoading = true;

  AppUser? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  bool hasRole(AppRole role) => _user?.role == role;

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _storage.readUser();
    } catch (_) {
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _user = null;
    await _storage.clear();
    notifyListeners();
  }

  Future<void> loginWithEmailOrPhone({
    required String emailOrPhone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final isEmail = emailOrPhone.contains('@');
      final query = Supabase.instance.client.from('users').select('*');
      final result = isEmail
          ? await query.eq('email', emailOrPhone.toLowerCase().trim()).single()
          : await query.eq('phone_number', emailOrPhone.trim()).single();

      final isActive = (result['is_active'] as bool?) ?? true;
      if (!isActive) {
        throw StateError('Account is deactivated. Please contact administrator.');
      }

      final storedHash = (result['password_hash'] as String?) ?? '';
      final computedHash = sha256Hex(password);
      if (storedHash != computedHash) {
        throw StateError('Invalid email/phone or password');
      }

      final role = parseAppRole((result['role'] as String?) ?? '');
      final user = AppUser(
        id: (result['id'] as String?) ?? '',
        email: (result['email'] as String?) ?? '',
        firstName: (result['first_name'] as String?) ?? '',
        lastName: (result['last_name'] as String?) ?? '',
        phoneNumber: result['phone_number'] as String?,
        role: role,
        isActive: isActive,
      );

      _user = user;
      await _storage.writeUser(user);
    } on PostgrestException catch (_) {
      throw StateError('Invalid email/phone or password');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
