// Service xử lý logic nghiệp vụ cho thanh toán
const Payment = require('../models/payment');

class PaymentService {
  // Lấy tất cả thanh toán
  async getAllPayments() {
    return await Payment.find().populate('appointment');
  }

  // Lấy thanh toán theo ID
  async getPaymentById(id) {
    return await Payment.findById(id).populate('appointment');
  }

  // Lấy thanh toán theo lịch hẹn
  async getPaymentsByAppointment(appointmentId) {
    return await Payment.find({ appointment: appointmentId });
  }

  // Tạo thanh toán mới
  async createPayment(data) {
    const payment = new Payment(data);
    return await payment.save();
  }

  // Cập nhật thanh toán
  async updatePayment(id, data) {
    return await Payment.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa thanh toán
  async deletePayment(id) {
    return await Payment.findByIdAndDelete(id);
  }

  // Đánh dấu thanh toán đã hoàn thành
  async markAsPaid(id) {
    return await Payment.findByIdAndUpdate(id, { status: 'paid', paidAt: new Date() }, { new: true });
  }
}

module.exports = new PaymentService();