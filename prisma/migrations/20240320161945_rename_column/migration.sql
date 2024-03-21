/*
  Warnings:

  - You are about to drop the column `activ` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" RENAME COLUMN "activ" TO "active";