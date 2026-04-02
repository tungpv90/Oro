import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Custom BLE UUIDs
class BleUuids {
  static final service = Guid('0000ff00-0000-1000-8000-00805f9b34fb');
  static final commandChar = Guid('0000ff01-0000-1000-8000-00805f9b34fb');
  static final dataChar = Guid('0000ff02-0000-1000-8000-00805f9b34fb');
  static final statusChar = Guid('0000ff03-0000-1000-8000-00805f9b34fb');
}

// Commands
class BleCommands {
  static const cmdStartTransfer = 0x01;
  static const cmdEndTransfer = 0x02;
  static const cmdPlay = 0x03;
  static const cmdStop = 0x04;
  static const cmdGetStatus = 0x05;
}

// Device status
enum BleDeviceStatus { disconnected, connecting, connected, transferring, playing }

class BleDeviceState {
  final BleDeviceStatus status;
  final BluetoothDevice? device;
  final double transferProgress;
  final String? error;

  const BleDeviceState({
    this.status = BleDeviceStatus.disconnected,
    this.device,
    this.transferProgress = 0,
    this.error,
  });

  BleDeviceState copyWith({
    BleDeviceStatus? status,
    BluetoothDevice? device,
    double? transferProgress,
    String? error,
  }) {
    return BleDeviceState(
      status: status ?? this.status,
      device: device ?? this.device,
      transferProgress: transferProgress ?? this.transferProgress,
      error: error,
    );
  }
}

final bleServiceProvider = StateNotifierProvider<BleService, BleDeviceState>((ref) {
  return BleService();
});

class BleService extends StateNotifier<BleDeviceState> {
  BluetoothCharacteristic? _commandChar;
  BluetoothCharacteristic? _dataChar;
  BluetoothCharacteristic? _statusChar;
  StreamSubscription? _statusSubscription;

  BleService() : super(const BleDeviceState());

  // ─── Scanning ───────────────────────────────────────
  Stream<List<ScanResult>> get scanResults => FlutterBluePlus.scanResults;

  Future<void> startScan({Duration timeout = const Duration(seconds: 10)}) async {
    await FlutterBluePlus.startScan(
      withServices: [BleUuids.service],
      timeout: timeout,
    );
  }

  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
  }

  // ─── Connection ─────────────────────────────────────
  Future<void> connect(BluetoothDevice device) async {
    state = state.copyWith(status: BleDeviceStatus.connecting, device: device);

    try {
      await device.connect(timeout: const Duration(seconds: 15));

      // Request higher MTU for faster transfers
      await device.requestMtu(512);

      // Discover services
      final services = await device.discoverServices();
      final oroService = services.firstWhere(
        (s) => s.uuid == BleUuids.service,
        orElse: () => throw Exception('Oro service not found'),
      );

      _commandChar = oroService.characteristics.firstWhere(
        (c) => c.uuid == BleUuids.commandChar,
      );
      _dataChar = oroService.characteristics.firstWhere(
        (c) => c.uuid == BleUuids.dataChar,
      );
      _statusChar = oroService.characteristics.firstWhere(
        (c) => c.uuid == BleUuids.statusChar,
      );

      // Subscribe to status notifications
      await _statusChar!.setNotifyValue(true);
      _statusSubscription = _statusChar!.onValueReceived.listen(_onStatusReceived);

      state = state.copyWith(status: BleDeviceStatus.connected);
    } catch (e) {
      state = state.copyWith(
        status: BleDeviceStatus.disconnected,
        error: 'Connection failed: $e',
      );
    }
  }

  Future<void> disconnect() async {
    _statusSubscription?.cancel();
    await state.device?.disconnect();
    state = const BleDeviceState();
  }

  // ─── Transfer ───────────────────────────────────────
  Future<void> sendAnimationData(Uint8List data) async {
    if (_commandChar == null || _dataChar == null) {
      state = state.copyWith(error: 'Not connected to device');
      return;
    }

    state = state.copyWith(status: BleDeviceStatus.transferring, transferProgress: 0);

    try {
      // Parse header to get frame info
      final frameCount = data.buffer.asByteData().getUint16(0, Endian.little);
      final fps = data[2];
      final totalSize = data.length;

      // Send start command
      await _commandChar!.write([
        BleCommands.cmdStartTransfer,
        frameCount & 0xFF, (frameCount >> 8) & 0xFF,
        fps,
        totalSize & 0xFF, (totalSize >> 8) & 0xFF,
        (totalSize >> 16) & 0xFF, (totalSize >> 24) & 0xFF,
      ]);

      // Wait briefly for device to prepare
      await Future.delayed(const Duration(milliseconds: 200));

      // Send data in chunks (MTU - 3 bytes for ATT overhead)
      final mtu = await state.device!.mtu.first;
      final chunkSize = mtu - 3;
      var offset = 0;
      var packetNum = 0;

      while (offset < data.length) {
        final end = (offset + chunkSize).clamp(0, data.length);
        final chunk = data.sublist(offset, end);

        await _dataChar!.write(chunk, withoutResponse: true);

        offset = end;
        packetNum++;

        // Update progress
        state = state.copyWith(transferProgress: offset / data.length);

        // Flow control: pause every 20 packets to let device process
        if (packetNum % 20 == 0) {
          await Future.delayed(const Duration(milliseconds: 50));
        }
      }

      // Send end command
      await _commandChar!.write([BleCommands.cmdEndTransfer]);

      state = state.copyWith(
        status: BleDeviceStatus.connected,
        transferProgress: 1.0,
      );
    } catch (e) {
      state = state.copyWith(
        status: BleDeviceStatus.connected,
        error: 'Transfer failed: $e',
        transferProgress: 0,
      );
    }
  }

  Future<void> playAnimation() async {
    await _commandChar?.write([BleCommands.cmdPlay]);
    state = state.copyWith(status: BleDeviceStatus.playing);
  }

  Future<void> stopAnimation() async {
    await _commandChar?.write([BleCommands.cmdStop]);
    state = state.copyWith(status: BleDeviceStatus.connected);
  }

  void _onStatusReceived(List<int> value) {
    // Handle status notifications from device
    if (value.isEmpty) return;
    // Device protocol: first byte = status code
    // Can be extended based on firmware protocol
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    super.dispose();
  }
}
