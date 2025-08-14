-- CreateTable
CREATE TABLE "customer_address" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "land_mark" TEXT,
    "contact_number" TEXT,
    "pincode" INTEGER,

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "wish_list_user_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
