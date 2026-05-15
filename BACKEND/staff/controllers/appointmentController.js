// Controller xử lý request/response cho lịch hẹn
const appointmentService = require('../services/appointmentService');

class AppointmentController {
  // Lấy danh sách tất cả lịch hẹn
  async getAllAppointments(req, res) {
    try {
      const appointments = await appointmentService.getAllAppointments();
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin lịch hẹn theo ID
  async getAppointmentById(req, res) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy lịch hẹn theo ngày
  async getAppointmentsByDate(req, res) {
    try {
      const appointments = await appointmentService.getAppointmentsByDate(req.params.date);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo lịch hẹn mới
  async createAppointment(req, res) {
    try {
      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật lịch hẹn
  async updateAppointment(req, res) {
    try {
      const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.status(200).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa lịch hẹn
  async deleteAppointment(req, res) {
    try {
      const appointment = await appointmentService.deleteAppointment(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.status(200).json({ message: 'Appointment deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Xác nhận lịch hẹn
  async confirmAppointment(req, res) {
    try {
      const appointment = await appointmentService.confirmAppointment(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.status(200).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Hoàn thành lịch hẹn
  async completeAppointment(req, res) {
    try {
      const appointment = await appointmentService.completeAppointment(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      res.status(200).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AppointmentController();