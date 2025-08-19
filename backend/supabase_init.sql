-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."manager" (
    "id" SERIAL NOT NULL,
    "entry_id" INTEGER NOT NULL,
    "display_name" TEXT NOT NULL,
    "owner_name" TEXT,
    "fpl_team_url" TEXT,
    "favorite_club" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manager_alias" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "managerId" INTEGER NOT NULL,

    CONSTRAINT "manager_alias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manager_entry_id_key" ON "public"."manager"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "manager_alias_slug_key" ON "public"."manager_alias"("slug");

-- AddForeignKey
ALTER TABLE "public"."manager_alias" ADD CONSTRAINT "manager_alias_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."manager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

