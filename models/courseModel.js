const mongoose = require('mongoose');
const validator = require('validator');

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    filename: String,
    bucketname: { type: String, required: false },
    url: { type: String, required: true },
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videos: [VideoSchema],
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'course must have a title'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, ' course must have a description '],
  },
  price: {
    type: Number,
    required: [true, 'course must have a price'],
    min: [0, 'price must be a positive number '],
  },
  duration: {
    type: Number,
    required: [true, 'course must have a duration '],
    min: [1, 'duration must be at least 1 hour'],
  },
  purchasedBy: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String, required: true },
    },
  ],
  sections: [sectionSchema],
  googleProductId: {
    type: String,
    required: true,
  },
  appleProductId: {
    type: String,
    required: true,
  },
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
