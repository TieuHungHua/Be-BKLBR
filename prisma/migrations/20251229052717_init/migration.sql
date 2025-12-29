-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'admin', 'librarian');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('active', 'returned', 'overdue');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('like', 'comment');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('borrow', 'return', 'like', 'comment', 'redeem');

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('borrow', 'return_on_time', 'return_late', 'like', 'comment', 'redeem');

-- CreateEnum
CREATE TYPE "RedeemStatus" AS ENUM ('pending', 'approved', 'delivered');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar" TEXT,
    "class_major" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "total_borrowed" INTEGER NOT NULL DEFAULT 0,
    "total_returned" INTEGER NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_comments" INTEGER NOT NULL DEFAULT 0,
    "activity_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "available_copies" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "borrow_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "status" "BorrowStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "borrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "PointReason" NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_points" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redeems" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "cost_points" INTEGER NOT NULL,
    "status" "RedeemStatus" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redeems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "book_id" TEXT,
    "reward_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "books_title_idx" ON "books"("title");

-- CreateIndex
CREATE INDEX "books_author_idx" ON "books"("author");

-- CreateIndex
CREATE INDEX "borrows_user_id_idx" ON "borrows"("user_id");

-- CreateIndex
CREATE INDEX "borrows_book_id_idx" ON "borrows"("book_id");

-- CreateIndex
CREATE INDEX "borrows_status_due_at_idx" ON "borrows"("status", "due_at");

-- CreateIndex
CREATE INDEX "borrows_borrowed_at_idx" ON "borrows"("borrowed_at" DESC);

-- CreateIndex
CREATE INDEX "interactions_book_id_type_idx" ON "interactions"("book_id", "type");

-- CreateIndex
CREATE INDEX "interactions_user_id_created_at_idx" ON "interactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "interactions_user_id_book_id_type_key" ON "interactions"("user_id", "book_id", "type");

-- CreateIndex
CREATE INDEX "point_transactions_user_id_created_at_idx" ON "point_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "point_transactions_reason_idx" ON "point_transactions"("reason");

-- CreateIndex
CREATE INDEX "rewards_active_idx" ON "rewards"("active");

-- CreateIndex
CREATE INDEX "redeems_user_id_created_at_idx" ON "redeems"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "redeems_status_created_at_idx" ON "redeems"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_user_id_created_at_idx" ON "activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_event_type_created_at_idx" ON "activities"("event_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrows" ADD CONSTRAINT "borrows_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeems" ADD CONSTRAINT "redeems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeems" ADD CONSTRAINT "redeems_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
