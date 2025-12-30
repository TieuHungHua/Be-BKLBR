import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

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
  console.log('📝 Login credentials:');
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




