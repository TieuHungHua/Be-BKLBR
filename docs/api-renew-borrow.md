# 🔄 API Gia Hạn Mượn Sách

## Tổng Quan

API để gia hạn thời gian mượn sách. User có thể gia hạn thêm thời gian mượn với các điều kiện:
- Chỉ được gia hạn **1 lần** cho mỗi lần mượn
- Tổng thời gian (thời gian còn lại + số ngày gia hạn) phải **dưới 30 ngày**

---

## Gia Hạn Thời Gian Mượn

**POST** `/borrows/:id/renew`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của lịch sử mượn |

### Request Body

```json
{
  "days": 7
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `days` | number | Yes | Số ngày gia hạn thêm (1-30 ngày) |

### Response

```json
{
  "id": "borrow-uuid",
  "userId": "user-uuid",
  "bookId": "book-uuid",
  "borrowedAt": "2024-01-10T10:00:00.000Z",
  "dueAt": "2024-02-07T10:00:00.000Z",
  "returnedAt": null,
  "status": "active",
  "renewCount": 1,
  "maxRenewCount": 1,
  "user": {
    "id": "user-uuid",
    "username": "student123",
    "displayName": "Nguyễn Văn A"
  },
  "book": {
    "id": "book-uuid",
    "title": "Clean Code",
    "author": "Robert C. Martin"
  }
}
```

### Example

```bash
POST /borrows/123e4567-e89b-12d3-a456-426614174000/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "days": 7
}
```

---

## Error Responses

### 400 Bad Request

**Đã gia hạn tối đa:**
```json
{
  "statusCode": 400,
  "message": "Bạn đã gia hạn tối đa số lần cho phép"
}
```

**Tổng thời gian vượt quá 30 ngày:**
```json
{
  "statusCode": 400,
  "message": "Tổng thời gian gia hạn (15 ngày còn lại + 7 ngày gia hạn = 22 ngày) không được vượt quá 30 ngày"
}
```

**Sách đã được trả:**
```json
{
  "statusCode": 400,
  "message": "Sách đã được trả rồi, không thể gia hạn"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền gia hạn sách này"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Lịch sử mượn không tồn tại"
}
```

---

## Lưu Ý

- Chỉ được gia hạn **1 lần** cho mỗi lần mượn (`renewCount < maxRenewCount`)
- Tổng thời gian (thời gian còn lại + số ngày gia hạn) phải **< 30 ngày**
- Chỉ được gia hạn khi sách đang **active** (chưa trả)
- Chỉ **owner** mới được gia hạn sách của mình
- Sau khi gia hạn, `dueAt` sẽ được cập nhật và `renewCount` sẽ tăng lên 1

