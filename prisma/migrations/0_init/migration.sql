-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" TEXT NOT NULL DEFAULT 'player',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "characterSlug" TEXT NOT NULL DEFAULT 'base-red',
    "gender" TEXT NOT NULL DEFAULT 'unspecified',
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "credits" INTEGER NOT NULL DEFAULT 300,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "fuel" INTEGER NOT NULL DEFAULT 10,
    "hull" INTEGER NOT NULL DEFAULT 100,
    "lifeForce" INTEGER NOT NULL DEFAULT 15,
    "motivation" INTEGER NOT NULL DEFAULT 100,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "endurance" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "panic" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "lastConfidenceResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atkSplit" INTEGER NOT NULL DEFAULT 50,
    "appearanceSelections" INTEGER NOT NULL DEFAULT 0,
    "appearanceNeedsSetup" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'original',
    "customQuicklinks" TEXT NOT NULL DEFAULT '[]',
    "gymStreak" INTEGER NOT NULL DEFAULT 0,
    "currentSector" TEXT NOT NULL DEFAULT 'Fringe Expanse',
    "kills" INTEGER NOT NULL DEFAULT 0,
    "bounty" INTEGER NOT NULL DEFAULT 0,
    "ore" INTEGER NOT NULL DEFAULT 0,
    "herbs" INTEGER NOT NULL DEFAULT 0,
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFuelRegen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastGymAt" TIMESTAMP(3),
    "lastMotivationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHydroAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDockAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFabAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPackAt" TIMESTAMP(3),
    "lastOutpostClaim" TIMESTAMP(3),
    "fish" INTEGER NOT NULL DEFAULT 0,
    "creditsBank" INTEGER NOT NULL DEFAULT 0,
    "loanAmount" INTEGER NOT NULL DEFAULT 0,
    "loanCreatedAt" TIMESTAMP(3),
    "bondAmount" INTEGER NOT NULL DEFAULT 0,
    "bondRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bondDays" INTEGER NOT NULL DEFAULT 0,
    "bondCreatedAt" TIMESTAMP(3),
    "bondMaturesAt" TIMESTAMP(3),
    "bondLastClaimedAt" TIMESTAMP(3),
    "gymEnergy" INTEGER NOT NULL DEFAULT 27,
    "lastGymEnergyAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoHerbs" BOOLEAN NOT NULL DEFAULT false,
    "hideBattleLogs" BOOLEAN NOT NULL DEFAULT false,
    "battleCooldown" INTEGER NOT NULL DEFAULT 5,
    "combatStimUse" TEXT NOT NULL DEFAULT 'attack_or_defend',
    "simTrainsToday" INTEGER NOT NULL DEFAULT 0,
    "lastSimTrainAt" TIMESTAMP(3),
    "lastAttackedAt" TIMESTAMP(3),
    "unspentPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WealthInvestment" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "days" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturesAt" TIMESTAMP(3) NOT NULL,
    "lastClaimedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WealthInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleLog" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "xpGained" INTEGER NOT NULL,
    "creditsGained" INTEGER NOT NULL,
    "roundsCount" INTEGER NOT NULL,
    "logText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "bonusType" TEXT NOT NULL,
    "bonusAmt" INTEGER NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardXp" INTEGER NOT NULL,
    "rewardCredits" INTEGER NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "karma" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Syndicate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "treasury" INTEGER NOT NULL DEFAULT 0,
    "leaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Syndicate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyndicateMember" (
    "id" TEXT NOT NULL,
    "syndicateId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyndicateMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickPost" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "GameGlobal" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "bankTreasury" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHero" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "heroSlug" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerHero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymLog" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "training" TEXT NOT NULL,
    "gain" DOUBLE PRECISION NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyProgress" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydroponicsData" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "gameState" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydroponicsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "targetPilotId" TEXT NOT NULL,
    "blockComms" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasinoBet" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "bet" INTEGER NOT NULL,
    "payout" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CasinoBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PilotState_userId_key" ON "PilotState"("userId");

-- CreateIndex
CREATE INDEX "WealthInvestment_pilotId_idx" ON "WealthInvestment"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "WealthInvestment_pilotId_days_key" ON "WealthInvestment"("pilotId", "days");

-- CreateIndex
CREATE INDEX "BattleLog_pilotId_idx" ON "BattleLog"("pilotId");

-- CreateIndex
CREATE INDEX "BattleLog_pilotId_createdAt_idx" ON "BattleLog"("pilotId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryItem_pilotId_idx" ON "InventoryItem"("pilotId");

-- CreateIndex
CREATE INDEX "Mission_pilotId_idx" ON "Mission"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BoardPost_authorId_idx" ON "BoardPost"("authorId");

-- CreateIndex
CREATE INDEX "BoardPost_category_idx" ON "BoardPost"("category");

-- CreateIndex
CREATE INDEX "BoardPost_createdAt_idx" ON "BoardPost"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_authorId_idx" ON "ChatMessage"("authorId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Syndicate_name_key" ON "Syndicate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Syndicate_tag_key" ON "Syndicate"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicateMember_pilotId_key" ON "SyndicateMember"("pilotId");

-- CreateIndex
CREATE INDEX "QuickPost_toId_idx" ON "QuickPost"("toId");

-- CreateIndex
CREATE INDEX "QuickPost_fromId_idx" ON "QuickPost"("fromId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "PlayerHero_pilotId_idx" ON "PlayerHero"("pilotId");

-- CreateIndex
CREATE INDEX "GymLog_pilotId_idx" ON "GymLog"("pilotId");

-- CreateIndex
CREATE INDEX "GymLog_pilotId_createdAt_idx" ON "GymLog"("pilotId", "createdAt");

-- CreateIndex
CREATE INDEX "StudyProgress_pilotId_idx" ON "StudyProgress"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyProgress_pilotId_course_key" ON "StudyProgress"("pilotId", "course");

-- CreateIndex
CREATE UNIQUE INDEX "HydroponicsData_pilotId_key" ON "HydroponicsData"("pilotId");

-- CreateIndex
CREATE INDEX "Watchlist_pilotId_idx" ON "Watchlist"("pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_pilotId_targetPilotId_key" ON "Watchlist"("pilotId", "targetPilotId");

-- CreateIndex
CREATE INDEX "CasinoBet_pilotId_idx" ON "CasinoBet"("pilotId");

-- CreateIndex
CREATE INDEX "CasinoBet_pilotId_game_idx" ON "CasinoBet"("pilotId", "game");

-- CreateIndex
CREATE INDEX "CasinoBet_pilotId_createdAt_idx" ON "CasinoBet"("pilotId", "createdAt");

-- AddForeignKey
ALTER TABLE "PilotState" ADD CONSTRAINT "PilotState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WealthInvestment" ADD CONSTRAINT "WealthInvestment_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleLog" ADD CONSTRAINT "BattleLog_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicateMember" ADD CONSTRAINT "SyndicateMember_syndicateId_fkey" FOREIGN KEY ("syndicateId") REFERENCES "Syndicate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicateMember" ADD CONSTRAINT "SyndicateMember_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickPost" ADD CONSTRAINT "QuickPost_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickPost" ADD CONSTRAINT "QuickPost_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHero" ADD CONSTRAINT "PlayerHero_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymLog" ADD CONSTRAINT "GymLog_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyProgress" ADD CONSTRAINT "StudyProgress_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydroponicsData" ADD CONSTRAINT "HydroponicsData_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_targetPilotId_fkey" FOREIGN KEY ("targetPilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasinoBet" ADD CONSTRAINT "CasinoBet_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "PilotState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

