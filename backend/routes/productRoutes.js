const express = require('express');
const {
  createProduct,
  getVendorProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getAvailableInventoryItems,
  // Admin functions
  approveProduct,
  rejectProduct,
  getAllProductsForAdmin
} = require('../controllers/productController');
const { authenticateToken, requireVendorRole, requireAdminRole } = require('../middleware/auth');

const router = express.Router();

// Admin routes (no vendor role required)
router.get('/admin/all', authenticateToken, requireAdminRole, getAllProductsForAdmin);
router.put('/:id/approve', authenticateToken, requireAdminRole, approveProduct);
router.put('/:id/reject', authenticateToken, requireAdminRole, rejectProduct);

// Vendor routes (require vendor authentication)
router.use(authenticateToken);
router.use(requireVendorRole);

// Product statistics
router.get('/stats', getProductStats);

// Get available inventory items for product creation
router.get('/available-inventory', getAvailableInventoryItems);

// CRUD operations
router.post('/', createProduct);
router.get('/', getVendorProducts);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;