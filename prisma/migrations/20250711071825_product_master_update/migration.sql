/*
  Warnings:

  - You are about to drop the column `images` on the `product_master` table. All the data in the column will be lost.
  - You are about to drop the column `product_desc` on the `product_master` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_master" DROP COLUMN "images",
DROP COLUMN "product_desc",
ADD COLUMN     "description" VARCHAR,
ADD COLUMN     "image" VARCHAR,
ADD COLUMN     "price" VARCHAR,
ADD COLUMN     "size" VARCHAR;
