// Routes định nghĩa các endpoint API cho nhân viên cửa hàng
const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const petController = require('../controllers/petController');
const appointmentController = require('../controllers/appointmentController');
const serviceController = require('../controllers/serviceController');
const paymentController = require('../controllers/paymentController');
const productController = require('../controllers/productController');

// Routes cho khách hàng
router.get('/customers', customerController.getAllCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.post('/customers', customerController.createCustomer);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

// Routes cho thú cưng
router.get('/pets', petController.getAllPets);
router.get('/pets/:id', petController.getPetById);
router.get('/customers/:ownerId/pets', petController.getPetsByOwner);
router.post('/pets', petController.createPet);
router.put('/pets/:id', petController.updatePet);
router.delete('/pets/:id', petController.deletePet);

// Routes cho lịch hẹn
router.get('/appointments', appointmentController.getAllAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentById);
router.get('/appointments/date/:date', appointmentController.getAppointmentsByDate);
router.post('/appointments', appointmentController.createAppointment);
router.put('/appointments/:id', appointmentController.updateAppointment);
router.delete('/appointments/:id', appointmentController.deleteAppointment);
router.patch('/appointments/:id/confirm', appointmentController.confirmAppointment);
router.patch('/appointments/:id/complete', appointmentController.completeAppointment);

// Routes cho dịch vụ
router.get('/services', serviceController.getAllServices);
router.get('/services/:id', serviceController.getServiceById);
router.post('/services', serviceController.createService);
router.put('/services/:id', serviceController.updateService);
router.delete('/services/:id', serviceController.deleteService);

// Routes cho thanh toán
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/:id', paymentController.getPaymentById);
router.get('/appointments/:appointmentId/payments', paymentController.getPaymentsByAppointment);
router.post('/payments', paymentController.createPayment);
router.put('/payments/:id', paymentController.updatePayment);
router.delete('/payments/:id', paymentController.deletePayment);
router.patch('/payments/:id/pay', paymentController.markAsPaid);

// Routes cho sản phẩm
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.patch('/products/:id/stock', productController.updateStock);

module.exports = router;