<<<<<<< HEAD
# API Dat Ban Hop (Meeting Booking)

Tai lieu nay giup FE tich hop API dat ban hop. Dinh dang thoi gian su dung ISO 8601, vi du `2024-02-01T09:00:00.000Z`.

Base URL
- `/meeting-bookings`

Auth
- Tam thoi public. Server van kiem tra role tu `userId` (allowed: student, lecturer, admin).

Quy tac nghiep vu
- `endAt` phai sau `startAt`.
- Trung lich neu cung `tableName` va khoang thoi gian bi overlap (`startAt < other.endAt` AND `endAt > other.startAt`).

---

1) Tao booking
- Method: `POST /meeting-bookings`
- Body:
```json
{
  "userId": "uuid-user-id",
  "tableName": "Table A1",
  "startAt": "2024-02-01T09:00:00.000Z",
  "endAt": "2024-02-01T10:00:00.000Z",
  "purpose": "Weekly sync",
  "attendees": 6
}
```
- Success `201`:
```json
{
  "id": "uuid-booking-id",
  "user": {
    "id": "uuid-user-id",
    "username": "jdoe",
    "displayName": "John Doe",
    "role": "student"
  },
  "tableName": "Table A1",
  "startAt": "2024-02-01T09:00:00.000Z",
  "endAt": "2024-02-01T10:00:00.000Z",
  "purpose": "Weekly sync",
  "attendees": 6,
  "createdAt": "2024-02-01T08:30:00.000Z"
}
```
- Errors:
  - `400` invalid data / time conflict
  - `404` user not found

---

2) Danh sach booking (phan trang)
- Method: `GET /meeting-bookings?page=1&limit=10`
- Query:
  - `page` (default 1)
  - `limit` (default 10, max 100)
- Success `200`:
```json
{
  "data": [ { "id": "..." } ],
  "criteria": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
=======
# Tài liệu API đặt phòng họp nhóm

## Tổng quan
- Base URL (local): `http://localhost:3000`
- Định dạng thời gian: ISO 8601 có timezone (ví dụ `2024-01-01T08:00:00+07:00`)
- Slot hợp lệ: 60 phút, `start_at` đúng giờ (phút/giây/millisecond = 0)
- Trạng thái booking: `pending`, `approved`, `completed`, `cancelled`
- Tài nguyên phòng: `projector`, `whiteboard`, `tv`, `speakerphone`, `microphone`, `other`

## Xác thực
- Các API yêu cầu đăng nhập dùng header:
  - `Authorization: Bearer <access_token>`
- Lấy token qua `POST /auth/login` (đã có sẵn trong hệ thống).

## Quy tắc nghiệp vụ chính
- 1 booking = 1 phòng + 1 slot thời gian.
- `attendee_count` >= 1 và <= `room.capacity`.
- `purpose` bắt buộc (không rỗng).
- Trùng phòng cùng slot với status `pending/approved` => trả `409 Conflict`.
- Huỷ booking chỉ khi status `pending/approved`.
- List booking tạm thời công khai (không lọc theo user), nhưng vẫn đọc role khi có token.

## Mẫu object booking
```json
{
  "id": "uuid",
  "room_id": "uuid",
  "user_id": "uuid",
  "start_at": "2024-01-01T01:00:00.000Z",
  "end_at": "2024-01-01T02:00:00.000Z",
  "purpose": "Weekly sync",
  "attendee_count": 4,
  "status": "pending",
  "approved_by": null,
  "approved_at": null,
  "cancelled_by": null,
  "cancelled_at": null,
  "cancel_reason": null,
  "created_at": "2024-01-01T00:10:00.000Z",
  "updated_at": "2024-01-01T00:10:00.000Z",
  "room": {
    "id": "uuid",
    "name": "Room A",
    "capacity": 8,
    "image_url": null,
    "resources": ["projector", "whiteboard"]
  },
  "user": {
    "id": "uuid",
    "name": "Nguyen A",
    "email": "a@uni.edu",
    "student_code": "SV001",
    "username": "nguyena"
>>>>>>> origin/feature/room-booking
  }
}
```

---

<<<<<<< HEAD
3) Chi tiet booking
- Method: `GET /meeting-bookings/{id}`
- Success `200`: return `MeetingBookingResponse`
- Errors:
  - `404` booking not found

---

4) Cap nhat booking
- Method: `PATCH /meeting-bookings/{id}`
- Body (bat buoc co `userId` va it nhat 1 field):
```json
{
  "userId": "uuid-user-id",
  "tableName": "Table A2",
  "startAt": "2024-02-01T11:00:00.000Z",
  "endAt": "2024-02-01T12:00:00.000Z",
  "purpose": "Updated",
  "attendees": 8
}
```
- Success `200`: return `MeetingBookingResponse`
- Errors:
  - `400` no data / invalid time / time conflict
  - `404` booking or user not found

