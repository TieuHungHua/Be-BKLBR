# 🎫 API Quản Lý Ticket

## Tổng Quan

Các API để quản lý ticket (yêu cầu mượn/trả sách, đặt/hủy phòng). **Ticket được tạo tự động** khi:
- User mượn sách → Tự động tạo ticket `borrow_book` với status `pending`
- User trả sách → Tự động tạo ticket `return_book` với status `pending`
- User đặt phòng → Tự động tạo ticket `room_booking` với status `pending`
- User hủy phòng → Tự động tạo ticket `room_cancellation` với status `pending`

Admin sẽ xét duyệt các ticket này (approved/rejected).

---

## 1. Lấy Danh Sách Tickets

**GET** `/tickets`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (mặc định: 1) |
| `limit` | number | No | Số lượng mỗi trang (mặc định: 10) |
| `type` | string | No | Lọc theo loại: `borrow_book`, `return_book`, `room_booking`, `room_cancellation` |
| `status` | string | No | Lọc theo trạng thái: `pending`, `approved`, `rejected` |
| `userId` | string | No | Lọc theo user (chỉ admin) |

### Response

```json
{
  "data": [
    {
      "id": "ticket-uuid",
      "userId": "user-uuid",
      "type": "borrow_book",
      "status": "pending",
      "bookId": "book-uuid",
      "reason": "Cần sách để học tập",
      "reviewedBy": null,
      "reviewedAt": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "book": {
        "id": "book-uuid",
        "title": "Clean Code",
        "author": "Robert C. Martin"
      },
      "user": {
        "id": "user-uuid",
        "displayName": "Nguyễn Văn A"
      }
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

## 2. Lấy Chi Tiết Ticket

**GET** `/tickets/:id`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của ticket |

### Response

```json
{
  "id": "ticket-uuid",
  "userId": "user-uuid",
  "type": "room_booking",
  "status": "approved",
  "roomId": "room-uuid",
  "startAt": "2024-01-20T10:00:00Z",
  "endAt": "2024-01-20T12:00:00Z",
  "reason": "Họp nhóm dự án",
  "note": "Đã duyệt",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-01-15T11:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "room": {
    "id": "room-uuid",
    "name": "Phòng họp A",
    "capacity": 10
  },
  "user": {
    "id": "user-uuid",
    "displayName": "Nguyễn Văn A"
  },
  "reviewer": {
    "id": "admin-uuid",
    "displayName": "Admin"
  }
}
```

---

## 3. Admin Cập Nhật Trạng Thái Ticket

**PATCH** `/tickets/:id/status`

**Chỉ Admin mới được phép**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của ticket |

### Request Body

```json
{
  "status": "approved", // approved | rejected
  "note": "Đã duyệt yêu cầu" // Optional
}
```

### Response

```json
{
  "id": "ticket-uuid",
  "status": "approved",
  "note": "Đã duyệt yêu cầu",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

## 4. Xóa Ticket (Chỉ User tạo hoặc Admin)

**DELETE** `/tickets/:id`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của ticket |

### Response

```json
{
  "message": "Ticket đã được xóa thành công"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ"
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
  "message": "Chỉ admin mới được phép thực hiện hành động này"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Ticket không tồn tại"
}
```

---

## Lưu Ý

- **Ticket được tạo tự động**: Không cần gọi API để tạo ticket, hệ thống tự động tạo khi:
  - Mượn sách: `POST /borrows` → Tự động tạo ticket `borrow_book`
  - Trả sách: `POST /borrows/:id/return` → Tự động tạo ticket `return_book`
  - Đặt phòng: `POST /api/v1/bookings` → Tự động tạo ticket `room_booking`
  - Hủy phòng: `PATCH /api/v1/bookings/:id/cancel` → Tự động tạo ticket `room_cancellation`

- **User**: Có thể xem danh sách ticket của mình, xem chi tiết ticket của mình, xóa ticket của mình (nếu status = pending)
- **Admin**: Có thể xem tất cả tickets, cập nhật trạng thái ticket, xóa bất kỳ ticket nào
- Khi ticket được **approved**:
  - `borrow_book`: Đã được xử lý khi tạo borrow (ticket chỉ để tracking)
  - `return_book`: Đã được xử lý khi return (ticket chỉ để tracking)
  - `room_booking`: Đã được xử lý khi tạo booking (ticket chỉ để tracking)
  - `room_cancellation`: Đã được xử lý khi cancel (ticket chỉ để tracking)
- Ticket có status = `pending` mới có thể bị xóa hoặc cập nhật bởi user

