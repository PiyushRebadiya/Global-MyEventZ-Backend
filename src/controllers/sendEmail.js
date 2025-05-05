// const { pool } = require("mssql");
const { sendMail } = require("../common/mail");
// const { checkKeysAndRequireValues, successMessage, errorMessage } = require("../common/main");

const sendOrganizerRegisterMail = async (Email, OrganizerName) => {
    try {
        // const { Email, OrganizerName } = req.query;
        console.log('Email', Email);
        console.log('OrganizerName', OrganizerName);

        // const missingKeys = checkKeysAndRequireValues(['Email', 'OrganizerName'], req.query);
        // if (missingKeys.length > 0) {
        //     return res.status(400).send(errorMessage(`${missingKeys.join(', ')} parameters are required and must not be null or undefined`));
        // }

        // const {recordset} = await pool.request().query(`SELECT * FROM tbl_users where UserId = ${UserId}`);
        
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Email Template</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 5px; overflow: hidden;">
                        <tr>
                            <td align="center" style="padding: 20px 0; background-color: #ffd3d3;">
                                <img src="https://myeventz.in/static/media/myeventzsecond.bdc23db9122747d166bf.png" alt="Logo" style="display: block; width: 150px">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px;">
                                <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hi ${OrganizerName},</h1>
                                We’re excited to have you with us. From planning to managing, we make organizing events simple, smooth, and stress-free.<br><br>
                                Get started today and see how easy it is to bring your ideas to life! 🚀<br>
                                And if you ever need support, our team is ready to help.<br><br>
                                MyEventz Team<br>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                <p style="font-size: 14px; color: #777777; margin: 0;">Powered by Taxfile Invosoft Pvt Ltd.</p>
                                <p style="font-size: 14px; color: #777777; margin: 0;">For any queries, please contact: +91 95101 56789</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

        const sentMail = await sendMail(Email, 'Welcome to Myeventz', htmlContent);
        console.log('sentMail', sentMail);
        if (sentMail) {
            console.log('Email sent successfully');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const sendEmailUserTickets = async (Email = '', UserName = '', EventName = '', StartEventDate = '', address = '', ticketReport = '') => {
    try {
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Template</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 5px; overflow: hidden;">
                            <tr>
                                <td align="center" style="padding: 20px 0; background-color: #ffd3d3;">
                                    <img src="https://myeventz.in/static/media/myeventzsecond.bdc23db9122747d166bf.png" alt="Logo" style="display: block; width: 150px">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px;">
                                    <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hello ${UserName},</h1>
                                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0;">
                                        You have successfully purchased a ticket for our event <strong>${EventName}</strong>! 🎟️<br><br>
                                        Your ticket is confirmed, and the details are as follows:<br><br>
        
                                        <strong>Event Date:</strong> ${StartEventDate}<br>
                                        <strong>Venue:</strong> ${address} 🏢<br><br>
        
                                        If you need any further information, feel free to contact us. 😊<br><br>
        
                                        🎫 <strong>Your Ticket:</strong> <a href=${ticketReport} style="color: #1a73e8; text-decoration: none;">Click here</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Powered by Taxfile Invosoft Pvt Ltd.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">For any queries, please contact: +91 95101 56789</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const sentMail = await sendMail(Email, 'Welcome to Myeventz', htmlContent);
        console.log('sentMail', sentMail);
        if (sentMail) {
            console.log('Email sent successfully');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const sendEmailUserTicketsHindi = async (Email = '', UserName = '', EventName = '', StartEventDate = '', address = '', ticketReport = '') => {
    try {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>ईमेल टेम्पलेट</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 5px; overflow: hidden;">
                            <tr>
                                <td align="center" style="padding: 20px 0; background-color: #ffd3d3;">
                                    <img src="https://myeventz.in/static/media/myeventzsecond.bdc23db9122747d166bf.png" alt="Logo" style="display: block; width: 150px">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px;">
                                    <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">नमस्ते ${UserName},</h1>
                                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0;">
                                        आपने हमारे इवेंट <strong>${EventName}</strong> के लिए सफलतापूर्वक टिकट खरीद लिया है! 🎟️<br><br>
                                        आपका टिकट कन्फ़र्म हो गया है, और विवरण इस प्रकार है:<br><br>
        
                                        <strong>इवेंट की तारीख:</strong> ${StartEventDate}<br>
                                        <strong>स्थान:</strong> ${address} 🏢<br><br>
        
                                        अगर आपको किसी और जानकारी की ज़रूरत हो, तो बेझिझक हमसे संपर्क करें। 😊<br><br>
        
                                        🎫 <strong>टिकट रिपोर्ट:</strong> <a href=${ticketReport} style="color: #1a73e8; text-decoration: none;">यहां क्लिक करें</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, सर्वाधिकार सुरक्षित।</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">प्रायोजित: Taxfile Invosoft Pvt Ltd.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">किसी भी जानकारी के लिए संपर्क करें: +91 95101 56789</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
        
        const sentMail = await sendMail(Email, 'Welcome to Myeventz', htmlContent);
        console.log('sentMail', sentMail);
        if (sentMail) {
            console.log('Email sent successfully');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

module.exports = {
    sendOrganizerRegisterMail,
    sendEmailUserTickets,
    sendEmailUserTicketsHindi
};