// Service xử lý logic nghiệp vụ cho sản phẩm
const Product = require('../models/product');

class ProductService {
  // Lấy tất cả sản phẩm
  async getAllProducts() {
    return await Product.find();
  }

  // Lấy sản phẩm theo ID
  async getProductById(id) {
    return await Product.findById(id);
  }

  // Tạo sản phẩm mới
  async createProduct(data) {
    const product = new Product(data);
    return await product.save();
  }

  // Cập nhật sản phẩm
  async updateProduct(id, data) {
    return await Product.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa sản phẩm
  async deleteProduct(id) {
    return await Product.findByIdAndDelete(id);
  }

  // Cập nhật tồn kho sản phẩm
  async updateStock(id, stock) {
    return await Product.findByIdAndUpdate(id, { stock }, { new: true });
  }
}

module.exports = new ProductService();