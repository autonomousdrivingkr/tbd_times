-- CreateEnum
CREATE TYPE "RebalanceCategory" AS ENUM ('GROWTH_ENGINE', 'DIVIDEND_GROWTH', 'HIGH_YIELD_CASHCOW', 'SAFE_ASSET');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "rebalanceCategory" "RebalanceCategory";
