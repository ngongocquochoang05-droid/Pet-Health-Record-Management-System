// Service xử lý logic nghiệp vụ cho dịch vụ
const Service = require('../models/service');

class ServiceService {
  // Lấy tất cả dịch vụ
  async getAllServices() {
    return await Service.find();
  }

  // Lấy dịch vụ theo ID
  async getServiceById(id) {
    return await Service.findById(id);
  }

  // Tạo dịch vụ mới
  async createService(data) {
    const service = new Service(data);
    return await service.save();
  }

  // Cập nhật dịch vụ
  async updateService(id, data) {
    return await Service.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa dịch vụ
  async deleteService(id) {
    return await Service.findByIdAndDelete(id);
  }
}

module.exports = new ServiceService();