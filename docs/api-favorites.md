# 📚 API Yêu Thích Sách

## Tổng Quan

Các API để quản lý sách yêu thích của user. Tất cả API đều yêu cầu JWT authentication.

---

## 1. Lấy Danh Sách Sách Yêu Thích

**GET** `/books/favorites`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (mặc định: 1) |
| `limit` | number | No | Số lượng mỗi trang (mặc định: 10, tối đa: 100) |
| `search` | string | No | Tìm kiếm theo tên sách hoặc tác giả |

### Response

```json
{
  "data": [
    {
      "id": "interaction-uuid",
      "userId": "user-uuid",
      "bookId": "book-uuid",
      "favoritedAt": "2024-01-15T10:30:00.000Z",
      "book": {
        "id": "book-uuid",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "coverImage": "https://...",
        "description": "...",
        "availableCopies": 5,
        "likeCount": 10,
        "commentCount": 3,
        "borrowCount": 20,
        "categories": ["Programming"],
        "status": "có sẵn",
        "isBorrowed": false,
        "borrowDue": null,
        "isFavorite": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Example

```bash
GET /books/favorites?page=1&limit=10&search=Clean
Authorization: Bearer <token>
```

---

## 2. Yêu Thích / Bỏ Yêu Thích Sách

**POST** `/books/:id/favorite`

Toggle yêu thích sách (thêm nếu chưa có, bỏ nếu đã có).

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của sách |

### Response (Khi thêm yêu thích)

```json
{
  "id": "interaction-uuid",
  "userId": "user-uuid",
  "bookId": "book-uuid",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "book": {
    "id": "book-uuid",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "coverImage": "https://...",
    "availableCopies": 5,
    "likeCount": 11
  },
  "isFavorite": true
}
```

### Response (Khi bỏ yêu thích)

```json
{
  "bookId": "book-uuid",
  "book": {
    "id": "book-uuid",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "coverImage": "https://...",
    "availableCopies": 5,
    "likeCount": 10
  },
  "isFavorite": false
}
```

### Example

```bash
POST /books/123e4567-e89b-12d3-a456-426614174000/favorite
Authorization: Bearer <token>
```

---

## 3. Kiểm Tra Đã Yêu Thích Chưa

**GET** `/books/:id/favorite`

Kiểm tra user hiện tại đã yêu thích sách này chưa.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID của sách |

### Response

```json
{
  "bookId": "book-uuid",
  "isFavorite": true,
  "favoriteId": "interaction-uuid"
}
```

### Example

```bash
GET /books/123e4567-e89b-12d3-a456-426614174000/favorite
Authorization: Bearer <token>
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Sách không tồn tại"
}
```

---

## Lưu Ý

- Tất cả API đều yêu cầu JWT token trong header `Authorization: Bearer <token>`
- Khi yêu thích sách, user sẽ nhận được 2 điểm thưởng
- `likeCount` của sách và `totalLikes` của user sẽ tự động cập nhật
- API `POST /books/:id/favorite` là toggle: gọi lần đầu sẽ thêm, gọi lần nữa sẽ bỏ


