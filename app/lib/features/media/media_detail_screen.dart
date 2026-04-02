import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:oro_app/core/api/api_services.dart';
import 'package:oro_app/core/ble/ble_service.dart';

class MediaDetailScreen extends ConsumerStatefulWidget {
  final String mediaId;
  const MediaDetailScreen({super.key, required this.mediaId});

  @override
  ConsumerState<MediaDetailScreen> createState() => _MediaDetailScreenState();
}

class _MediaDetailScreenState extends ConsumerState<MediaDetailScreen> {
  Map<String, dynamic>? _media;
  Map<String, dynamic>? _job;
  bool _loading = true;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _loadMedia();
  }

  Future<void> _loadMedia() async {
    try {
      final api = ref.read(mediaApiProvider);
      final data = await api.get(widget.mediaId);
      setState(() {
        _media = data;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _processAnimation() async {
    setState(() => _processing = true);
    try {
      final api = ref.read(mediaApiProvider);
      final job = await api.processAnimation(widget.mediaId);
      setState(() {
        _job = job;
        _processing = false;
      });
      _pollJobStatus(job['id']);
    } catch (e) {
      setState(() => _processing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Processing failed: $e')),
        );
      }
    }
  }

  Future<void> _pollJobStatus(String jobId) async {
    final api = ref.read(mediaApiProvider);
    while (mounted) {
      await Future.delayed(const Duration(seconds: 2));
      try {
        final status = await api.getJobStatus(jobId);
        setState(() => _job = status);
        if (status['status'] == 'ready' || status['status'] == 'failed') break;
      } catch (_) {
        break;
      }
    }
  }

  Future<void> _sendToDevice() async {
    if (_job == null || _job!['status'] != 'ready') return;

    try {
      final api = ref.read(mediaApiProvider);
      final bytes = await api.downloadFrames(_job!['id']);
      final data = Uint8List.fromList(bytes);

      await ref.read(bleServiceProvider.notifier).sendAnimationData(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Transfer complete! Tap Play to start.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transfer failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bleState = ref.watch(bleServiceProvider);

    return Scaffold(
      appBar: AppBar(title: Text(_media?['originalFilename'] ?? 'Media Detail')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _media == null
              ? const Center(child: Text('Media not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Preview
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: AspectRatio(
                          aspectRatio: 4 / 3,
                          child: _media!['originalUrl'] != null
                              ? Image.network(_media!['originalUrl'], fit: BoxFit.cover)
                              : Container(color: Colors.grey.shade200, child: const Icon(Icons.image, size: 64)),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Info
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Type: ${_media!['type']}'),
                              Text('Size: ${(_media!['fileSize'] / 1024).toStringAsFixed(1)} KB'),
                              Text('Status: ${_media!['status']}'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Process button
                      ElevatedButton.icon(
                        onPressed: _processing ? null : _processAnimation,
                        icon: _processing
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.auto_fix_high),
                        label: Text(_processing ? 'Processing...' : 'Process for Device'),
                      ),

                      // Job status
                      if (_job != null) ...[
                        const SizedBox(height: 16),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Animation Job', style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 8),
                                Text('Status: ${_job!['status']}'),
                                if (_job!['frameCount'] != null)
                                  Text('Frames: ${_job!['frameCount']}'),
                                if (_job!['totalSize'] != null)
                                  Text('Size: ${(_job!['totalSize'] / 1024).toStringAsFixed(1)} KB'),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 16),

                      // Send to device
                      if (_job?['status'] == 'ready') ...[
                        ElevatedButton.icon(
                          onPressed: bleState.status == BleDeviceStatus.connected ? _sendToDevice : null,
                          icon: const Icon(Icons.bluetooth),
                          label: Text(
                            bleState.status == BleDeviceStatus.connected
                                ? 'Send to Device'
                                : 'Connect a device first',
                          ),
                        ),
                      ],

                      // Transfer progress
                      if (bleState.status == BleDeviceStatus.transferring) ...[
                        const SizedBox(height: 16),
                        LinearPercentIndicator(
                          lineHeight: 20,
                          percent: bleState.transferProgress,
                          center: Text('${(bleState.transferProgress * 100).toStringAsFixed(0)}%'),
                          progressColor: Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ],

                      // Play controls
                      if (bleState.status == BleDeviceStatus.connected && bleState.transferProgress >= 1.0) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => ref.read(bleServiceProvider.notifier).playAnimation(),
                                icon: const Icon(Icons.play_arrow),
                                label: const Text('Play'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => ref.read(bleServiceProvider.notifier).stopAnimation(),
                                icon: const Icon(Icons.stop),
                                label: const Text('Stop'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}
