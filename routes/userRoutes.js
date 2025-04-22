const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(authController.protect, userController.getAllUsers);

router.route('/:id').get(authController.protect, userController.getUser);

router.route('/getMe/:id').get(authController.protect, userController.getMe);

// router.route('/:id').patch(authController.protect, userController.updateUser);

router
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

// router
//   .route('/deleteUser/:id')
//   .delete(authController.protect, userController.deleteUSer);

module.exports = router;
