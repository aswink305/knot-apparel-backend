-- CreateTable
CREATE TABLE "user_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "email" TEXT,
    "auth" TEXT,
    "password" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "pincode" TEXT,
    "gender" TEXT,
    "updatedDate" TIMESTAMP(3),
    "last_active" TIMESTAMP(3),
    "status" TEXT,
    "image" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_master" (
    "product_id" SERIAL NOT NULL,
    "product_code" VARCHAR,
    "product_name" VARCHAR,
    "product_desc" VARCHAR,
    "product_type" VARCHAR,
    "created_date" TIMESTAMP(6),
    "updated_date" TIMESTAMP(6),
    "color" VARCHAR,
    "images" VARCHAR,

    CONSTRAINT "PRODUCT_MASTER_pkey" PRIMARY KEY ("product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_code_unique" ON "product_master"("product_code");
