const pug = require('pug');
// console.log('pug :', pug);
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    const templatePath = path.join(
      __dirname,
      `../views/${options.template}.pug`
    );
    const html = pug.renderFile(templatePath, options.data);

    const msg = {
      to: options.email,
      from: 'traanagaayi@gmail.com',
      subject: options.subject,
      html,
    };

    await sgMail.send(msg);
    console.log('email sent successfully to : ', options.email);
  } catch (error) {
    console.log(
      'error sending message :',
      error.response ? error.response.body : error.message
    );
  }
};

module.exports = sendEmail;
