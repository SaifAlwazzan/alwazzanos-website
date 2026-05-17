-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('WATCHING', 'PREPARING', 'SUBMITTED', 'SHORTLISTED', 'WON', 'LOST', 'CANCELLED');

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuingEntity" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "description" TEXT,
    "status" "TenderStatus" NOT NULL DEFAULT 'WATCHING',
    "currencyCode" TEXT NOT NULL DEFAULT 'IQD',
    "estimatedValue" DECIMAL(18,2),
    "bidBondAmount" DECIMAL(18,2),
    "performanceBondPct" DECIMAL(5,2),
    "submissionMethod" TEXT,
    "publishedDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "openingDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "resultAt" TIMESTAMP(3),
    "resultNotes" TEXT,
    "requirements" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderDocument" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tender_number_key" ON "Tender"("number");

-- AddForeignKey
ALTER TABLE "TenderDocument" ADD CONSTRAINT "TenderDocument_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
