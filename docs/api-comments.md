# 💬 API Bình Luận Sách

## Tổng Quan

Các API để quản lý bình luận cho sách. Mỗi user chỉ được bình luận **1 lần** cho mỗi cuốn sách.

---

## 1. Thêm Bình Luận

**POST** `/books/:bookId/comments`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | ID của sách |

### Request Body

```json
{
  "content": "Sách rất hay và bổ ích!"
}
```

### Response

```json
{
  "id": "comment-uuid",
  "content": "Sách rất hay và bổ ích!",
  "user": {
    "id": "user-uuid",
    "username": "student123",
    "displayName": "Nguyễn Văn A",
    "avatar": "https://..."
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. Lấy Danh Sách Bình Luận

**GET** `/books/:bookId/comments`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | ID của sách |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (mặc định: 1) |
| `limit` | number | No | Số lượng mỗi trang (mặc định: 10) |

### Response

```json
{
  "data": [
    {
      "id": "comment-uuid",
      "content": "Sách rất hay và bổ ích!",
      "user": {
        "id": "user-uuid",
        "username": "student123",
        "displayName": "Nguyễn Văn A",
        "avatar": "https://..."
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## 3. Cập Nhật Bình Luận

**PUT** `/books/:bookId/comments/:commentId`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | ID của sách |
| `commentId` | string | Yes | ID của bình luận |

### Request Body

```json
{
  "content": "Sách rất hay và bổ ích! (Đã chỉnh sửa)"
}
```

### Response

```json
{
  "id": "comment-uuid",
  "content": "Sách rất hay và bổ ích! (Đã chỉnh sửa)",
  "user": {
    "id": "user-uuid",
    "username": "student123",
    "displayName": "Nguyễn Văn A",
    "avatar": "https://..."
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

## 4. Xóa Bình Luận

**DELETE** `/books/:bookId/comments/:commentId`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | ID của sách |
| `commentId` | string | Yes | ID của bình luận |

### Response

```json
{
  "message": "Xóa bình luận thành công"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Bạn đã bình luận cho sách này rồi"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền sửa/xóa bình luận này"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Sách không tồn tại"
}
```
hoặc
```json
{
  "statusCode": 404,
  "message": "Bình luận không tồn tại"
}
```

---

## Lưu Ý

- Tất cả API đều yêu cầu JWT authentication
- Mỗi user chỉ được bình luận **1 lần** cho mỗi cuốn sách
- Chỉ **owner** mới được sửa/xóa bình luận của mình
- Khi bình luận, user nhận được **5 điểm thưởng**
- `commentCount` của sách và `totalComments` của user sẽ tự động cập nhật


