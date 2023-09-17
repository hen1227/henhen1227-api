import nodemailer from 'nodemailer';

const EMAIL_ADDRESS = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD
    }
});

export const sendEmail = async (to, subject, body, isHTML = false) => {
    try {
        let mailOptions;

        if (isHTML) {
            mailOptions = {
                from: EMAIL_ADDRESS,
                to: to,
                subject: subject,
                html: body
            };
        } else {
            mailOptions = {
                from: EMAIL_ADDRESS,
                to: to,
                subject: subject,
                text: body
            };
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                throw error;
            } else {
                console.log('Email sent:', info.response);
                return info.response;
            }
        });
    } catch (error) {
        console.error('Error in sendEmail:', error);
        throw error;
    }
}
