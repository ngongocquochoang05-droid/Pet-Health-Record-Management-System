// Service xử lý logic nghiệp vụ cho thú cưng
const Pet = require('../models/pet');

class PetService {
  // Lấy tất cả thú cưng
  async getAllPets() {
    return await Pet.find().populate('owner');
  }

  // Lấy thú cưng theo ID
  async getPetById(id) {
    return await Pet.findById(id).populate('owner medicalHistory');
  }

  // Lấy thú cưng theo chủ sở hữu
  async getPetsByOwner(ownerId) {
    return await Pet.find({ owner: ownerId });
  }

  // Tạo hồ sơ thú cưng mới
  async createPet(data) {
    const pet = new Pet(data);
    return await pet.save();
  }

  // Cập nhật hồ sơ thú cưng
  async updatePet(id, data) {
    return await Pet.findByIdAndUpdate(id, data, { new: true });
  }

  // Xóa hồ sơ thú cưng
  async deletePet(id) {
    return await Pet.findByIdAndDelete(id);
  }
}

module.exports = new PetService();