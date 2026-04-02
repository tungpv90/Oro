import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oro_app/core/api/dio_client.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.read(dioProvider));
});

class AuthApi {
  final Dio _dio;
  AuthApi(this._dio);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register(String email, String password, {String? name}) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      if (name != null) 'name': name,
    });
    return response.data;
  }
}

final mediaApiProvider = Provider<MediaApi>((ref) {
  return MediaApi(ref.read(dioProvider));
});

class MediaApi {
  final Dio _dio;
  MediaApi(this._dio);

  Future<Map<String, dynamic>> list({int page = 1, int limit = 20}) async {
    final response = await _dio.get('/media', queryParameters: {'page': page, 'limit': limit});
    return response.data;
  }

  Future<Map<String, dynamic>> get(String id) async {
    final response = await _dio.get('/media/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> upload(String filePath, String fileName) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    final response = await _dio.post('/media/upload', data: formData);
    return response.data;
  }

  Future<void> delete(String id) async {
    await _dio.delete('/media/$id');
  }

  Future<Map<String, dynamic>> processAnimation(String id, {int fps = 10}) async {
    final response = await _dio.post('/media/$id/process-animation', data: {'fps': fps});
    return response.data;
  }

  Future<Map<String, dynamic>> getJobStatus(String jobId) async {
    final response = await _dio.get('/media/animation-jobs/$jobId');
    return response.data;
  }

  Future<List<int>> downloadFrames(String jobId) async {
    final response = await _dio.get<List<int>>(
      '/media/animation-jobs/$jobId/download',
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data!;
  }
}

final devicesApiProvider = Provider<DevicesApi>((ref) {
  return DevicesApi(ref.read(dioProvider));
});

class DevicesApi {
  final Dio _dio;
  DevicesApi(this._dio);

  Future<List<dynamic>> list() async {
    final response = await _dio.get('/devices');
    return response.data;
  }

  Future<Map<String, dynamic>> create(String name, String macAddress) async {
    final response = await _dio.post('/devices', data: {
      'name': name,
      'macAddress': macAddress,
    });
    return response.data;
  }

  Future<void> delete(String id) async {
    await _dio.delete('/devices/$id');
  }
}
