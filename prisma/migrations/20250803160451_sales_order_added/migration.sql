-- CreateTable
CREATE TABLE "sales_list" (
    "id" SERIAL NOT NULL,
    "so_number" INTEGER,
    "product_id" INTEGER,
    "order_qty" INTEGER,
    "sales_price" INTEGER,
    "created_date" TIMESTAMP(6),

    CONSTRAINT "sales_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "sales_id" SERIAL NOT NULL,
    "so_number" VARCHAR,
    "total_amount" DECIMAL,
    "so_status" VARCHAR,
    "customer_address" TEXT,
    "created_date" TIMESTAMP(6),
    "customer_id" INTEGER,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("sales_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "so_number" ON "sales_order"("so_number");

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "so_number" FOREIGN KEY ("so_number") REFERENCES "sales_order"("sales_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "wish_list_product_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "customer_id" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
