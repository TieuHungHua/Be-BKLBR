import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type Slot = { startAt: string; endAt: string };

const buildSlot = (hoursFromNow: number): Slot => {
  const startAt = new Date();
  startAt.setHours(startAt.getHours() + hoursFromNow);
  startAt.setMinutes(0, 0, 0);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  return { startAt: startAt.toISOString(), endAt: endAt.toISOString() };
};

describe('Room Booking (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let studentToken: string;
  let adminToken: string;
  let otherStudentToken: string;

  let studentId: string;
  let adminId: string;
  let otherStudentId: string;

  let roomAId: string;
  let roomBId: string;

  let baseBookingId: string;

  const slotBase = buildSlot(2);
  const slotConflict = buildSlot(4);
  const slotCancel = buildSlot(6);
  const slotApprove = buildSlot(8);
  const slotReject = buildSlot(10);
  const slotUnauthorized = buildSlot(12);
  const slotCapacity = buildSlot(14);

  beforeAll(async () => {
    process.env.CLOUDINARY_CLOUD_NAME =
      process.env.CLOUDINARY_CLOUD_NAME || 'test';
    process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test';
    process.env.CLOUDINARY_API_SECRET =
      process.env.CLOUDINARY_API_SECRET || 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.BOOKING_AUTO_APPROVE = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const timestamp = Date.now();

    const student = await prisma.user.create({
      data: {
        username: `student_${timestamp}`,
        password: 'test-password',
        displayName: 'Student Test',
        role: 'student',
        studentId: `SV${timestamp}`,
        email: `student_${timestamp}@example.com`,
      },
      select: { id: true, username: true, role: true },
    });

    const admin = await prisma.user.create({
      data: {
        username: `admin_${timestamp}`,
        password: 'test-password',
        displayName: 'Admin Test',
        role: 'admin',
        email: `admin_${timestamp}@example.com`,
      },
      select: { id: true, username: true, role: true },
    });

    const otherStudent = await prisma.user.create({
      data: {
        username: `student_alt_${timestamp}`,
        password: 'test-password',
        displayName: 'Student Alt',
        role: 'student',
        studentId: `SV${timestamp}ALT`,
        email: `student_alt_${timestamp}@example.com`,
      },
      select: { id: true, username: true, role: true },
    });

    studentId = student.id;
    adminId = admin.id;
    otherStudentId = otherStudent.id;

    studentToken = await jwtService.signAsync({
      sub: student.id,
      username: student.username,
      role: student.role,
    });

    adminToken = await jwtService.signAsync({
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    });

    otherStudentToken = await jwtService.signAsync({
      sub: otherStudent.id,
      username: otherStudent.username,
      role: otherStudent.role,
    });

    const roomA = await prisma.meetingRoom.create({
      data: {
        name: `Room A ${timestamp}`,
        capacity: 6,
        isActive: true,
      },
      select: { id: true },
    });

    const roomB = await prisma.meetingRoom.create({
      data: {
        name: `Room B ${timestamp}`,
        capacity: 4,
        isActive: true,
      },
      select: { id: true },
    });

    roomAId = roomA.id;
    roomBId = roomB.id;

    await prisma.roomResource.createMany({
      data: [
        { roomId: roomA.id, type: 'projector' },
        { roomId: roomA.id, type: 'whiteboard' },
        { roomId: roomB.id, type: 'tv' },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) {
      const roomIds = [roomAId, roomBId].filter((id): id is string =>
        Boolean(id),
      );
      const userIds = [studentId, adminId, otherStudentId].filter(
        (id): id is string => Boolean(id),
      );

      if (roomIds.length) {
        await prisma.roomBooking.deleteMany({
          where: { roomId: { in: roomIds } },
        });
        await prisma.roomResource.deleteMany({
          where: { roomId: { in: roomIds } },
        });
        await prisma.meetingRoom.deleteMany({
          where: { id: { in: roomIds } },
        });
      }

      if (userIds.length) {
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    }

    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/rooms returns availability for a slot', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/rooms')
      .query({
        start_at: slotBase.startAt,
        end_at: slotBase.endAt,
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortDir: 'asc',
      })
      .expect(200);

    const body = response.body as {
      items: Array<{ id: string; availability: { is_available: boolean } }>;
      meta: { page: number; pageSize: number };
    };

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 10 });

    const roomA = body.items.find((room) => room.id === roomAId);
    const roomB = body.items.find((room) => room.id === roomBId);
    expect(roomA?.availability?.is_available).toBe(true);
    expect(roomB?.availability?.is_available).toBe(true);
  });

  it('POST /api/v1/bookings creates a booking', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotBase.startAt,
        end_at: slotBase.endAt,
        purpose: 'Weekly sync',
        attendee_count: 4,
      })
      .expect(201);

    const body = response.body as {
      id: string;
      room_id: string;
      user_id: string;
      status: string;
      room: { id: string; resources: string[] };
      user: { id: string; student_code?: string | null };
    };

    baseBookingId = body.id;
    expect(body.room_id).toBe(roomAId);
    expect(body.user_id).toBe(studentId);
    expect(body.status).toBe('pending');
    expect(body.room.id).toBe(roomAId);
    expect(body.room.resources).toEqual(
      expect.arrayContaining(['projector', 'whiteboard']),
    );
    expect(body.user.id).toBe(studentId);
    expect(body.user.student_code).toBeDefined();
  });

  it('GET /api/v1/rooms marks booked room as unavailable', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/rooms')
      .query({
        start_at: slotBase.startAt,
        end_at: slotBase.endAt,
        page: 1,
        pageSize: 10,
      })
      .expect(200);

    const body = response.body as {
      items: Array<{ id: string; availability: { is_available: boolean } }>;
    };

    const roomA = body.items.find((room) => room.id === roomAId);
    const roomB = body.items.find((room) => room.id === roomBId);
    expect(roomA?.availability?.is_available).toBe(false);
    expect(roomB?.availability?.is_available).toBe(true);
  });

  it('POST /api/v1/bookings rejects conflicting booking', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotConflict.startAt,
        end_at: slotConflict.endAt,
        purpose: 'Conflict test',
        attendee_count: 3,
      })
      .expect(201);

    const firstBody = first.body as { id: string };
    expect(firstBody.id).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotConflict.startAt,
        end_at: slotConflict.endAt,
        purpose: 'Conflict retry',
        attendee_count: 2,
      })
      .expect(409);
  });

  it('POST /api/v1/bookings validates attendee_count against capacity', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomBId,
        start_at: slotCapacity.startAt,
        end_at: slotCapacity.endAt,
        purpose: 'Too many attendees',
        attendee_count: 99,
      })
      .expect(400);
  });

  it('POST /api/v1/bookings/search returns paginated list (public)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings/search')
      .send({
        page: 1,
        pageSize: 10,
        filters: [
          {
            field: 'status',
            op: 'IN',
            value: ['PENDING', 'APPROVED', 'CANCELLED'],
          },
        ],
        sorts: [{ field: 'start_at', dir: 'DESC' }],
      })
      .expect(200);

    const body = response.body as {
      items: Array<{ id: string }>;
      meta: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
      };
    };

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalItems).toBeGreaterThanOrEqual(1);
    expect(body.items.map((item) => item.id)).toContain(baseBookingId);
  });

  it('GET /api/v1/bookings/:id returns booking detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${baseBookingId}`)
      .expect(200);

    const body = response.body as {
      id: string;
      room: { id: string };
      user: { id: string };
    };
    expect(body.id).toBe(baseBookingId);
    expect(body.room.id).toBe(roomAId);
    expect(body.user.id).toBe(studentId);
  });

  it('PATCH /api/v1/bookings/:id/cancel enforces ownership', async () => {
    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotUnauthorized.startAt,
        end_at: slotUnauthorized.endAt,
        purpose: 'Ownership test',
        attendee_count: 2,
      })
      .expect(201);

    const bookingBody = bookingResponse.body as { id: string };
    const bookingId = bookingBody.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ reason: 'Not my booking' })
      .expect(403);
  });

  it('PATCH /api/v1/bookings/:id/cancel cancels booking for owner', async () => {
    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotCancel.startAt,
        end_at: slotCancel.endAt,
        purpose: 'Need to cancel',
        attendee_count: 3,
      })
      .expect(201);

    const bookingBody = bookingResponse.body as { id: string };
    const bookingId = bookingBody.id;

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Schedule changed' })
      .expect(200);

    const body = response.body as {
      status: string;
      cancel_reason: string | null;
    };
    expect(body.status).toBe('cancelled');
    expect(body.cancel_reason).toBe('Schedule changed');
  });

  it('PATCH /api/v1/admin/bookings/:id/approve requires staff role', async () => {
    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotApprove.startAt,
        end_at: slotApprove.endAt,
        purpose: 'Approval flow',
        attendee_count: 2,
      })
      .expect(201);

    const bookingBody = bookingResponse.body as { id: string };
    const bookingId = bookingBody.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${bookingId}/approve`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${bookingId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as {
      status: string;
      approved_by: string | null;
    };
    expect(body.status).toBe('approved');
    expect(body.approved_by).toBe(adminId);
  });

  it('PATCH /api/v1/admin/bookings/:id/reject cancels booking', async () => {
    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room_id: roomAId,
        start_at: slotReject.startAt,
        end_at: slotReject.endAt,
        purpose: 'Reject flow',
        attendee_count: 2,
      })
      .expect(201);

    const bookingBody = bookingResponse.body as { id: string };
    const bookingId = bookingBody.id;

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${bookingId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Not available' })
      .expect(200);

    const body = response.body as {
      status: string;
      cancel_reason: string | null;
    };
    expect(body.status).toBe('cancelled');
    expect(body.cancel_reason).toBe('Not available');
  });
});
