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
  }
}
```

---

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
