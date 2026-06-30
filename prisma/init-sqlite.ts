import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

const ddl = `
PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "AuditLog";
DROP TABLE IF EXISTS "Document";
DROP TABLE IF EXISTS "Complaint";
DROP TABLE IF EXISTS "Assignment";
DROP TABLE IF EXISTS "RecommendationCandidate";
DROP TABLE IF EXISTS "RecommendationRequest";
DROP TABLE IF EXISTS "EducationRecord";
DROP TABLE IF EXISTS "Facility";
DROP TABLE IF EXISTS "Doctor";
DROP TABLE IF EXISTS "User";

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Doctor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "licenseNumber" TEXT,
  "medicalInstitutionName" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "availableRegions" TEXT,
  "availableDays" TEXT,
  "maxFacilityCount" INTEGER NOT NULL DEFAULT 3,
  "currentFacilityCount" INTEGER NOT NULL DEFAULT 0,
  "educationStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Doctor_name_idx" ON "Doctor"("name");
CREATE INDEX "Doctor_specialty_idx" ON "Doctor"("specialty");
CREATE INDEX "Doctor_status_idx" ON "Doctor"("status");
CREATE INDEX "Doctor_educationStatus_idx" ON "Doctor"("educationStatus");

CREATE TABLE "Facility" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "facilityType" TEXT,
  "address" TEXT NOT NULL,
  "capacity" INTEGER,
  "currentResidents" INTEGER,
  "representativeName" TEXT,
  "managerName" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NORMAL',
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Facility_name_idx" ON "Facility"("name");
CREATE INDEX "Facility_status_idx" ON "Facility"("status");

CREATE TABLE "EducationRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "doctorId" TEXT NOT NULL,
  "courseName" TEXT NOT NULL,
  "completedAt" DATETIME NOT NULL,
  "certificateFileId" TEXT,
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EducationRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "RecommendationRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "facilityId" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "requestedSpecialty" TEXT,
  "preferredDays" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "requestedAt" DATETIME NOT NULL,
  "reviewedAt" DATETIME,
  "completedAt" DATETIME,
  "memo" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RecommendationRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RecommendationRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RecommendationRequest_status_idx" ON "RecommendationRequest"("status");
CREATE INDEX "RecommendationRequest_requestType_idx" ON "RecommendationRequest"("requestType");
CREATE INDEX "RecommendationRequest_requestedAt_idx" ON "RecommendationRequest"("requestedAt");

CREATE TABLE "RecommendationCandidate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recommendationRequestId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "reason" TEXT,
  "selectedByAssociation" BOOLEAN NOT NULL DEFAULT true,
  "sentToFacility" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationCandidate_recommendationRequestId_fkey" FOREIGN KEY ("recommendationRequestId") REFERENCES "RecommendationRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecommendationCandidate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RecommendationCandidate_recommendationRequestId_doctorId_key" ON "RecommendationCandidate"("recommendationRequestId", "doctorId");
CREATE INDEX "RecommendationCandidate_recommendationRequestId_idx" ON "RecommendationCandidate"("recommendationRequestId");

CREATE TABLE "Assignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "facilityId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "recommendationRequestId" TEXT,
  "contractStartDate" DATETIME NOT NULL,
  "contractEndDate" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "registrationFee" INTEGER,
  "registrationFeePaid" BOOLEAN NOT NULL DEFAULT false,
  "contractFileId" TEXT,
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Assignment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Assignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Assignment_recommendationRequestId_fkey" FOREIGN KEY ("recommendationRequestId") REFERENCES "RecommendationRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");
CREATE INDEX "Assignment_contractEndDate_idx" ON "Assignment"("contractEndDate");

CREATE TABLE "Complaint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "facilityId" TEXT NOT NULL,
  "doctorId" TEXT,
  "assignmentId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" DATETIME NOT NULL,
  "resolvedAt" DATETIME,
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Complaint_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Complaint_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Complaint_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX "Complaint_type_idx" ON "Complaint"("type");

CREATE TABLE "Document" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "relatedEntityType" TEXT NOT NULL,
  "relatedEntityId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Document_relatedEntityType_relatedEntityId_idx" ON "Document"("relatedEntityType", "relatedEntityId");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeJson" TEXT,
  "afterJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
`;

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(ddl);
  const bytes = db.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, bytes);
  db.close();
  console.log(`SQLite database initialized at ${dbPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
