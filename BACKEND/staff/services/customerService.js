// Service xử lý logic nghiệp vụ cho khách hàng
const Customer = require('../models/customer');

class CustomerService {
  // Lấy tất cả khách hàng
  async getAllCustomers() {
    return await Customer.find().populate('pets');
  }

  // Lấy khách hàng theo ID
  async getCustomerById(id) {
    return await Customer.findById(id).populate('pets');
  }

  // Tạo khách hàng mới
  async createCustomer(data) {
    const customer = new Customer(data);
    return await customer.save();
  }

  // Cập nhật thông tin khách hàng
  async updateCustomer(id, data) {
    return await Customer.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa khách hàng
  async deleteCustomer(id) {
    return await Customer.findByIdAndDelete(id);
  }
}

module.exports = new CustomerService();