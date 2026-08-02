-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('GENERAL', 'ISA', 'PENSION_SAVINGS', 'IRP', 'RETIREMENT_PENSION_IRP');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "accountType" "AccountType";
