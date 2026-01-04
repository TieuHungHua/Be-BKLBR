import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MeetingBooking (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string;
  let bookingId: string;
  let tableName: string;
  let startAt: string;
  let endAt: string;

  beforeAll(async () => {
    process.env.CLOUDINARY_CLOUD_NAME =
      process.env.CLOUDINARY_CLOUD_NAME || 'test';
    process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test';
    process.env.CLOUDINARY_API_SECRET =
      process.env.CLOUDINARY_API_SECRET || 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: {
        username: `meeting_test_${Date.now()}`,
        password: 'test-password',
        displayName: 'Meeting Test User',
        role: 'student',
      },
      select: { id: true },
    });

    userId = user.id;
    tableName = `Table-${Date.now()}`;
    startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    endAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  });

  afterAll(async () => {
    if (prisma && userId) {
      await prisma.meetingBooking.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }

    if (app) {
      await app.close();
    }
  });

  it('POST /meeting-bookings creates a booking', async () => {
    const response = await request(app.getHttpServer())
      .post('/meeting-bookings')
      .send({
        userId,
        tableName,
        startAt,
        endAt,
        purpose: 'Planning',
        attendees: 4,
      })
      .expect(201);

    bookingId = response.body.id;

    expect(response.body.tableName).toBe(tableName);
    expect(response.body.user.id).toBe(userId);
  });

  it('POST /meeting-bookings rejects overlapping time', async () => {
    await request(app.getHttpServer())
      .post('/meeting-bookings')
      .send({
        userId,
        tableName,
        startAt,
        endAt,
      })
      .expect(400);
  });

  it('GET /meeting-bookings returns list', async () => {
    const response = await request(app.getHttpServer())
      .get('/meeting-bookings')
      .expect(200);

    const ids = response.body.data.map((item: { id: string }) => item.id);
    expect(ids).toContain(bookingId);
  });

  it('GET /meeting-bookings/:id returns detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/meeting-bookings/${bookingId}`)
      .expect(200);

    expect(response.body.id).toBe(bookingId);
  });

  it('PATCH /meeting-bookings/:id updates booking', async () => {
    const newStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const newEndAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const response = await request(app.getHttpServer())
      .patch(`/meeting-bookings/${bookingId}`)
      .send({
        userId,
        startAt: newStartAt,
        endAt: newEndAt,
        purpose: 'Updated',
      })
      .expect(200);

    expect(response.body.startAt).toBe(newStartAt);
    expect(response.body.endAt).toBe(newEndAt);
    expect(response.body.purpose).toBe('Updated');
  });

  it('DELETE /meeting-bookings/:id removes booking', async () => {
    await request(app.getHttpServer())
      .delete(`/meeting-bookings/${bookingId}`)
      .query({ userId })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/meeting-bookings/${bookingId}`)
      .expect(404);
  });
});
