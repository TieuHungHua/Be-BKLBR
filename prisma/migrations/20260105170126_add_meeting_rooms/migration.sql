-- CreateEnum
CREATE TYPE "RoomBookingStatus" AS ENUM ('pending', 'approved', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "RoomResourceType" AS ENUM ('projector', 'whiteboard', 'tv', 'speakerphone', 'microphone', 'other');

-- CreateTable
CREATE TABLE "meeting_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_resources" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "type" "RoomResourceType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_bookings" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "attendee_count" INTEGER NOT NULL,
    "status" "RoomBookingStatus" NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_rooms_is_active_idx" ON "meeting_rooms"("is_active");

-- CreateIndex
CREATE INDEX "meeting_rooms_name_idx" ON "meeting_rooms"("name");

-- CreateIndex
CREATE INDEX "room_resources_room_id_idx" ON "room_resources"("room_id");

-- CreateIndex
CREATE INDEX "room_resources_type_idx" ON "room_resources"("type");

-- CreateIndex
CREATE INDEX "room_bookings_room_id_start_at_end_at_idx" ON "room_bookings"("room_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "room_bookings_user_id_start_at_idx" ON "room_bookings"("user_id", "start_at");

-- CreateIndex
CREATE INDEX "room_bookings_status_start_at_idx" ON "room_bookings"("status", "start_at");

-- AddForeignKey
ALTER TABLE "room_resources" ADD CONSTRAINT "room_resources_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
