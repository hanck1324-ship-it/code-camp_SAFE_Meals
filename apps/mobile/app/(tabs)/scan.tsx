import { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

/**
 * 이미지 압축 및 리사이즈 함수
 * Android AsyncStorage의 CursorWindow 제한(~2MB)을 피하기 위해
 * 이미지를 최대 1200px로 리사이즈하고 품질을 낮춤
 */
async function compressImage(uri: string): Promise<string> {
  try {
    // 이미지 리사이즈 (최대 1200px, 품질 0.6)
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Base64로 변환
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 임시 파일 삭제
    await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    throw error;
  }
}

export default function ScanTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 사진 촬영
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      Alert.alert('오류', '사진 촬영에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // 갤러리에서 이미지 선택
  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCapturedImage(result.assets[0].uri);
    }
  }, []);

  // 다시 촬영
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // 분석 제출
  const handleSubmit = useCallback(async () => {
    if (!capturedImage) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 이미지 압축 및 Base64 변환 (CursorWindow 제한 회피)
      const compressedBase64 = await compressImage(capturedImage);

      console.log(
        '📸 압축된 이미지 크기:',
        Math.round(compressedBase64.length / 1024),
        'KB'
      );

      // Base64 데이터를 AsyncStorage에 임시 저장
      await AsyncStorage.setItem('pending_analyze_image', compressedBase64);

      // 웹뷰로 이동 (이미지 없이, 플래그만 전달)
      router.push('/webview/scan/analyze?hasImage=true');
    } catch (error) {
      console.error('이미지 변환 실패:', error);
      Alert.alert('오류', '이미지 처리에 실패했습니다. 다시 시도해주세요.');
    }
  }, [capturedImage]);

  // 권한 확인 중
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  // 권한 거부됨
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#9ca3af" />
        <Text style={styles.permissionTitle}>카메라 권한 필요</Text>
        <Text style={styles.permissionText}>
          메뉴판을 촬영하려면 카메라 권한이 필요합니다.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>권한 허용하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.secondaryButtonText}>설정에서 변경하기</Text>
        </TouchableOpacity>

        {/* 권한 없어도 갤러리에서 선택 가능 */}
        <TouchableOpacity
          style={[styles.button, { marginTop: 24, backgroundColor: '#6b7280' }]}
          onPress={handlePickImage}
        >
          <Ionicons
            name="images-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>갤러리에서 선택</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 촬영된 이미지가 있으면 미리보기 표시
  if (capturedImage) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />

        <View style={styles.previewOverlay}>
          <Text style={styles.previewTitle}>메뉴판 미리보기</Text>
          <Text style={styles.previewSubtitle}>
            이 이미지로 분석을 진행할까요?
          </Text>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
            <Text style={styles.retakeButtonText}>다시 촬영</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="search-outline" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>분석하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* 스캔 가이드 오버레이 */}
      <View style={styles.overlay}>
        {/* 상단 안내 */}
        <View style={styles.headerGuide}>
          <Text style={styles.guideTitle}>메뉴판 촬영</Text>
          <Text style={styles.guideSubtitle}>
            메뉴판을 화면에 맞춰 촬영해주세요
          </Text>
        </View>

        {/* 촬영 프레임 */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.bottomControls}>
          {/* 갤러리 버튼 */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickImage}
          >
            <Ionicons name="images-outline" size={28} color="#fff" />
          </TouchableOpacity>

          {/* 촬영 버튼 */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* 빈 공간 (좌우 대칭용) */}
          <View style={styles.placeholderButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerGuide: {
    alignItems: 'center',
  },
  guideTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  guideSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrame: {
    width: 300,
    height: 400,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  placeholderButton: {
    width: 56,
    height: 56,
  },
  // 미리보기 화면 스타일
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
