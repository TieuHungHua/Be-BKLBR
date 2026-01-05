# Deployment Troubleshooting Guide

## Lỗi: Cannot find module '/app/dist/main.js'

### Nguyên nhân có thể:
1. Build chưa chạy hoặc build thất bại
2. Thư mục `dist` không được tạo
3. Cấu hình build/start command sai

### Giải pháp:

#### 1. Nếu deploy trên Render.com:

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

**Hoặc sử dụng file `render.yaml`** (đã tạo sẵn trong project)

**Kiểm tra:**
- Đảm bảo `buildCommand` chạy trước `startCommand`
- Kiểm tra logs để xem build có thành công không
- Verify rằng thư mục `dist` được tạo sau khi build

#### 2. Nếu deploy bằng Docker:

**Build Docker image:**
```bash
docker build -t library-backend .
```

**Run container:**
```bash
docker run -p 3000:3000 library-backend
```

**Kiểm tra:**
- Xem logs khi build để đảm bảo `npm run build` thành công
- Verify rằng `dist/main.js` tồn tại trong image:
  ```bash
  docker run --entrypoint sh library-backend -c "ls -la /app/dist/"
  ```

#### 3. Kiểm tra local trước khi deploy:

```bash
# Build application
npm run build

# Verify dist folder exists
ls -la dist/

# Verify main.js exists
test -f dist/main.js && echo "OK" || echo "ERROR: main.js not found"

# Test production start
npm run start:prod
```

#### 4. Nếu vẫn lỗi:

**Kiểm tra tsconfig.json:**
- `outDir` phải là `"./dist"`
- `rootDir` không được set (hoặc là `"./src"`)

**Kiểm tra nest-cli.json:**
- `sourceRoot` phải là `"src"`

**Kiểm tra package.json:**
- `start:prod` phải là `"node dist/main"` hoặc `"node dist/main.js"`

**Debug build:**
```bash
# Xem chi tiết build process
npm run build -- --verbose

# Hoặc
npx nest build --verbose
```

### Environment Variables cần thiết:

Đảm bảo các biến môi trường sau được set:
- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PORT` (optional, default: 3000)

### Common Issues:

1. **Build fails silently**: Thêm `|| exit 1` vào build command
2. **Prisma Client not found**: Đảm bảo `npx prisma generate` chạy trước `npm run build`
3. **Missing dependencies**: Đảm bảo `npm install` chạy đầy đủ
4. **Wrong working directory**: Verify WORKDIR trong Dockerfile hoặc build settings






