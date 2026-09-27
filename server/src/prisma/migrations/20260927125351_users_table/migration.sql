-- CreateEnum
CREATE TYPE "ProfileFrame" AS ENUM ('DEFAULT');

-- CreateEnum
CREATE TYPE "ProfileBackground" AS ENUM ('DEFAULT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "nickname" VARCHAR(30) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "social_networks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "last_action" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_frame" "ProfileFrame" NOT NULL DEFAULT 'DEFAULT',
    "profile_background" "ProfileBackground" NOT NULL DEFAULT 'DEFAULT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
