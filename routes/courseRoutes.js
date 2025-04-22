const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { streamVideo } = require('../controllers/courseController');

const router = express.Router();

router.get('/streamVideo/:videoId', authController.protect, streamVideo);

router.route('/createCourse').post(courseController.createCourse);

router
  .route('/getCourse')
  .get(authController.protect, courseController.getcourses);

router.route('/:id').patch(courseController.updatCourses);

router
  .route('/:courseId/purchase')
  .patch(authController.protect, courseController.buyCourse);

module.exports = router;
