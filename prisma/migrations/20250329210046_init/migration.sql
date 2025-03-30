-- CreateTable
CREATE TABLE "role_by_emoji" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "emojiId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_by_emoji_pkey" PRIMARY KEY ("id")
);
