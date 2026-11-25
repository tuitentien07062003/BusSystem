import { Op } from "sequelize";
import { User, UserRole } from "../models/index.js";
import * as studentService from "../services/studentVerificationService.js";
import * as userFeedbackService from "../services/userFeedbackService.js";

function handleError(res, err, context) {
  console.error(`[adminController.${context}]`, err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.q) {
      const kw = `%${req.query.q.trim()}%`;
      where[Op.or] = [
        { username: { [Op.iLike]: kw } },
        { full_name: { [Op.iLike]: kw } },
        { phone: { [Op.iLike]: kw } },
      ];
    }
    if (req.query.is_active !== undefined) {
      where.is_active = req.query.is_active === "true";
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["id", "DESC"]],
      attributes: { exclude: ["password_hash"] },
    });

    const userIds = rows.map((u) => u.id);
    const rolesRows = await UserRole.findAll({
      where: { user_id: { [Op.in]: userIds } },
      raw: true,
    });
    const rolesByUser = {};
    rolesRows.forEach((r) => {
      if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
      rolesByUser[r.user_id].push(r.role);
    });

    const data = rows.map((u) => {
      const o = u.get({ plain: true });
      return { ...o, roles: rolesByUser[o.id] || [] };
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data,
    });
  } catch (err) {
    handleError(res, err, "listUsers");
  }
}

export async function changeUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active phải là boolean." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User không tồn tại." });
    }
    if (user.id === req.user.id && !is_active) {
      return res.status(400).json({ error: "Không thể tự khóa tài khoản." });
    }

    await user.update({ is_active, updated_at: new Date() });
    res.json({
      message: "Đã cập nhật trạng thái.",
      data: { id: user.id, is_active },
    });
  } catch (err) {
    handleError(res, err, "changeUserStatus");
  }
}

export async function assignRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["PASSENGER", "ADMIN"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role phải là PASSENGER hoặc ADMIN." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User không tồn tại." });
    }

    const existing = await UserRole.findOne({
      where: { user_id: user.id, role },
    });
    if (existing) {
      return res.status(409).json({ error: `User đã có role ${role}.` });
    }

    await UserRole.create({ user_id: user.id, role, created_at: new Date() });
    res
      .status(201)
      .json({ message: "Đã gán role.", data: { user_id: user.id, role } });
  } catch (err) {
    handleError(res, err, "assignRole");
  }
}

export async function listStudentVerifications(req, res) {
  try {
    const data = await studentService.listVerifications({
      status: req.query.status,
      q: req.query.q,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err, "listStudentVerifications");
  }
}

export async function verifyStudent(req, res) {
  try {
    const { status, rejection_reason } = req.body;
    const data = await studentService.verifyOrReject(
      req.user.id,
      req.params.id,
      {
        status,
        rejection_reason,
      },
    );
    res.json({
      message: status === "verified" ? "Đã duyệt." : "Đã từ chối.",
      data,
    });
  } catch (err) {
    handleError(res, err, "verifyStudent");
  }
}

export async function listFeedbacks(req, res) {
  try {
    const data = await userFeedbackService.listFeedbacks({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err, "listFeedbacks");
  }
}

export async function updateFeedbackStatus(req, res) {
  try {
    const data = await userFeedbackService.updateFeedbackStatus(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.json({ message: "Đã cập nhật.", data });
  } catch (err) {
    handleError(res, err, "updateFeedbackStatus");
  }
}
