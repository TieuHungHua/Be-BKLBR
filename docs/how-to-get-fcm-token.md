# Hướng Dẫn Lấy FCM Token

## Cách 1: Từ React Native App (Khuyến nghị)

### Bước 1: Cài đặt Firebase Messaging

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Bước 2: Setup Firebase trong React Native

Tạo file `firebase.js` hoặc `firebaseConfig.js`:

```javascript
import messaging from '@react-native-firebase/messaging';

// Request permission (iOS)
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
  return enabled;
}

// Get FCM Token
export async function getFCMToken() {
  try {
    // Request permission trước (iOS)
    await requestUserPermission();
    
    // Lấy token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for token refresh
messaging().onTokenRefresh(token => {
  console.log('FCM Token refreshed:', token);
  // Gửi token mới lên backend
  updateFCMTokenToBackend(token);
});
```

### Bước 3: Gửi Token Lên Backend

```javascript
import axios from 'axios';
import { getFCMToken } from './firebase';

async function updateFCMTokenToBackend(token) {
  try {
    const response = await axios.put(
      'http://your-api-url/notifications/fcm-token',
      {
        fcmToken: token,
        isPushEnabled: true,
      },
      {
        headers: {
          Authorization: `Bearer ${yourJwtToken}`, // JWT token từ login
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('FCM token updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating FCM token:', error.response?.data || error.message);
    throw error;
  }
}

// Sử dụng trong component
useEffect(() => {
  const setupFCM = async () => {
    const token = await getFCMToken();
    if (token && yourJwtToken) {
      await updateFCMTokenToBackend(token);
    }
  };
  
  setupFCM();
}, []);
```

### Bước 4: Xử lý Notification

```javascript
import messaging from '@react-native-firebase/messaging';

// Foreground messages (khi app đang mở)
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
  // Hiển thị notification trong app
  Alert.alert(
    remoteMessage.notification?.title || 'Notification',
    remoteMessage.notification?.body || '',
  );
});

// Background messages (khi app ở background)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
});
```

## Cách 2: Test với FCM Token Giả (Development)

Nếu bạn muốn test mà chưa có React Native app, có thể dùng FCM token test từ Firebase Console:

1. Vào Firebase Console > Cloud Messaging
2. Tạo test notification và copy token từ đó
3. Hoặc dùng token mẫu (sẽ fail nhưng có thể test flow)

## Cách 3: Tạo Test Endpoint (Development Only)

Tôi có thể tạo một endpoint test để bạn có thể test với token giả. Bạn có muốn tôi tạo không?

## Lưu ý Quan Trọng

1. **iOS**: Cần request permission trước khi lấy token
2. **Android**: Cần setup `google-services.json` trong project
3. **Token có thể thay đổi**: Token có thể refresh, nên listen `onTokenRefresh` để cập nhật
4. **Token chỉ hợp lệ khi app được cài đặt trên device thật**: Emulator có thể có token nhưng không nhận được notification thật

## Troubleshooting

### Token là null
- Kiểm tra Firebase config đã đúng chưa
- Kiểm tra permission (iOS)
- Kiểm tra `google-services.json` (Android)

### Token không nhận được notification
- Kiểm tra Firebase Admin SDK đã được setup đúng chưa
- Kiểm tra token có được lưu vào database không
- Kiểm tra `is_push_enabled = true` trong database
