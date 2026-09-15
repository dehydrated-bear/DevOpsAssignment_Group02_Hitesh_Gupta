const { Router } = require('express');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getMe
} = require('../controllers/userController');

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.use(protect);

router.get('/me', getMe);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);

module.exports = router;