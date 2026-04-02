import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:oro_app/core/api/api_services.dart';
import 'package:oro_app/features/auth/auth_provider.dart';
import 'package:go_router/go_router.dart';

// ─── Feed providers for each section ──────────────────
final _hotProvider = FutureProvider.autoDispose<List>((ref) async {
  final api = ref.read(feedApiProvider);
  final data = await api.list(feed: 'hot', limit: 10);
  return (data['items'] as List?) ?? [];
});

final _recommendedProvider = FutureProvider.autoDispose<List>((ref) async {
  final api = ref.read(feedApiProvider);
  final data = await api.list(feed: 'recommended', limit: 10);
  return (data['items'] as List?) ?? [];
});

final _freeProvider = FutureProvider.autoDispose<List>((ref) async {
  final api = ref.read(feedApiProvider);
  final data = await api.list(feed: 'free', limit: 10);
  return (data['items'] as List?) ?? [];
});

final _bestSellingProvider = FutureProvider.autoDispose<List>((ref) async {
  final api = ref.read(feedApiProvider);
  final data = await api.list(feed: 'best_selling', limit: 10);
  return (data['items'] as List?) ?? [];
});

final _latestProvider = FutureProvider.autoDispose<List>((ref) async {
  final api = ref.read(feedApiProvider);
  final data = await api.list(feed: 'latest', limit: 10);
  return (data['items'] as List?) ?? [];
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Oro'),
        centerTitle: true,
        actions: [
          if (!auth.isAuthenticated)
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Login'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_hotProvider);
          ref.invalidate(_recommendedProvider);
          ref.invalidate(_freeProvider);
          ref.invalidate(_bestSellingProvider);
          ref.invalidate(_latestProvider);
        },
        child: ListView(
          children: [
            _FeedSection(title: '⭐ Recommended', provider: _recommendedProvider, color: Colors.purple.shade50),
            _FeedSection(title: '🔥 Hot', provider: _hotProvider, color: Colors.orange.shade50),
            _FeedSection(title: '🆓 Free', provider: _freeProvider, color: Colors.green.shade50),
            _FeedSection(title: '💰 Best Selling', provider: _bestSellingProvider, color: Colors.amber.shade50),
            _FeedSection(title: '🆕 Latest', provider: _latestProvider, color: Colors.blue.shade50),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─── Horizontal feed section ──────────────────────────
class _FeedSection extends ConsumerWidget {
  final String title;
  final AutoDisposeFutureProvider<List> provider;
  final Color color;

  const _FeedSection({required this.title, required this.provider, required this.color});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(provider);

    return async.when(
      loading: () => _SectionShimmer(title: title, color: color),
      error: (_, __) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Container(
          color: color,
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 160,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final media = items[index] as Map<String, dynamic>;
                    return _HomeMediaCard(media: media);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionShimmer extends StatelessWidget {
  final String title;
  final Color color;
  const _SectionShimmer({required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: color,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 160,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: 4,
              itemBuilder: (_, __) => Container(
                width: 120,
                height: 120,
                margin: const EdgeInsets.only(right: 14),
                decoration: BoxDecoration(color: Colors.grey[200], shape: BoxShape.circle),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeMediaCard extends StatelessWidget {
  final Map<String, dynamic> media;
  const _HomeMediaCard({required this.media});

  @override
  Widget build(BuildContext context) {
    final price = (media['price'] is num) ? (media['price'] as num).toDouble() : 0.0;
    final isFeatured = media['isFeatured'] == true;
    final viewCount = media['viewCount'] ?? 0;
    final title = media['title'] ?? media['originalFilename'] ?? 'Untitled';
    final user = media['user'] as Map<String, dynamic>?;
    final imageUrl = media['originalUrl'] as String?;

    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 10),
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.grey[200]),
                          errorWidget: (_, __, ___) => Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.broken_image, color: Colors.grey),
                          ),
                        )
                      : Container(color: Colors.grey[200], child: const Icon(Icons.image)),
                  Positioned(
                    top: 4, right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: price > 0 ? Colors.amber : Colors.green,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        price > 0 ? '\$${price.toStringAsFixed(2)}' : 'FREE',
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                  if (isFeatured)
                    Positioned(
                      top: 4, left: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(color: Colors.purple, borderRadius: BorderRadius.circular(10)),
                        child: const Text('⭐', style: TextStyle(fontSize: 9)),
                      ),
                    ),
                  if (media['type'] == 'video')
                    const Center(child: Icon(Icons.play_circle_fill, color: Colors.white70, size: 32)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 1),
                  Row(
                    children: [
                      Icon(Icons.visibility, size: 10, color: Colors.grey[500]),
                      const SizedBox(width: 2),
                      Text('$viewCount', style: TextStyle(fontSize: 9, color: Colors.grey[500])),
                      if (user?['name'] != null) ...[
                        const Spacer(),
                        Flexible(
                          child: Text(user!['name'], style: TextStyle(fontSize: 9, color: Colors.grey[500]),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
