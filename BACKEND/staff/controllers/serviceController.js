// Controller xử lý request/response cho dịch vụ
const serviceService = require('../services/serviceService');

class ServiceController {
  // Lấy danh sách tất cả dịch vụ
  async getAllServices(req, res) {
    try {
      const services = await serviceService.getAllServices();
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin dịch vụ theo ID
  async getServiceById(req, res) {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo dịch vụ mới
  async createService(req, res) {
    try {
      const service = await serviceService.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật dịch vụ
  async updateService(req, res) {
    try {
      const service = await serviceService.updateService(req.params.id, req.body);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      res.status(200).json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa dịch vụ
  async deleteService(req, res) {
    try {
      const service = await serviceService.deleteService(req.params.id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      res.status(200).json({ message: 'Service deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ServiceController();