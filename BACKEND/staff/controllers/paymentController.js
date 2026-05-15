// Controller xử lý request/response cho thanh toán
const paymentService = require('../services/paymentService');

class PaymentController {
  // Lấy danh sách tất cả thanh toán
  async getAllPayments(req, res) {
    try {
      const payments = await paymentService.getAllPayments();
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin thanh toán theo ID
  async getPaymentById(req, res) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thanh toán theo lịch hẹn
  async getPaymentsByAppointment(req, res) {
    try {
      const payments = await paymentService.getPaymentsByAppointment(req.params.appointmentId);
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo thanh toán mới
  async createPayment(req, res) {
    try {
      const payment = await paymentService.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật thanh toán
  async updatePayment(req, res) {
    try {
      const payment = await paymentService.updatePayment(req.params.id, req.body);
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa thanh toán
  async deletePayment(req, res) {
    try {
      const payment = await paymentService.deletePayment(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json({ message: 'Payment deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Đánh dấu thanh toán đã hoàn thành
  async markAsPaid(req, res) {
    try {
      const payment = await paymentService.markAsPaid(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new PaymentController();