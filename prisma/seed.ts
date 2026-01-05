import { PrismaClient, RoomResourceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Starting seed...');

  // Hash password cho admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  // Táº¡o admin Ä‘áº§u tiÃªn
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

  console.log('âœ… Created admin user:', {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
  console.log('ðŸ“ Admin login credentials:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  console.log('   âš ï¸  VUI LÃ’NG Äá»”I Máº¬T KHáº¨U SAU KHI ÄÄ‚NG NHáº¬P!');
  console.log('');

  // Hash password: Test123!
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // Táº¡o user test
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: hashedPassword,
      displayName: 'Nguyá»…n VÄƒn Test',
      role: 'student',
      classMajor: 'CÃ´ng nghá»‡ thÃ´ng tin',
      avatar: null,
    },
  });

  console.log('âœ… Created test user:', {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
  console.log('ðŸ“ Test user login credentials:');
  console.log('   Username: testuser');
  console.log('   Password: Test123!');
  await seedMeetingRooms();
}


async function seedMeetingRooms() {
  const rooms: Array<{
    id: string;
    name: string;
    capacity: number;
    imageUrl?: string | null;
    isActive?: boolean;
    resources: RoomResourceType[];
  }> = [
    {
      id: 'a7b87d2f-9c9c-4ed5-9dcb-9f545e02a9a1',
      name: 'Room A',
      capacity: 8,
      imageUrl: null,
      isActive: true,
      resources: [RoomResourceType.projector, RoomResourceType.whiteboard],
    },
    {
      id: 'b8a2c2a1-37e3-4fa4-9c8a-6c9b0e0b2512',
      name: 'Room B',
      capacity: 12,
      imageUrl: null,
      isActive: true,
      resources: [RoomResourceType.tv, RoomResourceType.speakerphone],
    },
    {
      id: 'c1ad3b8c-6f0b-4c2e-9c1b-0f9d6d69de5f',
      name: 'Room C',
      capacity: 6,
      imageUrl: null,
      isActive: true,
      resources: [RoomResourceType.whiteboard],
    },
    {
      id: 'd8f2c0c9-0a2a-4c16-8a6e-b7f6d7b8309f',
      name: 'Room D',
      capacity: 16,
      imageUrl: null,
      isActive: true,
      resources: [RoomResourceType.projector, RoomResourceType.microphone],
    },
  ];

  for (const room of rooms) {
    await prisma.meetingRoom.upsert({
      where: { id: room.id },
      update: {
        name: room.name,
        capacity: room.capacity,
        imageUrl: room.imageUrl ?? null,
        isActive: room.isActive ?? true,
      },
      create: {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        imageUrl: room.imageUrl ?? null,
        isActive: room.isActive ?? true,
        resources: {
          create: room.resources.map((type) => ({ type })),
        },
      },
    });

    if (room.resources.length) {
      const existing = await prisma.roomResource.findMany({
        where: { roomId: room.id },
        select: { type: true },
      });
      const existingTypes = new Set(existing.map((item) => item.type));
      const missing = room.resources.filter((type) => !existingTypes.has(type));

      if (missing.length) {
        await prisma.roomResource.createMany({
          data: missing.map((type) => ({
            roomId: room.id,
            type,
          })),
        });
      }
    }
  }

  console.log('Seeded meeting rooms and resources');
}
main()
  .catch((e) => {
    console.error('âŒ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






