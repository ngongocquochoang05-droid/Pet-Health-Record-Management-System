// Controller xử lý request/response cho khách hàng
const customerService = require('../services/customerService');

class CustomerController {
  // Lấy danh sách tất cả khách hàng
  async getAllCustomers(req, res) {
    try {
      const customers = await customerService.getAllCustomers();
      res.status(200).json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin khách hàng theo ID
  async getCustomerById(req, res) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.status(200).json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo khách hàng mới
  async createCustomer(req, res) {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật thông tin khách hàng
  async updateCustomer(req, res) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.status(200).json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa khách hàng
  async deleteCustomer(req, res) {
    try {
      const customer = await customerService.deleteCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.status(200).json({ message: 'Customer deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CustomerController();