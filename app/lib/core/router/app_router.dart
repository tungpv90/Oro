import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oro_app/features/auth/auth_provider.dart';
import 'package:oro_app/features/auth/login_screen.dart';
import 'package:oro_app/features/auth/register_screen.dart';
import 'package:oro_app/features/media/home_screen.dart';
import 'package:oro_app/features/media/feed_screen.dart';
import 'package:oro_app/features/media/my_media_screen.dart';
import 'package:oro_app/features/media/media_detail_screen.dart';
import 'package:oro_app/features/device/devices_screen.dart';
import 'package:oro_app/features/profile/profile_screen.dart';
import 'package:oro_app/features/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      if (auth.isLoading) return null;

      final isAuth = auth.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      // Public routes - no auth required
      final publicRoutes = ['/home', '/explore'];
      final isPublicRoute = publicRoutes.contains(state.matchedLocation);

      // Auth routes redirect to home if already authenticated
      if (isAuth && isAuthRoute) return '/home';

      // Protected routes require authentication
      if (!isAuth && !isAuthRoute && !isPublicRoute) return '/login';

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/explore', builder: (_, __) => const FeedScreen()),
          GoRoute(path: '/my-media', builder: (_, __) => const MyMediaScreen()),
          GoRoute(path: '/devices', builder: (_, __) => const DevicesScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/media/:id',
        builder: (_, state) => MediaDetailScreen(mediaId: state.pathParameters['id']!),
      ),
    ],
  );
});
