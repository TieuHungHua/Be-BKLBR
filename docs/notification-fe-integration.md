# 📱 Hướng Dẫn Tích Hợp Push Notification cho Frontend (React Native)

## 📋 Tổng Quan

Tài liệu này mô tả cách Frontend (React Native app) tích hợp với hệ thống push notification nhắc hạn trả sách tự động.

## 🔄 Flow Hoạt Động Tổng Thể

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get FCM Token   │ ← Từ Firebase Messaging
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send Token to   │ ← PUT /notifications/fcm-token
│ Backend         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend lưu     │
│ token vào DB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cron Job chạy   │ ← 8:00 AM hàng ngày
│ 8:00 AM         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend gửi     │ ← FCM Push Notification
│ Notification    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ App nhận        │ ← Foreground/Background
│ Notification    │
└─────────────────┘
```

## 🚀 Các Bước Tích Hợp

### Bước 1: Cài Đặt Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**Lưu ý**: Cần setup Firebase project và cấu hình `google-services.json` (Android) và `GoogleService-Info.plist` (iOS) trước.

### Bước 2: Request Permission (iOS)

```typescript
import messaging from '@react-native-firebase/messaging';

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
```

### Bước 3: Lấy FCM Token

```typescript
import messaging from '@react-native-firebase/messaging';

async function getFCMToken(): Promise<string | null> {
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
```

### Bước 4: Gửi Token Lên Backend

Sau khi user login thành công, gửi FCM token lên backend:

```typescript
import axios from 'axios';

async function updateFCMTokenToBackend(
  token: string,
  jwtToken: string,
  apiUrl: string = 'http://your-api-url'
): Promise<void> {
  try {
    const response = await axios.put(
      `${apiUrl}/notifications/fcm-token`,
      {
        fcmToken: token,
        isPushEnabled: true,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ FCM token updated:', response.data);
  } catch (error: any) {
    console.error('❌ Error updating FCM token:', error.response?.data || error.message);
    throw error;
  }
}
```

### Bước 5: Listen Token Refresh

FCM token có thể thay đổi, cần listen và cập nhật:

```typescript
import messaging from '@react-native-firebase/messaging';

// Listen for token refresh
messaging().onTokenRefresh(async (token) => {
  console.log('🔄 FCM Token refreshed:', token);
  
  // Lấy JWT token từ storage
  const jwtToken = await getJWTTokenFromStorage();
  
  if (jwtToken) {
    // Gửi token mới lên backend
    await updateFCMTokenToBackend(token, jwtToken);
  }
});
```

### Bước 6: Xử Lý Notification Khi App Đang Mở (Foreground)

```typescript
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Foreground messages (khi app đang mở)
messaging().onMessage(async (remoteMessage) => {
  console.log('📬 Notification received (foreground):', remoteMessage);
  
  // Hiển thị notification trong app
  if (remoteMessage.notification) {
    Alert.alert(
      remoteMessage.notification.title || 'Thông báo',
      remoteMessage.notification.body || '',
      [
        {
          text: 'Xem',
          onPress: () => {
            // Navigate đến màn hình chi tiết borrow
            if (remoteMessage.data?.borrowId) {
              navigation.navigate('BorrowDetail', {
                borrowId: remoteMessage.data.borrowId,
              });
            }
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  }
  
  // Hoặc dùng thư viện notification local để hiển thị đẹp hơn
  // Ví dụ: react-native-push-notification
});
```

### Bước 7: Xử Lý Notification Khi App Ở Background

```typescript
import messaging from '@react-native-firebase/messaging';

// Background messages (khi app ở background)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📬 Background notification:', remoteMessage);
  
  // Xử lý logic khi app ở background
  // Ví dụ: update badge, store notification, etc.
});
```

### Bước 8: Xử Lý Notification Khi User Tap (App Closed/Background)

```typescript
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  useEffect(() => {
    // Kiểm tra xem app được mở từ notification không
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📬 App opened from notification:', remoteMessage);
          
          // Navigate đến màn hình tương ứng
          if (remoteMessage.data?.borrowId) {
            navigation.navigate('BorrowDetail', {
              borrowId: remoteMessage.data.borrowId,
            });
          }
        }
      });

    // Listen notification khi app ở background và user tap
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📬 Notification opened app:', remoteMessage);
      
      if (remoteMessage.data?.borrowId) {
        navigation.navigate('BorrowDetail', {
          borrowId: remoteMessage.data.borrowId,
        });
      }
    });

    return unsubscribe;
  }, []);
}
```

## 📝 Component Example Hoàn Chỉnh

```typescript
// NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { Alert, Platform } from 'react-native';

