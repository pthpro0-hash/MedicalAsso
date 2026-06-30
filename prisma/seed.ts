import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client/index";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.recommendationCandidate.deleteMany();
  await prisma.recommendationRequest.deleteMany();
  await prisma.educationRecord.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const superAdmin = await prisma.user.create({
    data: { name: "최고관리자", email: "admin@example.com", passwordHash, role: "SUPER_ADMIN" }
  });
  const staff = await prisma.user.create({
    data: { name: "사무국 직원", email: "staff@example.com", passwordHash, role: "STAFF" }
  });
  await prisma.user.create({
    data: { name: "조회 담당자", email: "readonly@example.com", passwordHash, role: "READ_ONLY" }
  });

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name: "김민준",
        licenseNumber: "D-10001",
        medicalInstitutionName: "강남내과의원",
        specialty: "내과",
        phone: "010-1000-0001",
        email: "doctor1@example.com",
        availableRegions: "서울 강남구, 서울 서초구",
        availableDays: "월,수,금",
        maxFacilityCount: 4,
        currentFacilityCount: 1,
        educationStatus: "COMPLETED",
        status: "AVAILABLE",
        memo: "신규 배정 가능"
      }
    }),
    prisma.doctor.create({
      data: {
        name: "이서연",
        licenseNumber: "D-10002",
        medicalInstitutionName: "서초가정의학과",
        specialty: "가정의학과",
        phone: "010-1000-0002",
        email: "doctor2@example.com",
        availableRegions: "서울 서초구, 서울 동작구",
        availableDays: "화,목",
        maxFacilityCount: 3,
        currentFacilityCount: 2,
        educationStatus: "COMPLETED",
        status: "AVAILABLE"
      }
    }),
    prisma.doctor.create({
      data: {
        name: "박지훈",
        licenseNumber: "D-10003",
        medicalInstitutionName: "송파정형외과",
        specialty: "정형외과",
        phone: "010-1000-0003",
        availableRegions: "서울 송파구",
        availableDays: "월,목",
        maxFacilityCount: 2,
        currentFacilityCount: 2,
        educationStatus: "PENDING",
        status: "FULL"
      }
    }),
    prisma.doctor.create({
      data: {
        name: "정하윤",
        licenseNumber: "D-10004",
        medicalInstitutionName: "마포신경과",
        specialty: "신경과",
        phone: "010-1000-0004",
        availableRegions: "서울 마포구, 서울 용산구",
        availableDays: "수",
        maxFacilityCount: 3,
        currentFacilityCount: 0,
        educationStatus: "UNKNOWN",
        status: "NEEDS_REVIEW"
      }
    }),
    prisma.doctor.create({
      data: {
        name: "최유진",
        licenseNumber: "D-10005",
        medicalInstitutionName: "강동의원",
        specialty: "내과",
        phone: "010-1000-0005",
        availableRegions: "서울 강동구",
        availableDays: "금",
        maxFacilityCount: 2,
        currentFacilityCount: 0,
        educationStatus: "COMPLETED",
        status: "ON_HOLD",
        memo: "일시 보류"
      }
    })
  ]);

  await prisma.educationRecord.create({
    data: {
      doctorId: doctors[0].id,
      courseName: "촉탁의 직무교육",
      completedAt: new Date("2026-02-10T00:00:00.000+09:00"),
      memo: "수료증 확인"
    }
  });

  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: "강남행복요양원",
        facilityType: "노인요양시설",
        address: "서울 강남구 테헤란로 10",
        capacity: 80,
        currentResidents: 72,
        representativeName: "오대표",
        managerName: "한담당",
        phone: "02-1000-0001",
        email: "facility1@example.com",
        status: "NEEDS_DOCTOR"
      }
    }),
    prisma.facility.create({
      data: {
        name: "서초늘봄요양원",
        facilityType: "노인요양시설",
        address: "서울 서초구 반포대로 20",
        capacity: 60,
        currentResidents: 58,
        managerName: "문담당",
        phone: "02-1000-0002",
        status: "NORMAL"
      }
    }),
    prisma.facility.create({
      data: {
        name: "송파사랑요양원",
        facilityType: "공동생활가정",
        address: "서울 송파구 올림픽로 30",
        capacity: 30,
        currentResidents: 28,
        managerName: "서담당",
        phone: "02-1000-0003",
        status: "CONTRACT_EXPIRING"
      }
    }),
    prisma.facility.create({
      data: {
        name: "마포평안요양원",
        facilityType: "노인요양시설",
        address: "서울 마포구 월드컵로 40",
        capacity: 50,
        currentResidents: 44,
        managerName: "신담당",
        phone: "02-1000-0004",
        status: "RERECOMMENDATION"
      }
    }),
    prisma.facility.create({
      data: {
        name: "강동햇살요양원",
        facilityType: "노인요양시설",
        address: "서울 강동구 천호대로 50",
        capacity: 70,
        currentResidents: 65,
        managerName: "임담당",
        phone: "02-1000-0005",
        status: "NORMAL"
      }
    })
  ]);

  const requestWithCandidates = await prisma.recommendationRequest.create({
    data: {
      facilityId: facilities[0].id,
      requestType: "NEW",
      requestedSpecialty: "내과",
      preferredDays: "월,수",
      reason: "신규 촉탁의 추천 요청",
      status: "CANDIDATES_SELECTED",
      requestedAt: new Date("2026-06-20T00:00:00.000+09:00"),
      createdBy: staff.id
    }
  });
  await prisma.recommendationRequest.create({
    data: {
      facilityId: facilities[3].id,
      requestType: "RERECOMMENDATION",
      requestedSpecialty: "가정의학과",
      preferredDays: "화",
      reason: "기존 촉탁의 일정 조율 어려움으로 재추천 요청",
      status: "RECEIVED",
      requestedAt: new Date("2026-06-28T00:00:00.000+09:00"),
      createdBy: staff.id
    }
  });

  await prisma.recommendationCandidate.createMany({
    data: [
      { recommendationRequestId: requestWithCandidates.id, doctorId: doctors[0].id, rank: 1, reason: "지역 및 전문과목 일치" },
      { recommendationRequestId: requestWithCandidates.id, doctorId: doctors[1].id, rank: 2, reason: "교육 이수 및 일정 가능" }
    ]
  });

  await prisma.assignment.create({
    data: {
      facilityId: facilities[1].id,
      doctorId: doctors[1].id,
      contractStartDate: new Date("2026-01-01T00:00:00.000+09:00"),
      contractEndDate: new Date("2026-12-31T00:00:00.000+09:00"),
      status: "ACTIVE",
      registrationFee: 100000,
      registrationFeePaid: true,
      memo: "정상 계약"
    }
  });
  const expiringAssignment = await prisma.assignment.create({
    data: {
      facilityId: facilities[2].id,
      doctorId: doctors[2].id,
      contractStartDate: new Date("2025-07-15T00:00:00.000+09:00"),
      contractEndDate: new Date("2026-07-15T00:00:00.000+09:00"),
      status: "EXPIRING_SOON",
      registrationFee: 100000,
      registrationFeePaid: false,
      memo: "30일 이내 만료 예정"
    }
  });

  await prisma.complaint.create({
    data: {
      facilityId: facilities[2].id,
      doctorId: doctors[2].id,
      assignmentId: expiringAssignment.id,
      type: "COMMUNICATION",
      title: "방문 일정 조율 지연",
      content: "시설과 촉탁의 간 방문 일정 조율이 늦어지는 행정 민원입니다. 환자 정보는 기록하지 않습니다.",
      status: "RECEIVED",
      receivedAt: new Date("2026-06-25T00:00:00.000+09:00"),
      memo: "사무국 확인 필요"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: superAdmin.id,
      action: "SEED_DATA_CREATE",
      entityType: "System",
      entityId: "seed",
      afterJson: JSON.stringify({ users: 3, doctors: 5, facilities: 5 })
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
