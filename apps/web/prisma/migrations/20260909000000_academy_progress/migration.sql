-- CreateTable
CREATE TABLE "AcademyProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quizzes" JSONB NOT NULL DEFAULT '{}',
    "drills" JSONB NOT NULL DEFAULT '{}',
    "missed" JSONB NOT NULL DEFAULT '{}',
    "placement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyProgress_userId_key" ON "AcademyProgress"("userId");

-- AddForeignKey
ALTER TABLE "AcademyProgress" ADD CONSTRAINT "AcademyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
