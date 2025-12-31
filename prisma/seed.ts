import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password cho admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  // Tạo admin đầu tiên
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      displayName: 'System Administrator',
      password: adminPassword,
      role: 'admin',
      phone: '0123456789',
    },
  });

  console.log('✅ Created admin user:', {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
  console.log('📝 Admin login credentials:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  console.log('   ⚠️  VUI LÒNG ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP!');
  console.log('');

  // Hash password: Test123!
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // Tạo user test
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: hashedPassword,
      displayName: 'Nguyễn Văn Test',
      role: 'student',
      classMajor: 'Công nghệ thông tin',
      avatar: null,
    },
  });

  console.log('✅ Created test user:', {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
  console.log('📝 Test user login credentials:');
  console.log('   Username: testuser');
  console.log('   Password: Test123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






