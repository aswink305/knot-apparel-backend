/*
  Warnings:

  - You are about to drop the column `auth` on the `user_details` table. All the data in the column will be lost.
  - You are about to drop the column `datetime` on the `user_details` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `user_details` table. All the data in the column will be lost.
  - You are about to drop the column `last_active` on the `user_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_details" DROP COLUMN "auth",
DROP COLUMN "datetime",
DROP COLUMN "gender",
DROP COLUMN "last_active",
ADD COLUMN     "address" JSONB;
