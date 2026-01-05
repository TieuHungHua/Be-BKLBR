-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('student', 'admin', 'lecturer');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
<<<<<<< HEAD
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
=======
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
>>>>>>> origin/feature/room-booking
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student';
COMMIT;

-- AlterTable
<<<<<<< HEAD
ALTER TABLE "books" ADD COLUMN "cover_image" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "password" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN "username" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN "email" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "student_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
=======
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN     "username" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN     "email" TEXT;
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;
ALTER TABLE "users" ADD COLUMN     "student_id" TEXT;

-- AlterTable
ALTER TABLE "books" ADD COLUMN     "cover_image" TEXT;
ALTER TABLE "books" ADD COLUMN     "description" TEXT;
ALTER TABLE "books" ADD COLUMN     "pages" INTEGER;
ALTER TABLE "books" ADD COLUMN     "publication_year" INTEGER;
ALTER TABLE "books" ADD COLUMN     "publisher" TEXT;
>>>>>>> origin/feature/room-booking

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comments_user_id_book_id_key" ON "comments"("user_id", "book_id");

-- CreateIndex
CREATE INDEX "comments_book_id_created_at_idx" ON "comments"("book_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_user_id_created_at_idx" ON "comments"("user_id", "created_at" DESC);

<<<<<<< HEAD
=======
-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

>>>>>>> origin/feature/room-booking
-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
