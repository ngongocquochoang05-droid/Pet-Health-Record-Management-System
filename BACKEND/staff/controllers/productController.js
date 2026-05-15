// Controller xử lý request/response cho sản phẩm
const productService = require('../services/productService');

class ProductController {
  // Lấy danh sách tất cả sản phẩm
  async getAllProducts(req, res) {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin sản phẩm theo ID
  async getProductById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo sản phẩm mới
  async createProduct(req, res) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật sản phẩm
  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa sản phẩm
  async deleteProduct(req, res) {
    try {
      const product = await productService.deleteProduct(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Cập nhật tồn kho sản phẩm
  async updateStock(req, res) {
    try {
      const product = await productService.updateStock(req.params.id, req.body.stock);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();