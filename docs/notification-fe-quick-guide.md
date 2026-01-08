# 📱 Hướng Dẫn Nhanh: Push Notification cho Frontend

## 🚀 3 Bước Chính

### Bước 1: Cài Đặt & Setup

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**Lưu ý**: Cần setup Firebase project và thêm `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)

### Bước 2: Lấy FCM Token & Gửi Lên Backend

```typescript
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

// Sau khi user login thành công
async function setupNotifications(jwtToken: string) {
  try {
    // 1. Request permission (iOS)
    await messaging().requestPermission();
    
    // 2. Lấy FCM token
    const fcmToken = await messaging().getToken();
    
    // 3. Gửi lên backend
    await axios.put(
      'http://your-api-url/notifications/fcm-token',
      { 
        fcmToken, 
        isPushEnabled: true 
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    
    console.log('✅ FCM token đã được cập nhật');
  } catch (error) {
    console.error('❌ Lỗi setup notifications:', error);
  }
}
```

### Bước 3: Xử Lý Notification

```typescript
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Khi app đang mở (Foreground)
messaging().onMessage((remoteMessage) => {
  Alert.alert(
    remoteMessage.notification?.title || 'Thông báo',
    remoteMessage.notification?.body || ''
  );
  
  // Navigate đến màn hình chi tiết nếu cần
  if (remoteMessage.data?.borrowId) {
    navigation.navigate('BorrowDetail', {
      borrowId: remoteMessage.data.borrowId
    });
  }
});

// Khi app ở background
messaging().setBackgroundMessageHandler((remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});

// Khi user tap notification (app đang ở background)
messaging().onNotificationOpenedApp((remoteMessage) => {
  if (remoteMessage.data?.borrowId) {
    navigation.navigate('BorrowDetail', {
      borrowId: remoteMessage.data.borrowId
    });
  }
});

// Listen token refresh (quan trọng!)
messaging().onTokenRefresh(async (token) => {
  // Gửi token mới lên backend
  await updateFCMTokenToBackend(token, jwtToken);
});
```

## 📋 Checklist Tích Hợp

- [ ] Cài đặt `@react-native-firebase/messaging`
- [ ] Setup Firebase config files
- [ ] Request permission (iOS)
- [ ] Lấy FCM token sau khi login
- [ ] Gửi token lên `PUT /notifications/fcm-token`
- [ ] Listen token refresh
- [ ] Xử lý foreground notification (`onMessage`)
- [ ] Xử lý background notification (`setBackgroundMessageHandler`)
- [ ] Xử lý khi user tap notification (`onNotificationOpenedApp`)

## 🔗 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `PUT` | `/notifications/fcm-token` | Cập nhật FCM token |
| `POST` | `/notifications/test-send` | Test gửi notification |

## 📦 Notification Data

Khi nhận notification, `remoteMessage.data` có:

```typescript
{
  borrowId: string;      // ID khoản mượn
  bookId: string;       // ID sách
  bookTitle: string;     // Tên sách
  daysUntilDue: string;  // "0", "1", "2", hoặc "3"
}
```

## 🎯 Ví Dụ Hoàn Chỉnh

```typescript
// NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

class NotificationService {
  private apiUrl = 'http://your-api-url';
  
  async setup(jwtToken: string) {
    // Request permission
    await messaging().requestPermission();
    
    // Get token
    const token = await messaging().getToken();
    
    // Send to backend
    await axios.put(
      `${this.apiUrl}/notifications/fcm-token`,
      { fcmToken: token, isPushEnabled: true },
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );
    
    // Listen refresh
    messaging().onTokenRefresh(async (newToken) => {
      await axios.put(
        `${this.apiUrl}/notifications/fcm-token`,
        { fcmToken: newToken, isPushEnabled: true },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
    });
  }
  
  setupHandlers(navigation: any) {
    // Foreground
    messaging().onMessage((msg) => {
      Alert.alert(msg.notification?.title || '', msg.notification?.body || '');
      if (msg.data?.borrowId) {
        navigation.navigate('BorrowDetail', { borrowId: msg.data.borrowId });
      }
    });
    
    // Background tap
    messaging().onNotificationOpenedApp((msg) => {
      if (msg.data?.borrowId) {
        navigation.navigate('BorrowDetail', { borrowId: msg.data.borrowId });
      }
    });
  }
}

// Sử dụng trong App.tsx
const notificationService = new NotificationService();

useEffect(() => {
  const jwtToken = await getJWTToken();
  await notificationService.setup(jwtToken);
  notificationService.setupHandlers(navigation);
}, []);
```

## ⚠️ Lưu Ý Quan Trọng

1. **iOS**: Phải request permission trước khi lấy token
2. **Token refresh**: Token có thể thay đổi, cần listen và cập nhật
3. **Gửi token sau login**: Đảm bảo gửi token mỗi khi user login
4. **Navigation**: Xử lý navigate khi user tap notification

## 🧪 Test

```typescript
// Test gửi notification ngay
await axios.post(
  'http://your-api-url/notifications/test-send',
  {},
  { headers: { Authorization: `Bearer ${jwtToken}` } }
);
```

## 📚 Tài Liệu Chi Tiết

Xem `notification-fe-integration.md` để biết chi tiết đầy đủ.
