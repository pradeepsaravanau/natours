const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const path = require('path');

// new Email(user , url).sendWelecome();
// new Email(user , url).sendResetPassword();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstNmae = user.name.split(' ');
    this.url = url;
    this.from = `PradeepSaravana.U <${process.env.EMAIL_FROM}>`;
    this.user = user;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //SENDGRID
      return nodemailer.createTransport({
        service: 'SendGrid',
        //we dont need to speicfy smpt and port like we did once since nodemailer recogines sendgrid
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
      //Activate in gmail "less secure app "options
      //here we dont use gmail for production related applications
      //only we can send 500 gmails
      //other options sendgrid
      //for now we can use special development mailtrap
    });
  }

  //send the actual email
  async send(template, subject) {
    //1) render HTML based on a pug template
    //res.render('any pug template') => render function behind the scenes convert the pug template to html //not work
    //2) Define email options
    const filePath = path.join(
      __dirname,
      '..',
      'views',
      'email',
      `${template}.pug`
    );
    console.log(filePath);
    const html = pug.renderFile(filePath, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    const mailOptions = {
      from:
        process.env.NODE_ENV === 'PRODUCTION'
          ? this.from
          : process.env.SENDGRID_EMAIL_FROM,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };
    //3) create a transport and send email
    this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset url(valid for only 10 minutes)'
    );
  }

  async sendEmailConfirmation() {
    await this.send(
      'confirmEmail',
      `please confirm Email Address token is ${this.user.confirmEmailToken}`
    );
  }
};
//1) Create a transporter
//a service to send the email
//   const transporter = nodemailer.createTransport({
//     host: 'smtp.mailtrap.io',
//     port: 2525,
//     auth: {
//       user: '880787714d20d8',
//       pass: '384852df51fd64'
//     }
//   });

//3) Actually send the email
