const { Router } = require('express');
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getStats,
  getDueSoon
} = require('../controllers/taskController');

const router = Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.get('/stats', getStats);
router.get('/due-soon', getDueSoon);

router.route('/:id')
  .get(getTask)
  .patch(updateTask)
  .delete(deleteTask);

router.patch('/:id/complete', completeTask);

module.exports = router;