type DoctorForScore = {
  educationStatus: string;
  status: string;
  specialty: string;
  availableRegions: string | null;
  currentFacilityCount: number;
};

type RequestForScore = {
  requestedSpecialty: string | null;
  facilityAddress: string;
};

export function calculateCandidateScore(doctor: DoctorForScore, request: RequestForScore) {
  let score = 0;

  if (doctor.educationStatus === "COMPLETED") score += 30;
  if (doctor.status === "AVAILABLE") score += 30;
  if (request.requestedSpecialty && doctor.specialty.includes(request.requestedSpecialty)) score += 20;
  if (regionMatches(doctor.availableRegions, request.facilityAddress)) score += 10;
  if (doctor.currentFacilityCount <= 3) score += 10;
  if (doctor.status === "ON_HOLD" || doctor.status === "STOPPED") score -= 100;

  return Math.max(0, score);
}

export function regionMatches(availableRegions: string | null, facilityAddress: string) {
  if (!availableRegions) return false;
  const tokens = availableRegions
    .split(/[,\s/]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2);
  return tokens.some((token) => facilityAddress.includes(token));
}
