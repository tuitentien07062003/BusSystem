import * as ticketService from "../services/ticketService.js";
import * as studentService from "../services/studentVerificationService.js";
import * as payosService from "../services/payosService.js";

function handleError(res, err, context) {
  console.error(`[ticketController.${context}]`, err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
}

export async function submitStudentVerify(req, res) {
  try {
    const data = await studentService.submitVerification(req.user.id, req.body);
    res.status(201).json({ message: "Đã gửi yêu cầu xác minh.", data });
  } catch (err) {
    handleError(res, err, "submitStudentVerify");
  }
}

export async function getMyStudentVerify(req, res) {
  try {
    const data = await studentService.getMyVerification(req.user.id);
    res.json({ data });
  } catch (err) {
    handleError(res, err, "getMyStudentVerify");
  }
}

export async function checkEligibility(req, res) {
  try {
    const data = await studentService.checkStudentEligibility(req.user.id);
    res.json(data);
  } catch (err) {
    handleError(res, err, "checkEligibility");
  }
}

export async function purchaseTicket(req, res) {
  try {
    const data = await ticketService.purchaseTicket(req.user.id, req.body);
    res.status(201).json({ message: "Mua vé thành công.", data });
  } catch (err) {
    handleError(res, err, "purchaseTicket");
  }
}

export async function listMyTickets(req, res) {
  try {
    const data = await ticketService.listMyTickets(req.user.id, {
      status: req.query.status,
    });
    res.json({ data });
  } catch (err) {
    handleError(res, err, "listMyTickets");
  }
}

export async function getTicketDetail(req, res) {
  try {
    const data = await ticketService.getTicketDetail(
      req.user.id,
      req.params.id,
    );
    res.json(data);
  } catch (err) {
    handleError(res, err, "getTicketDetail");
  }
}

export async function cancelTicket(req, res) {
  try {
    const data = await ticketService.cancelTicket(req.user.id, req.params.id);
    res.json({ message: "Đã hủy vé.", data });
  } catch (err) {
    handleError(res, err, "cancelTicket");
  }
}

export async function verifyQr(req, res) {
  try {
    const data = await ticketService.verifyQr(req.user.id, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err, "verifyQr");
  }
}

export async function payosCheckout(req, res) {
  try {
    const { ticket_type, is_student } = req.body;

    if (!ticket_type) {
      return res.status(400).json({ error: "Thiếu ticket_type." });
    }

    const data = await payosService.createPaymentLink({
      userId: req.user.id,
      ticketType: ticket_type,
      isStudent: !!is_student,
    });

    res.json(data);
  } catch (err) {
    console.error("[payosCheckout]", err);
    res.status(err.status || 500).json({
      error: err.message || "Không tạo được thanh toán.",
    });
  }
}

export async function payosPoll(req, res) {
  try {
    const { order_code } = req.body;

    if (!order_code) {
      return res.status(400).json({ error: "Thiếu order_code." });
    }

    const ticket = await payosService.confirmFromPayos(Number(order_code));

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền truy cập." });
    }

    res.json({
      status: ticket.payment_status,
      ticket:
        ticket.payment_status === "paid"
          ? {
              id: ticket.id,
              ticket_type: ticket.ticket_type,
              remaining_uses: ticket.remaining_uses,
              expires_at: ticket.expires_at,
              paid_at: ticket.paid_at,
            }
          : null,
    });
  } catch (err) {
    console.error("[payosPoll]", err);
    res.status(err.status || 500).json({
      error: err.message || "Không kiểm tra được trạng thái.",
    });
  }
}

export async function payosCancel(req, res) {
  try {
    const { order_code, reason } = req.body;

    if (!order_code) {
      return res.status(400).json({ error: "Thiếu order_code." });
    }

    const ticket = await payosService.cancelPayment(
      Number(order_code),
      reason || "User cancelled",
    );

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền truy cập." });
    }

    res.json({ message: "Đã huỷ giao dịch.", status: ticket.payment_status });
  } catch (err) {
    console.error("[payosCancel]", err);
    res.status(err.status || 500).json({
      error: err.message || "Huỷ thất bại.",
    });
  }
}
