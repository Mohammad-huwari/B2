const { promises } = require('nodemailer/lib/xoauth2');
require('dotenv').config();
const axios = require('axios');

const kickbox = require('kickbox')
  .client(process.env.KICKBOX_API_KEY)
  .kickbox();

const verifyEmail = async (email) => {
  try {
    const API_KEY = process.env.KICKBOX_API_KEY;
    const response = await axios.get(
      `https://api.kickbox.com/v2/verify?email=${email}&apikey=${API_KEY}`
    );
    //console.log('kick rsponse : ', response.data);
    return response.data.result === 'deliverable';
  } catch (error) {
    console.error('kickbox API Error : ', error.message);
    return false;
  }
};

module.exports = verifyEmail;
