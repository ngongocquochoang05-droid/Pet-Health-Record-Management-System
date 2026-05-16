// Service xử lý logic nghiệp vụ cho lịch hẹn
const Appointment = require('../models/appointment');

class AppointmentService {
  // Lấy tất cả lịch hẹn
  async getAllAppointments() {
    return await Appointment.find().populate('customer pet service staff');
  }

  // Lấy lịch hẹn theo ID
  async getAppointmentById(id) {
    return await Appointment.findById(id).populate('customer pet service staff');
  }

  // Lấy lịch hẹn theo ngày
  async getAppointmentsByDate(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return await Appointment.find({ date: { $gte: start, $lte: end } }).populate('customer pet service');
  }

  // Tạo lịch hẹn mới
  async createAppointment(data) {
    const appointment = new Appointment(data);
    return await appointment.save();
  }

  // Cập nhật lịch hẹn
  async updateAppointment(id, data) {
    return await Appointment.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa lịch hẹn
  async deleteAppointment(id) {
    return await Appointment.findByIdAndDelete(id);
  }

  // Xác nhận lịch hẹn
  async confirmAppointment(id) {
    return await Appointment.findByIdAndUpdate(id, { status: 'confirmed' }, { new: true });
  }

  // Hoàn thành lịch hẹn
  async completeAppointment(id) {
    return await Appointment.findByIdAndUpdate(id, { status: 'completed' }, { new: true });
  }
}

module.exports = new AppointmentService();