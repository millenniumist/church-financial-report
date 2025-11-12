-- CreateTable
CREATE TABLE "Bulletin" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "localPath" TEXT NOT NULL,
    "cloudinaryUrl" TEXT,
    "fileSize" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bulletin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bulletin_date_idx" ON "Bulletin"("date" DESC);

-- CreateIndex
CREATE INDEX "Bulletin_isActive_date_idx" ON "Bulletin"("isActive", "date" DESC);
