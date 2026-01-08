# 🚀 Quick Start: Push Notification cho Frontend

## Tóm Tắt Nhanh

### 1. Cài Đặt
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Lấy FCM Token và Gửi Lên Backend

```typescript
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

// Sau khi user login thành công
async function setupNotifications(jwtToken: string) {
  // 1. Request permission (iOS)
  await messaging().requestPermission();
  
  // 2. Lấy FCM token
  const fcmToken = await messaging().getToken();
  
  // 3. Gửi lên backend
  await axios.put(
    'http://your-api/notifications/fcm-token',
    { fcmToken, isPushEnabled: true },
    { headers: { Authorization: `Bearer ${jwtToken}` } }
  );
}
```

### 3. Xử Lý Notification

```typescript
// Foreground (app đang mở)
messaging().onMessage((remoteMessage) => {
  Alert.alert(
    remoteMessage.notification?.title,
    remoteMessage.notification?.body
  );
});

// Background
messaging().setBackgroundMessageHandler((remoteMessage) => {
  console.log('Background:', remoteMessage);
});

// User tap notification
messaging().onNotificationOpenedApp((remoteMessage) => {
  // Navigate đến màn hình chi tiết
  navigation.navigate('BorrowDetail', {
    borrowId: remoteMessage.data?.borrowId
  });
});
```

### 4. Listen Token Refresh

```typescript
messaging().onTokenRefresh(async (token) => {
  // Gửi token mới lên backend
  await updateFCMTokenToBackend(token);
});
```

## 📋 Checklist

- [ ] Cài đặt dependencies
- [ ] Setup Firebase config (google-services.json / GoogleService-Info.plist)
- [ ] Request permission (iOS)
- [ ] Lấy FCM token sau khi login
- [ ] Gửi token lên backend API
- [ ] Listen token refresh
- [ ] Xử lý foreground notifications
- [ ] Xử lý background notifications
- [ ] Xử lý khi user tap notification
- [ ] Navigate đến màn hình chi tiết khi tap

## 🔗 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| PUT | `/notifications/fcm-token` | Cập nhật FCM token |
| POST | `/notifications/test-send` | Test gửi notification |
| POST | `/notifications/trigger-reminder` | Trigger manual reminder |

## 📦 Notification Data Structure

```typescript
{
  borrowId: string;      // ID khoản mượn
  bookId: string;       // ID sách
  bookTitle: string;     // Tên sách
  daysUntilDue: string;  // Số ngày còn lại (0, 1, 3)
}
```

## 📚 Xem Chi Tiết

Xem file `notification-fe-integration.md` để biết chi tiết đầy đủ về:
- Component example hoàn chỉnh
- Error handling
- Best practices
- Troubleshooting
- Cấu hình Android/iOS
