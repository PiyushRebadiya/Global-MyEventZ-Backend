// const { pool } = require("mssql");
const { sendMail } = require("../common/mail");
// const { checkKeysAndRequireValues, successMessage, errorMessage } = require("../common/main");

const verifyMobileNumber = (mobileNumber) => {
    // Check if the mobile number is a string and has a length of 10
    if (mobileNumber?.length === 12 || mobileNumber?.length === 10) {
        return mobileNumber;
    }
    return null;
};

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
                                <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hello ${OrganizerName},</h1>
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
                                <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendOrganizerRegisterHindiMail = async (Email, OrganizerName) => {
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
                                <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">नमस्ते ${OrganizerName},</h1>
                                हमें खुशी है कि आप हमारे साथ हैं। योजना बनाने से लेकर प्रबंधन तक, हम इवेंट आयोजित करना आसान, सहज और तनावमुक्त बनाते हैं।<br><br>
                                आज ही शुरुआत करें और देखें कि अपने विचारों को साकार करना कितना आसान है! 🚀<br>
                                और अगर आपको कभी सहायता की ज़रूरत हो, तो हमारी टीम हमेशा मदद के लिए तैयार है।<br><br>
                                MyEventz टीम<br>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, सर्वाधिकार सुरक्षित।</p>
                                <p style="font-size: 14px; color: #777777; margin: 0;">एप्लिकेशन डेवलपर: Taxfile Invosoft Pvt Ltd</p>
                                <p style="font-size: 14px; color: #777777; margin: 0;">किसी भी प्रश्न के लिए, कृपया हमें संपर्क करें: +91 95101 56789</p>
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
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailUserTickets = async (Email = '', UserName = '', EventName = '', StartEventDate = '', address = '', ticketReport = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
        
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
        
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                        <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
        
                                        🎫 <strong>Your Ticket:</strong> <a href=${ticketReport} style="color: #1a73e8; text-decoration: none;">Click here</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailOrganizerEventTemplate1 = async (Email = '', UserName = '', EventName = '', StartEventDate = '', StartEventTime = '', address = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
       
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Invitation</title>
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
                                        You're Invited! 🎉<br><br>
                                        <strong>${EventName}</strong> is happening soon!<br><br>
                                        🗓️ <strong>Date:</strong> ${StartEventDate}<br><br>
                                        📍 <strong>Location:</strong> ${address}<br><br>
                                        ⏰ <strong>Time:</strong> ${StartEventTime}<br><br>
                                        Let us know if you’ll be joining. We can’t wait to welcome you! 😊<br><br>
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                                <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
        if (sentMail) {
            console.log('Email sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailOrganizerEventTemplate2 = async (Email = '', UserName = '', EventName = '', StartEventDate = '', StartEventTime = '', address = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
       
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Invitation</title>
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
                                    <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hi ${UserName},</h1>
                                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0;">
                                        Don’t miss our upcoming event – <strong>${EventName}</strong>! ✨<br><br>
                                        🗓️ <strong>Date:</strong> ${StartEventDate}<br><br>
                                        📍 <strong>Location:</strong> ${address}<br><br>
                                        🕒 <strong>Time:</strong> ${StartEventTime}<br><br>
                                        Let us know if you’ll be joining. We can’t wait to welcome you! 😊<br><br>
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                                <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
        if (sentMail) {
            console.log('Email sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailOrganizerEventTemplate3 = async (Email = '', UserName = '', EventName = '', StartEventDate = '', StartEventTime = '', address = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
       
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Invitation</title>
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
                                    <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Dear ${UserName},</h1>
                                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0;">
                                        Get ready for <strong>${EventName}</strong>! 🎊<br><br>
                                        🗓️ <strong>Date:</strong> ${StartEventDate}<br><br>
                                        📍 <strong>Location:</strong> ${address}<br><br>
                                        ⏰ <strong>Time:</strong> ${StartEventTime}<br><br>
                                        Your presence will make it special. Please confirm your attendance! 😊<br><br>
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                                <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
        if (sentMail) {
            console.log('Email sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailOrganizerEventTemplate4 = async (Email = '', UserName = '', EventName = '', StartEventDate = '', StartEventTime = '', address = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
       
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Invitation</title>
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
                                        We’re thrilled to invite you to <strong>${EventName}</strong>! 🥳<br><br>
                                        🗓️ <strong>Date:</strong> ${StartEventDate}<br><br>
                                        📍 <strong>Location:</strong> ${address}<br><br>
                                        🕓 <strong>Time:</strong> ${StartEventTime}<br><br>
                                        Let us know you’re coming. We’d love to have you there! 🤗<br><br>
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                                <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
        if (sentMail) {
            console.log('Email sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

const sendEmailOrganizerEventTemplate5 = async (Email = '', UserName = '', EventName = '', StartEventDate = '', StartEventTime = '', address = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
       
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Invitation</title>
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
                                    <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hey ${UserName},</h1>
                                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0;">
                                        Mark your calendar for <strong>${EventName}</strong>! 🥳<br><br>
                                        🗓️ <strong>Date:</strong> ${StartEventDate}<br><br>
                                        📍 <strong>Location:</strong> ${address}<br><br>
                                        ⏰ <strong>Time:</strong> ${StartEventTime}<br><br>
                                        Let us know you’re coming. We’d love to have you there! 🤗<br><br>
                                        If you need any further information, feel free contact to organizer: ${OrganizerName} 😊<br><br>

                                                <strong>For any queries, please contact:</strong> ${allMobiles}<br><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, All rights reserved.</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">Application by Taxfile Invosoft Pvt Ltd.</p>
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
        if (sentMail) {
            console.log('Email sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

// Store all functions in an array
const sendEmailOrganizerEventTemplatesArray = [
    sendEmailOrganizerEventTemplate1,
    sendEmailOrganizerEventTemplate2,
    sendEmailOrganizerEventTemplate3,
    sendEmailOrganizerEventTemplate4,
    sendEmailOrganizerEventTemplate5,
  ];

const sendEmailUserTicketsHindi = async (Email = '', UserName = '', EventName = '', StartEventDate = '', address = '', ticketReport = '', Mobile1 = '', Mobile2 = '', OrganizerName = '') => {
    try {
        const allMobiles = [verifyMobileNumber(Mobile1), verifyMobileNumber(Mobile2)].filter(mobile => mobile !== null && mobile !== undefined && mobile !== '').map(mobile => `+${mobile}`).join(', ');
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
        
                                        अगर आपको किसी और जानकारी की ज़रूरत हो, तो बेझिझक आयोजक को संपर्क करें: ${OrganizerName} 😊<br><br>

                                        <strong>किसी भी प्रश्न के लिए, कृपया संपर्क करें:</strong> ${allMobiles}<br><br>
        
                                        🎫 <strong>टिकट रिपोर्ट:</strong> <a href=${ticketReport} style="color: #1a73e8; text-decoration: none;">यहां क्लिक करें</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #f4f4f4;">
                                    <p style="font-size: 14px; color: #777777; margin: 0;">&copy; 2025 MyEventz, सर्वाधिकार सुरक्षित।</p>
                                    <p style="font-size: 14px; color: #777777; margin: 0;">एप्लिकेशन डेवलपर: Taxfile Invosoft Pvt Ltd.</p>
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
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

module.exports = {
    sendOrganizerRegisterMail,
    sendOrganizerRegisterHindiMail,
    sendEmailUserTickets,
    sendEmailUserTicketsHindi,
    sendEmailOrganizerEventTemplatesArray
};