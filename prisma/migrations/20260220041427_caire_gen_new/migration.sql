-- CreateTable
CREATE TABLE "public"."Deck" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Slide" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "slideId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Narration" (
    "id" TEXT NOT NULL,
    "slideId" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "text" TEXT NOT NULL,
    "model" TEXT,
    "voiceId" TEXT,
    "status" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Narration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Credentials" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_username_key" ON "public"."Credentials"("username");

-- AddForeignKey
ALTER TABLE "public"."Slide" ADD CONSTRAINT "Slide_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "public"."Slide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Narration" ADD CONSTRAINT "Narration_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "public"."Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
