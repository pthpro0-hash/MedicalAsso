import type { Doctor, Facility } from "@prisma/client/index";
import { doctorStatusLabels, educationStatusLabels, facilityStatusLabels } from "@/server/constants";

export function DoctorForm({ action, disabled, doctor }: { action: (formData: FormData) => void | Promise<void>; disabled?: boolean; doctor?: Doctor }) {
  return (
    <form action={action} className="form-grid">
      {doctor ? <input type="hidden" name="id" value={doctor.id} /> : null}
      <div className="field"><label>이름</label><input name="name" required defaultValue={doctor?.name ?? ""} /></div>
      <div className="field"><label>면허번호</label><input name="licenseNumber" defaultValue={doctor?.licenseNumber ?? ""} /></div>
      <div className="field"><label>소속 의료기관</label><input name="medicalInstitutionName" required defaultValue={doctor?.medicalInstitutionName ?? ""} /></div>
      <div className="field"><label>전문과목</label><input name="specialty" required defaultValue={doctor?.specialty ?? ""} /></div>
      <div className="field"><label>연락처</label><input name="phone" required defaultValue={doctor?.phone ?? ""} /></div>
      <div className="field"><label>이메일</label><input name="email" type="email" defaultValue={doctor?.email ?? ""} /></div>
      <div className="field"><label>가능 지역</label><input name="availableRegions" defaultValue={doctor?.availableRegions ?? ""} /></div>
      <div className="field"><label>가능 요일</label><input name="availableDays" defaultValue={doctor?.availableDays ?? ""} /></div>
      <div className="field"><label>최대 담당 시설 수</label><input name="maxFacilityCount" type="number" defaultValue={doctor?.maxFacilityCount ?? 3} /></div>
      <div className="field"><label>현재 담당 시설 수</label><input name="currentFacilityCount" type="number" defaultValue={doctor?.currentFacilityCount ?? 0} /></div>
      <div className="field"><label>교육 상태</label><select name="educationStatus" defaultValue={doctor?.educationStatus ?? "UNKNOWN"}>{Object.entries(educationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="field"><label>상태</label><select name="status" defaultValue={doctor?.status ?? "NEEDS_REVIEW"}>{Object.entries(doctorStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="field full"><label>메모</label><textarea name="memo" defaultValue={doctor?.memo ?? ""} /></div>
      <div className="field full"><button className="button" disabled={disabled} type="submit">{doctor ? "수정 저장" : "등록"}</button></div>
    </form>
  );
}

export function FacilityForm({ action, disabled, facility }: { action: (formData: FormData) => void | Promise<void>; disabled?: boolean; facility?: Facility }) {
  return (
    <form action={action} className="form-grid">
      {facility ? <input type="hidden" name="id" value={facility.id} /> : null}
      <div className="field"><label>시설명</label><input name="name" required defaultValue={facility?.name ?? ""} /></div>
      <div className="field"><label>시설 유형</label><input name="facilityType" defaultValue={facility?.facilityType ?? ""} /></div>
      <div className="field full"><label>주소</label><input name="address" required defaultValue={facility?.address ?? ""} /></div>
      <div className="field"><label>정원</label><input name="capacity" type="number" defaultValue={facility?.capacity ?? ""} /></div>
      <div className="field"><label>현원</label><input name="currentResidents" type="number" defaultValue={facility?.currentResidents ?? ""} /></div>
      <div className="field"><label>대표자</label><input name="representativeName" defaultValue={facility?.representativeName ?? ""} /></div>
      <div className="field"><label>담당자</label><input name="managerName" defaultValue={facility?.managerName ?? ""} /></div>
      <div className="field"><label>연락처</label><input name="phone" required defaultValue={facility?.phone ?? ""} /></div>
      <div className="field"><label>이메일</label><input name="email" type="email" defaultValue={facility?.email ?? ""} /></div>
      <div className="field"><label>상태</label><select name="status" defaultValue={facility?.status ?? "NORMAL"}>{Object.entries(facilityStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="field full"><label>메모</label><textarea name="memo" defaultValue={facility?.memo ?? ""} /></div>
      <div className="field full"><button className="button" disabled={disabled} type="submit">{facility ? "수정 저장" : "등록"}</button></div>
    </form>
  );
}
