/*
  Warnings:

  - The `customer_address` column on the `sales_order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "sales_order" DROP COLUMN "customer_address",
ADD COLUMN     "customer_address" JSONB;
