/*
  Warnings:

  - Made the column `active` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "active" SET NOT NULL;
