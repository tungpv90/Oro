import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oro_app/core/ble/ble_service.dart';

class DevicesScreen extends ConsumerStatefulWidget {
  const DevicesScreen({super.key});

  @override
  ConsumerState<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends ConsumerState<DevicesScreen> {
  bool _scanning = false;
  List<ScanResult> _results = [];

  @override
  void initState() {
    super.initState();
    ref.read(bleServiceProvider.notifier).scanResults.listen((results) {
      if (mounted) setState(() => _results = results);
    });
  }

  Future<void> _startScan() async {
    setState(() {
      _scanning = true;
      _results = [];
    });
    await ref.read(bleServiceProvider.notifier).startScan();
    setState(() => _scanning = false);
  }

  @override
  Widget build(BuildContext context) {
    final bleState = ref.watch(bleServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Devices'),
        actions: [
          if (bleState.status != BleDeviceStatus.disconnected)
            TextButton(
              onPressed: () => ref.read(bleServiceProvider.notifier).disconnect(),
              child: const Text('Disconnect'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Connection status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _statusColor(bleState.status).withOpacity(0.1),
            child: Row(
              children: [
                Icon(Icons.bluetooth, color: _statusColor(bleState.status)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _statusText(bleState),
                        style: TextStyle(fontWeight: FontWeight.w600, color: _statusColor(bleState.status)),
                      ),
                      if (bleState.device != null)
                        Text(bleState.device!.platformName, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (bleState.error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(bleState.error!, style: TextStyle(color: Colors.red.shade700)),
            ),

          // Scan button
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton.icon(
              onPressed: _scanning ? null : _startScan,
              icon: _scanning
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.search),
              label: Text(_scanning ? 'Scanning...' : 'Scan for Devices'),
            ),
          ),

          // Results
          Expanded(
            child: _results.isEmpty
                ? const Center(child: Text('No devices found. Tap Scan to search.', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final result = _results[index];
                      final name = result.device.platformName.isNotEmpty
                          ? result.device.platformName
                          : 'Unknown Device';
                      return ListTile(
                        leading: const Icon(Icons.bluetooth),
                        title: Text(name),
                        subtitle: Text(result.device.remoteId.str),
                        trailing: Text('${result.rssi} dBm', style: const TextStyle(fontSize: 12)),
                        onTap: () => ref.read(bleServiceProvider.notifier).connect(result.device),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(BleDeviceStatus status) {
    switch (status) {
      case BleDeviceStatus.connected:
      case BleDeviceStatus.playing:
        return Colors.green;
      case BleDeviceStatus.connecting:
      case BleDeviceStatus.transferring:
        return Colors.orange;
      case BleDeviceStatus.disconnected:
        return Colors.grey;
    }
  }

  String _statusText(BleDeviceState state) {
    switch (state.status) {
      case BleDeviceStatus.disconnected:
        return 'Disconnected';
      case BleDeviceStatus.connecting:
        return 'Connecting...';
      case BleDeviceStatus.connected:
        return 'Connected';
      case BleDeviceStatus.transferring:
        return 'Transferring ${(state.transferProgress * 100).toStringAsFixed(0)}%';
      case BleDeviceStatus.playing:
        return 'Playing animation';
    }
  }
}
