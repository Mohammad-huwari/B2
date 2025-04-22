const User = require('../models/userModel');
const authController = require('../controllers/authController');
const Course = require('../models/courseModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'sucess',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    '-_id -__v -updatedAt -role '
  );

  if (!user) {
    return next(new AppError('No user found with this id', 404));
  }

  res.status(200).json({
    status: 'sucess',
    data: {
      user,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('name email -_id');

  if (!user) {
    return next(new AppError('No user found with this id ', 404));
  }

  res.status(200).json({
    status: 'sucess',
    data: {
      user,
    },
  });
});

// exports.updateUser = catchAsync(async (req, res, next) => {
//   if (req.body.password || req.body.passwordConfirm) {
//     return next(new AppError('This route not for update password', 400));
//     console.log(req.user.id);

//     const updateUser = await User.findByIdAndUpdate(req.user.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         user: updateUser,
//       },
//     });
//   }
// });

// exports.deleteUSer = catchAsync(async (req, res, next) => {
//   const user = await User.findByIdAndDelete(req.params.id);

//   if (!user) {
//     return next(new AppError('NO user found with this id', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
