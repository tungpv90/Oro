import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:oro_app/core/api/api_services.dart';

final mediaListProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ref.read(mediaApiProvider);
  return api.list();
});

class MyMediaScreen extends ConsumerWidget {
  const MyMediaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaAsync = ref.watch(mediaListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Media'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _pickAndUpload(context, ref),
        icon: const Icon(Icons.upload),
        label: const Text('Upload'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(mediaListProvider),
        child: mediaAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (data) {
            final items = (data['items'] as List?) ?? [];
            if (items.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('No media yet', style: TextStyle(color: Colors.grey, fontSize: 16)),
                    SizedBox(height: 8),
                    Text('Tap + to upload images or videos', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              );
            }

            return GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1,
              ),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final media = items[index] as Map<String, dynamic>;
                return _MediaCard(
                  media: media,
                  onTap: () => context.push('/media/${media['id']}'),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _pickAndUpload(BuildContext context, WidgetRef ref) async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text('Pick Image'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.videocam),
              title: const Text('Pick Video'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final file = await picker.pickImage(source: source) ?? await picker.pickVideo(source: source);
    if (file == null) return;

    try {
      final api = ref.read(mediaApiProvider);
      await api.upload(file.path, file.name);
      ref.invalidate(mediaListProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Upload successful!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e')),
        );
      }
    }
  }
}

class _MediaCard extends StatelessWidget {
  final Map<String, dynamic> media;
  final VoidCallback onTap;

  const _MediaCard({required this.media, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isVideo = media['type'] == 'video';
    final title = media['title'] ?? media['originalFilename'] ?? 'Untitled';

    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Expanded(
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.4), width: 2),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                  ),
                  child: ClipOval(
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: media['originalUrl'] != null
                          ? Image.network(
                              media['originalUrl'],
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image)),
                            )
                          : Container(color: Colors.grey[200], child: const Icon(Icons.image, size: 32, color: Colors.grey)),
                    ),
                  ),
                ),
                if (isVideo)
                  const Icon(Icons.play_circle_fill, size: 36, color: Colors.white70),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
