import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oro_app/features/auth/auth_provider.dart';
import 'package:oro_app/features/auth/login_screen.dart';
import 'package:oro_app/features/auth/register_screen.dart';
import 'package:oro_app/features/media/home_screen.dart';
import 'package:oro_app/features/media/media_detail_screen.dart';
import 'package:oro_app/features/device/devices_screen.dart';
import 'package:oro_app/features/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      if (auth.isLoading) return null;

      final isAuth = auth.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(
        path: '/media/:id',
        builder: (_, state) => MediaDetailScreen(mediaId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/devices', builder: (_, __) => const DevicesScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );
});
