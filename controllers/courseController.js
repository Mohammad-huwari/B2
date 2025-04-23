const Course = require('../models/courseModel');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/AppError');
const User = require('./../models/userModel.js');
const mongoose = require('mongoose');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: `https://${process.env.AWS_REGION}.digitaloceanspaces.com`, 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


const getSignedVideoUrl = async (videoKey) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME, 
    Key: videoKey, // 
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); 
  return signedUrl;
};


exports.createCourse = catchAsync(async (req, res, next) => {
  const newCoures = await Course.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      course: newCoures,
    },
  });
});

exports.getcourses = catchAsync(async (req, res, next) => {
  const course = await Course.findOne();

  if (!course) {
    return next(new AppError('No course found', 404));
  }

  // console.log('req.user.id : ', req.user.id);

  
  const hasPurchased =
    req.user &&
    course.purchasedBy.some(
      (user) => user._id.toString() === req.user.id.toString()
    );

  course.sections.forEach((section) => {
    if (section.videos && Array.isArray(section.videos)) {
      section.videos.forEach((video) => {
        
        video.bucketname = undefined;

        
        if (!hasPurchased) {
          video.url = undefined;
        }
      });
    }
  });

  course.purchasedBy = undefined;
  //course.sections.videos.bucketname = undefined;

  res.status(200).json({
    status: 'success',
    data: { course },
  });
});

exports.updatCourses = catchAsync(async (req, res, next) => {
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCourse) {
    return next(new AppError('No course found with that id '));
  }

  res.status(200).json({
    status: 'success',
    data: {
      cousrse: updatedCourse,
    },
  });
});

exports.buyCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError('Invalid course id', 400));
  }
  const course = await Course.findById(courseId);

  if (!course) {
    return next(new AppError('No course Available !', 404));
  }

  const hasPurchased =
    req.user &&
    course.purchasedBy.some(
      (user) => user._id.toString() === req.user.id.toString()
    );

  if (hasPurchased) {
    return next(new AppError('you already bought this !'));
  }

  course.purchasedBy.push({ _id: req.user.id, email: req.user.email });
  await course.save();

  await sendEmail({
    email: req.user.email,
    name: req.user.name,
    subject: 'Congratulations for joining the Course',
    template: 'coursePurchase',
    data: { name: req.user.name },
  });

  res.status(200).json({
    status: 'success',
    message: 'course purchased successfully',
    data: {
      course,
    },
  });
});

exports.streamVideo = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const videoId = req.params.videoId;

  
  const course = await Course.findOne({
    sections: { $elemMatch: { videos: { $elemMatch: { _id: videoId } } } },
  }); 

  if (!course) {
    return next(new AppError('Video not found in any course!', 404));
  }


  const hasPurchased = course.purchasedBy.some(
    (user) => user.id.toString() === userId.toString()
  );

  if (!hasPurchased) {
    return next(
      new AppError('You must purchase the course to watch this video.', 403)
    );
  }

  
  const video = course.sections
    .flatMap((section) => section.videos)
    .find((vid) => vid._id.toString() === videoId);

  if (!video) {
    return next(new AppError('Video not found!', 404));
  }

  // decodedFilename = decodedURIComponent(videos.url)
  try {
    // 
    const command = new GetObjectCommand({
      Bucket: video.bucketname || process.env.AWS_BUCKET_NAME, 
      Key: video.url.split('/').pop(), 
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); 

    res.status(200).json({
      success: true,
      videoUrl: signedUrl,
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return next(new AppError('Error generating video URL.', 500));
  }
});