---

5) Huy booking
- Method: `DELETE /meeting-bookings/{id}?userId=uuid-user-id`
- Query:
  - `userId` (required)
- Success `200`: return deleted `MeetingBookingResponse`
- Errors:
  - `400` missing `userId`
  - `404` booking or user not found

---

Schema tom tat
- `MeetingBookingResponse`:
  - `id`: string
  - `user`: { id, username, displayName, role }
  - `tableName`: string
  - `startAt`: ISO 8601 string
  - `endAt`: ISO 8601 string
  - `purpose`: string | null
  - `attendees`: number | null
  - `createdAt`: ISO 8601 string

OpenAPI JSON
- `dat-ban-api.json`
=======
# 1) Rooms availability
`GET /api/v1/rooms`

## Query params
- `start_at` (required, ISO 8601)
- `end_at` (required, ISO 8601)
- `page` (optional, default 1)
- `pageSize` (optional, default 20)
- `sortBy` (optional: `name`, `capacity`, `created_at`)
- `sortDir` (optional: `asc`, `desc`)

## Response
```json
{
  "items": [
    {
      "id": "room-uuid",
      "name": "Room A",
      "capacity": 8,
      "image_url": null,
      "resources": ["projector", "whiteboard"],
      "availability": { "is_available": true }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 }
}
```

---

# 2) Create booking
`POST /api/v1/bookings` (JWT)

## Body
```json
{
  "room_id": "uuid",
  "start_at": "2024-01-01T08:00:00+07:00",
  "end_at": "2024-01-01T09:00:00+07:00",
  "purpose": "Weekly sync",
  "attendee_count": 4
}
```

## Response
Trả về object booking (xem mẫu ở trên).

## Errors
- `400` input không hợp lệ
- `401` chưa đăng nhập
- `404` phòng không tồn tại
- `409` trùng lịch

---

# 3) Search bookings (Criteria)
`POST /api/v1/bookings/search` (public, optional JWT)

## Body (Criteria)
```json
{
  "page": 1,
  "pageSize": 20,
  "filters": [
    { "field": "status", "op": "IN", "value": ["pending", "approved"] },
    { "field": "start_at", "op": ">=", "value": "2024-01-01T00:00:00+07:00" },
    { "field": "start_at", "op": "<=", "value": "2024-01-31T23:59:59+07:00" }
  ],
  "sorts": [
    { "field": "start_at", "dir": "DESC" }
  ]
}
```

## Operators hỗ trợ
- `EQ`, `NE`, `IN`, `>=`, `<=`, `>`, `<`, `CONTAINS`
- `CONTAINS` chỉ áp dụng cho `purpose` (không phân biệt hoa thường).

## Fields hỗ trợ
- Filter: `status`, `start_at`, `end_at`, `created_at`, `room_id`, `user_id`, `attendee_count`, `purpose`
- Sort: `start_at`, `end_at`, `created_at`, `status`, `attendee_count`

## Response
```json
{
  "items": [/* booking objects */],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 123, "totalPages": 7 }
}
```

---

# 4) Booking detail
`GET /api/v1/bookings/{id}` (public, optional JWT)

## Response
Trả về object booking.

## Errors
- `404` không tìm thấy booking

---

# 5) Cancel booking
`PATCH /api/v1/bookings/{id}/cancel` (JWT)

## Body
```json
{ "reason": "Schedule changed" }
```

## Response
Trả về object booking với `status = cancelled`.

## Errors
- `400` không thể huỷ (status không hợp lệ)
- `401` chưa đăng nhập
- `403` không phải chủ booking hoặc admin/lecturer
- `404` booking không tồn tại

---

# 6) Admin search bookings
`POST /api/v1/admin/bookings/search` (JWT, role admin/lecturer)

Body giống `/api/v1/bookings/search`.

---

# 7) Admin approve booking
`PATCH /api/v1/admin/bookings/{id}/approve` (JWT, role admin/lecturer)

## Response
Trả về booking với `status = approved`.

## Errors
- `400` booking không ở trạng thái pending
- `403` không đủ quyền
- `404` không tìm thấy booking
- `409` trùng lịch

---

# 8) Admin reject booking
`PATCH /api/v1/admin/bookings/{id}/reject` (JWT, role admin/lecturer)

## Body
```json
{ "reason": "Not available" }
```

## Response
Trả về booking với `status = cancelled`.

## Errors
- `400` booking không ở trạng thái pending
- `403` không đủ quyền
- `404` không tìm thấy booking
>>>>>>> origin/feature/room-booking
