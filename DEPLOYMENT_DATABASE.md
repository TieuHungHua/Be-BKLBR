# 🗄️ Database Configuration for CI/CD

## Render.com Deployment

Trong file `render.yaml`, `DATABASE_URL` được set với `sync: false`, nghĩa là bạn cần set environment variable trong Render dashboard.

### Cách set DATABASE_URL trong Render:

1. Vào Render Dashboard → Service của bạn
2. Vào tab **Environment**
3. Thêm/Update environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_4CQxomgLiR0s@ep-fragrant-art-aez049dh-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### Database Connection Info:

- **Endpoint (Pooler)**: `ep-fragrant-art-aez049dh-pooler.c-2.us-east-2.aws.neon.tech`
- **Endpoint (Direct)**: `ep-fragrant-art-aez049dh.c-2.us-east-2.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **Password**: `npg_4CQxomgLiR0s`

### Connection Strings:

**For Application (Pooler):**
```
postgresql://neondb_owner:npg_4CQxomgLiR0s@ep-fragrant-art-aez049dh-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**For CLI Operations (Direct):**
```
postgresql://neondb_owner:npg_4CQxomgLiR0s@ep-fragrant-art-aez049dh.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## GitHub Actions / Other CI/CD

Nếu bạn dùng GitHub Actions hoặc CI/CD khác, set `DATABASE_URL` trong repository secrets:

1. Vào Repository Settings → Secrets and variables → Actions
2. Thêm secret:
   - **Name**: `DATABASE_URL`
   - **Value**: Connection string pooler ở trên

## Local Development

Copy `.env.example` thành `.env` và cập nhật với connection strings ở trên.