class NotificationService {
  private apiUrl: string;
  private jwtToken: string | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  setJWTToken(token: string) {
    this.jwtToken = token;
  }

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }
    return true; // Android không cần request permission
  }

  async getFCMToken(): Promise<string | null> {
    try {
      await this.requestPermission();
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async updateFCMTokenToBackend(token: string): Promise<void> {
    if (!this.jwtToken) {
      console.warn('JWT token not set. Cannot update FCM token.');
      return;
    }

    try {
      await axios.put(
        `${this.apiUrl}/notifications/fcm-token`,
        {
          fcmToken: token,
          isPushEnabled: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.jwtToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('✅ FCM token updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating FCM token:', error.response?.data || error.message);
      throw error;
    }
  }

  setupNotificationHandlers(navigation: any) {
    // Foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('📬 Foreground notification:', remoteMessage);
      
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Thông báo',
          remoteMessage.notification.body || '',
          [
            {
              text: 'Xem',
              onPress: () => {
                if (remoteMessage.data?.borrowId) {
                  navigation.navigate('BorrowDetail', {
                    borrowId: remoteMessage.data.borrowId,
                  });
                }
              },
            },
            { text: 'Đóng', style: 'cancel' },
          ]
        );
      }
    });

    // Background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📬 Background notification:', remoteMessage);
    });

    // Token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('🔄 FCM Token refreshed:', token);
      await this.updateFCMTokenToBackend(token);
    });

    // App opened from notification (when app was closed)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📬 App opened from notification:', remoteMessage);
          if (remoteMessage.data?.borrowId) {
            navigation.navigate('BorrowDetail', {
              borrowId: remoteMessage.data.borrowId,
            });
          }
        }
      });

    // Notification opened app (when app was in background)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📬 Notification opened app:', remoteMessage);
      if (remoteMessage.data?.borrowId) {
        navigation.navigate('BorrowDetail', {
          borrowId: remoteMessage.data.borrowId,
        });
      }
    });
  }
}

export default NotificationService;
```

## 🎯 Sử Dụng Trong App

```typescript
// App.tsx hoặc App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import NotificationService from './services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://your-api-url';

function App() {
  const [notificationService] = useState(() => new NotificationService(API_URL));

  useEffect(() => {
    // Setup notification handlers
    notificationService.setupNotificationHandlers(navigation);

    // Lấy JWT token từ storage
    AsyncStorage.getItem('jwt_token').then((token) => {
      if (token) {
        notificationService.setJWTToken(token);
        
        // Lấy và gửi FCM token
        notificationService.getFCMToken().then((fcmToken) => {
          if (fcmToken) {
            notificationService.updateFCMTokenToBackend(fcmToken);
          }
        });
      }
    });
  }, []);

  return (
    <NavigationContainer>
      {/* Your app navigation */}
    </NavigationContainer>
  );
}
```

## 📊 Cấu Trúc Notification Data

Khi nhận notification, `remoteMessage.data` sẽ có cấu trúc:

```typescript
{
  borrowId: string;        // ID của khoản mượn
  bookId: string;         // ID của sách
  bookTitle: string;      // Tên sách
  daysUntilDue: string;   // Số ngày còn lại (0, 1, hoặc 3)
  type?: string;          // Loại notification (nếu có)
}
```

## 🔔 Các Loại Notification

### 1. Nhắc nhở -3 ngày
```
Title: 📚 Nhắc nhở trả sách
Body: Sách "{bookTitle}" của bạn sẽ hết hạn sau 3 ngày nữa. Vui lòng chuẩn bị trả sách!
```

### 2. Nhắc nhở -1 ngày
```
Title: 📚 Nhắc nhở trả sách
Body: Sách "{bookTitle}" của bạn sẽ hết hạn vào ngày mai. Vui lòng chuẩn bị trả sách!
```

### 3. Nhắc nhở đúng ngày (0 ngày)
```
Title: 📚 Hạn trả sách hôm nay!
Body: Sách "{bookTitle}" của bạn hết hạn trả vào hôm nay. Vui lòng trả sách đúng hạn!
```

## 🧪 Test Notification

### Test với Backend API

```typescript
// Test gửi notification ngay (không cần đợi 8:00 AM)
async function testNotification(jwtToken: string) {
  try {
    const response = await axios.post(
      'http://your-api-url/notifications/test-send',
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    console.log('Test notification sent:', response.data);
  } catch (error) {
    console.error('Error testing notification:', error);
  }
}
```

## ⚙️ Cấu Hình Cần Thiết

### Android

1. Thêm vào `android/app/build.gradle`:
```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

2. Thêm `google-services.json` vào `android/app/`

3. Thêm vào `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

4. Thêm vào `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### iOS

1. Thêm `GoogleService-Info.plist` vào project
2. Enable Push Notifications capability trong Xcode
3. Request permission trong code (đã có ở trên)

## 📱 Best Practices

1. **Luôn gửi FCM token sau khi login**: Đảm bảo token được cập nhật mỗi khi user login

2. **Listen token refresh**: Token có thể thay đổi, cần cập nhật lại

3. **Xử lý permission**: iOS cần request permission trước khi lấy token

4. **Navigation từ notification**: Khi user tap notification, navigate đến màn hình tương ứng

5. **Badge count**: Cập nhật badge số lượng notifications chưa đọc

6. **Error handling**: Xử lý lỗi khi không lấy được token hoặc gửi token thất bại

## 🐛 Troubleshooting

### Token là null
- Kiểm tra Firebase config đã đúng chưa
- Kiểm tra permission (iOS)
- Kiểm tra `google-services.json` (Android)

### Không nhận được notification
- Kiểm tra token đã được gửi lên backend chưa
- Kiểm tra `is_push_enabled = true` trong database
- Kiểm tra Firebase Admin SDK đã được setup đúng chưa

### Notification không hiển thị khi app đang mở
- Cần implement `onMessage` handler
- Hoặc dùng thư viện local notification để hiển thị

## 📚 Tài Liệu Tham Khảo

- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Backend API Documentation](./api-notifications.md)
