import { StudentVerification } from "../models/index.js";

function toPlain(instance) {
  return instance ? instance.get({ plain: true }) : null;
}

function isValidMSSV(mssv) {
  return /^\d{8,10}$/.test(String(mssv).trim());
}

function isValidCCCD(cccd) {
  return /^\d{12}$/.test(String(cccd).trim());
}

function isValidBirthYear(year) {
  const y = parseInt(year);
  return y >= 1950 && y <= new Date().getFullYear();
}

export async function submitVerification(userId, payload = {}) {
  const {
    mssv,
    school,
    cccd,
    full_name,
    birth_year,
    enrollment_year,
    graduation_year,
    student_card_image,
  } = payload;

  const errors = [];
  if (!mssv || !isValidMSSV(mssv)) {
    errors.push("MSSV phải là 8-10 chữ số.");
  }
  if (!school || String(school).trim().length < 3) {
    errors.push("Tên trường không hợp lệ.");
  }
  if (!cccd || !isValidCCCD(cccd)) {
    errors.push("CCCD phải là 12 chữ số.");
  }
  if (!full_name || String(full_name).trim().length < 2) {
    errors.push("Họ tên không hợp lệ.");
  }
  if (!birth_year || !isValidBirthYear(birth_year)) {
    errors.push("Năm sinh không hợp lệ.");
  }

  if (!enrollment_year || !graduation_year) {
    errors.push("Vui lòng chọn năm nhập học và ra trường.");
  }
  if (!student_card_image) {
    errors.push("Vui lòng tải lên ảnh thẻ sinh viên.");
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  const existing = await StudentVerification.findOne({
    where: { user_id: userId },
    order: [["id", "DESC"]],
  });

  if (existing) {
    const e = toPlain(existing);
    if (e.status === "verified") {
      const err = new Error("Bạn đã được xác minh sinh viên.");
      err.status = 409;
      throw err;
    }
    if (e.status === "pending") {
      const err = new Error("Yêu cầu xác minh đang chờ duyệt. Vui lòng đợi.");
      err.status = 409;
      throw err;
    }

    await existing.update({
      mssv: String(mssv).trim(),
      school: String(school).trim(),
      cccd: String(cccd).trim(),
      full_name: String(full_name).trim(),
      birth_year: parseInt(birth_year),

      enrollment_year: parseInt(enrollment_year),
      graduation_year: parseInt(graduation_year),
      student_card_image: student_card_image,

      status: "pending",
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      created_at: new Date(),
    });
    return toPlain(existing);
  }

  const created = await StudentVerification.create({
    user_id: userId,
    mssv: String(mssv).trim(),
    school: String(school).trim(),
    cccd: String(cccd).trim(),
    full_name: String(full_name).trim(),
    birth_year: parseInt(birth_year),

    enrollment_year: parseInt(enrollment_year),
    graduation_year: parseInt(graduation_year),
    student_card_image: student_card_image,

    status: "pending",
    created_at: new Date(),
  });

  return toPlain(created);
}

export async function getMyVerification(userId) {
  const row = await StudentVerification.findOne({
    where: { user_id: userId },
    order: [["id", "DESC"]],
  });
  return toPlain(row);
}

export async function checkStudentEligibility(userId) {
  const row = await StudentVerification.findOne({
    where: { user_id: userId },
    order: [["id", "DESC"]],
  });

  if (!row) {
    return {
      eligible: false,
      reason: "Chưa nộp thông tin xác minh sinh viên.",
      status: null,
    };
  }

  const v = toPlain(row);

  if (v.status === "verified") {
    return { eligible: true, status: "verified" };
  }

  if (v.status === "pending") {
    return {
      eligible: false,
      reason: "Hồ sơ sinh viên đang chờ duyệt.",
      status: "pending",
    };
  }

  if (v.status === "rejected") {
    return {
      eligible: false,
      reason: `Bị từ chối: ${v.rejection_reason}`,
      status: "rejected",
    };
  }

  return {
    eligible: false,
    reason: "Trạng thái không hợp lệ.",
    status: v.status,
  };
}

export async function listVerifications({
  status,
  q,
  page = 1,
  limit = 20,
} = {}) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (status && ["pending", "verified", "rejected"].includes(status)) {
    where.status = status;
  }
  if (q && String(q).trim()) {
    const kw = `%${String(q).trim()}%`;
    where[StudentVerification.sequelize.Sequelize.Op.or] = [
      { mssv: { [StudentVerification.sequelize.Sequelize.Op.iLike]: kw } },
      { full_name: { [StudentVerification.sequelize.Sequelize.Op.iLike]: kw } },
      { school: { [StudentVerification.sequelize.Sequelize.Op.iLike]: kw } },
    ];
  }

  const { count, rows } = await StudentVerification.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    data: rows.map(toPlain),
  };
}

export async function verifyOrReject(
  adminId,
  verificationId,
  { status, rejection_reason } = {},
) {
  if (!["verified", "rejected"].includes(status)) {
    const err = new Error("status phải là verified hoặc rejected.");
    err.status = 400;
    throw err;
  }
  if (
    status === "rejected" &&
    (!rejection_reason || !String(rejection_reason).trim())
  ) {
    const err = new Error("Cần nhập lý do từ chối.");
    err.status = 400;
    throw err;
  }

  const row = await StudentVerification.findByPk(verificationId);
  if (!row) {
    const err = new Error("Không tìm thấy yêu cầu xác minh.");
    err.status = 404;
    throw err;
  }

  await row.update({
    status,
    verified_by: adminId,
    verified_at: new Date(),
    rejection_reason:
      status === "rejected" ? String(rejection_reason).trim() : null,
  });

  return toPlain(row);
}
