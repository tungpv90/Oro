import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:oro_app/core/api/api_services.dart';

final feedTypeProvider = StateProvider<String>((ref) => 'latest');
final feedMediaTypeProvider = StateProvider<String?>((ref) => null);

final feedProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ref.read(feedApiProvider);
  final feedType = ref.watch(feedTypeProvider);
  final mediaType = ref.watch(feedMediaTypeProvider);
  return api.list(feed: feedType, type: mediaType, limit: 40);
});

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider);
    final activeFeed = ref.watch(feedTypeProvider);
    final activeType = ref.watch(feedMediaTypeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Feed type tabs
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _FeedChip(label: 'Latest', value: 'latest', active: activeFeed, onTap: (v) => ref.read(feedTypeProvider.notifier).state = v),
                _FeedChip(label: '🔥 Hot', value: 'hot', active: activeFeed, onTap: (v) => ref.read(feedTypeProvider.notifier).state = v),
                _FeedChip(label: '⭐ Featured', value: 'recommended', active: activeFeed, onTap: (v) => ref.read(feedTypeProvider.notifier).state = v),
                _FeedChip(label: '🆓 Free', value: 'free', active: activeFeed, onTap: (v) => ref.read(feedTypeProvider.notifier).state = v),
                _FeedChip(label: '💰 Best Selling', value: 'best_selling', active: activeFeed, onTap: (v) => ref.read(feedTypeProvider.notifier).state = v),
              ],
            ),
          ),
          // Media type filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                _TypeChip(label: 'All', value: null, active: activeType, onTap: (v) => ref.read(feedMediaTypeProvider.notifier).state = v),
                const SizedBox(width: 8),
                _TypeChip(label: 'Images', value: 'image', active: activeType, onTap: (v) => ref.read(feedMediaTypeProvider.notifier).state = v),
                const SizedBox(width: 8),
                _TypeChip(label: 'Videos', value: 'video', active: activeType, onTap: (v) => ref.read(feedMediaTypeProvider.notifier).state = v),
              ],
            ),
          ),
          const Divider(height: 1),
          // Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(feedProvider),
              child: feedAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (data) {
                  final items = (data['items'] as List?) ?? [];
                  if (items.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.explore_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No public media found', style: TextStyle(color: Colors.grey, fontSize: 16)),
                        ],
                      ),
                    );
                  }

                  return GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.75,
                    ),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final media = items[index] as Map<String, dynamic>;
                      return _FeedCard(media: media);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedChip extends StatelessWidget {
  final String label;
  final String value;
  final String active;
  final ValueChanged<String> onTap;

  const _FeedChip({required this.label, required this.value, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActive = active == value;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        label: Text(label),
        selected: isActive,
        onSelected: (_) => onTap(value),
        selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final String? value;
  final String? active;
  final ValueChanged<String?> onTap;

  const _TypeChip({required this.label, required this.value, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActive = active == value;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 12, color: isActive ? Colors.white : Colors.grey[700])),
      selected: isActive,
      onSelected: (_) => onTap(value),
      selectedColor: Colors.black87,
      backgroundColor: Colors.grey[200],
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}

class _FeedCard extends StatelessWidget {
  final Map<String, dynamic> media;

  const _FeedCard({required this.media});

  @override
  Widget build(BuildContext context) {
    final price = (media['price'] is num) ? (media['price'] as num).toDouble() : 0.0;
    final isFeatured = media['isFeatured'] == true;
    final viewCount = media['viewCount'] ?? 0;
    final purchaseCount = media['purchaseCount'] ?? 0;
    final title = media['title'] ?? media['originalFilename'] ?? 'Untitled';
    final user = media['user'] as Map<String, dynamic>?;
    final imageUrl = media['originalUrl'] as String?;

    return Column(
      children: [
        // Circular thumbnail
        Expanded(
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: price > 0 ? Colors.amber : Colors.green, width: 2.5),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                ),
                child: ClipOval(
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: imageUrl != null
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
                  ),
                ),
              ),
              // Price badge
              Positioned(
                bottom: 0, right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: price > 0 ? Colors.amber : Colors.green,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    price > 0 ? '\$${price.toStringAsFixed(2)}' : 'FREE',
                    style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              if (isFeatured)
                Positioned(
                  top: 0, left: 0,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Colors.purple, shape: BoxShape.circle),
                    child: const Text('⭐', style: TextStyle(fontSize: 8)),
                  ),
                ),
              if (media['type'] == 'video')
                Icon(Icons.play_circle_fill, color: Colors.white70, size: 28),
            ],
          ),
        ),
        const SizedBox(height: 4),
        // Title
        Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
        // Stats
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.visibility, size: 10, color: Colors.grey[500]),
            const SizedBox(width: 2),
            Text('$viewCount', style: TextStyle(fontSize: 9, color: Colors.grey[500])),
            if (purchaseCount > 0) ...[
              const SizedBox(width: 6),
              Icon(Icons.shopping_cart, size: 10, color: Colors.grey[500]),
              const SizedBox(width: 2),
              Text('$purchaseCount', style: TextStyle(fontSize: 9, color: Colors.grey[500])),
            ],
          ],
        ),
        if (user?['name'] != null)
          Text(
            user!['name'],
            style: TextStyle(fontSize: 9, color: Colors.grey[500]),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
      ],
    );
  }
}
