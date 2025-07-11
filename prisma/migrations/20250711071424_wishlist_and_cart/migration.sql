-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "role" TEXT;

-- CreateTable
CREATE TABLE "customer_cart" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "customer_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wish_list" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "customer_wish_list_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_user_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_product_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_wish_list" ADD CONSTRAINT "wish_list_user_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_wish_list" ADD CONSTRAINT "wish_list_product_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
