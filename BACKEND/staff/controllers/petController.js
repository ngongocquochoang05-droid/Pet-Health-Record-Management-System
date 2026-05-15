// Controller xử lý request/response cho thú cưng
const petService = require('../services/petService');

class PetController {
  // Lấy danh sách tất cả thú cưng
  async getAllPets(req, res) {
    try {
      const pets = await petService.getAllPets();
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thông tin thú cưng theo ID
  async getPetById(req, res) {
    try {
      const pet = await petService.getPetById(req.params.id);
      if (!pet) return res.status(404).json({ message: 'Pet not found' });
      res.status(200).json(pet);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy thú cưng theo chủ sở hữu
  async getPetsByOwner(req, res) {
    try {
      const pets = await petService.getPetsByOwner(req.params.ownerId);
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tạo hồ sơ thú cưng mới
  async createPet(req, res) {
    try {
      const pet = await petService.createPet(req.body);
      res.status(201).json(pet);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cập nhật hồ sơ thú cưng
  async updatePet(req, res) {
    try {
      const pet = await petService.updatePet(req.params.id, req.body);
      if (!pet) return res.status(404).json({ message: 'Pet not found' });
      res.status(200).json(pet);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Xóa hồ sơ thú cưng
  async deletePet(req, res) {
    try {
      const pet = await petService.deletePet(req.params.id);
      if (!pet) return res.status(404).json({ message: 'Pet not found' });
      res.status(200).json({ message: 'Pet deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PetController();