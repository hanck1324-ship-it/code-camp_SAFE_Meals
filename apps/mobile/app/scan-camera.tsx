/**
 * 메뉴 스캔용 네이티브 카메라 화면
 * 
 * Expo Camera를 사용하여 메뉴를 촬영하고 분석합니다.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 카메라 전환
  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // 플래시 토글
  const toggleFlash = useCallback(() => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // 사진 촬영
  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 사진 촬영
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Base64 데이터 준비
        let base64Data = '';
        if (photo.base64) {
          base64Data = `data:image/jpeg;base64,${photo.base64}`;
        } else {
          // base64가 없으면 경고 (일반적으로 base64는 항상 제공됨)
          console.warn('Base64 데이터가 없습니다. takePictureAsync에 base64: true 옵션이 필요합니다.');
          Alert.alert('오류', '이미지 데이터를 가져올 수 없습니다.');
          return;
        }

        setCapturedImage(base64Data);
      }
    } catch (error: any) {
      console.error('사진 촬영 오류:', error);
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // 다시 촬영
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // 이미지 사용 (웹뷰로 전달)
  const handleUsePhoto = useCallback(async () => {
    if (!capturedImage) return;

    try {
      setIsProcessing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 이미지 데이터를 AsyncStorage에 저장 (웹뷰에서 읽을 수 있도록)
      const timestamp = Date.now();
      const imageKey = `camera_image_${timestamp}`;
      await AsyncStorage.setItem(imageKey, capturedImage);
      await AsyncStorage.setItem('last_camera_image_key', imageKey);
      await AsyncStorage.setItem('last_camera_image_timestamp', timestamp.toString());

      // 웹뷰의 스캔 페이지로 이동
      router.push({
        pathname: '/webview/[...path]' as any,
        params: {
          path: ['scan'],
          imageCaptured: 'true',
          imageKey,
          timestamp: timestamp.toString(),
        },
      });
    } catch (error: any) {
      console.error('이미지 처리 오류:', error);
      Alert.alert('오류', '이미지 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage]);

  // 권한 확인 중
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 권한 거부됨
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>카메라 권한 필요</Text>
          <Text style={styles.permissionText}>
            메뉴를 촬영하려면 카메라 권한이 필요합니다.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>권한 허용하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 촬영된 이미지 미리보기
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          {/* 헤더 */}
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.closeButtonDark}
              onPress={handleRetake}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 하단 컨트롤 */}
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              disabled={isProcessing}
            >
              <Ionicons name="refresh" size={24} color="#1f2937" />
              <Text style={styles.retakeButtonText}>다시 촬영</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.useButton, isProcessing && styles.disabledButton]}
              onPress={handleUsePhoto}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#ffffff" />
                  <Text style={styles.useButtonText}>사용하기</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 카메라 뷰
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* 헤더 */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>메뉴를 촬영하세요</Text>
            <Text style={styles.headerSubtitle}>
              메뉴판을 프레임 안에 맞춰주세요
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButtonDark}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 스캔 프레임 */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          {/* 코너 장식 */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* 하단 컨트롤 */}
      <SafeAreaView style={styles.controls}>
        <View style={styles.controlsContent}>
          {/* 플래시 버튼 */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              flash !== 'off' && styles.controlButtonActive,
            ]}
            onPress={toggleFlash}
            disabled={isProcessing}
          >
            <Ionicons
              name={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off'}
              size={24}
              color={flash !== 'off' ? '#fbbf24' : '#ffffff'}
            />
          </TouchableOpacity>

          {/* 촬영 버튼 */}
          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.disabledButton]}
            onPress={takePicture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* 카메라 전환 버튼 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
            disabled={isProcessing}
          >
            <Ionicons name="camera-reverse" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  permissionTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#2ECC71',
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  closeButtonDark: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  scanFrame: {
    width: '100%',
    height: 384,
    borderWidth: 4,
    borderColor: '#2ECC71',
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#ffffff',
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    borderRadius: 40,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    opacity: 0.2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 16,
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  useButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#2ECC71',
    borderRadius: 12,
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

