-- CreateTable
CREATE TABLE "meeting_bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "attendees" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_bookings_user_id_start_at_idx" ON "meeting_bookings"("user_id", "start_at" DESC);

-- CreateIndex
CREATE INDEX "meeting_bookings_table_name_start_at_idx" ON "meeting_bookings"("table_name", "start_at" DESC);

-- AddForeignKey
ALTER TABLE "meeting_bookings" ADD CONSTRAINT "meeting_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
