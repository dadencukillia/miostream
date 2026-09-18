-- CreateEnum
CREATE TYPE "ProfileFrame" AS ENUM ('DEFAULT');

-- CreateEnum
CREATE TYPE "ProfileBackground" AS ENUM ('DEFAULT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" VARCHAR(30),
    "name" VARCHAR(100),
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "social_networks" TEXT[],
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "last_action" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_frame" "ProfileFrame" NOT NULL DEFAULT 'DEFAULT',
    "profile_background" "ProfileBackground" NOT NULL DEFAULT 'DEFAULT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
