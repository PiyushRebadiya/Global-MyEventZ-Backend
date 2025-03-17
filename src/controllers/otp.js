const { successMessage, checkKeysAndRequireValues, errorMessage } = require('../common/main');
const { pool } = require('../sql/connectToDatabase');

const sentMobileOTPMsg = async (RegisterMobile, otp) => {
    try {
        const mobile = `${RegisterMobile}`
        const message = `Your%20OTP%20is%20${otp}%20for%20Monarch%20MyTaxReport%20Application.%20-%20MONARCH`
        const urlData = await pool.query(`SELECT * FROM MobSMSMast WHERE IsActive = 1`);
        let otpURL = '';
        if (urlData?.rowsAffected?.length > 0) {
            otpURL = urlData.recordset[0].BaseUrl;
            otpURL = otpURL.replace('#Mobile#', mobile);
            otpURL = otpURL.replace('#Message#', message);
        } else {
            return false;
        }
        const result = await fetch(otpURL, {
            method: 'GET'
        })
        if (result.status === 200 && result.statusText === 'OK') {
            return true;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

const otpVerificationHandler = async (req, res) => {
    try {
        const { Mobile } = req.body;
        const missingKeys = checkKeysAndRequireValues(['Mobile'], { ...req.body })
        if (missingKeys.length > 0) {
            return res.status(200).send(errorMessage(`Missing required fields: ${missingKeys.join(', ')}`));
        }
        if (Mobile.length !== 12 || Mobile.slice(0, 2) !== '91') {
            return res.status(200).send(errorMessage("Invalid Mobile Number!"));
        }
        const otp = Math.random().toString().substr(2, 6);
        const sentMail = await sentMobileOTPMsg(Mobile.slice(2), otp);
        if (sentMail) {
            res.json({ ...successMessage("Message sent successfully!"), verify: Buffer.from(otp).toString('base64') });
        } else {
            res.json({ ...errorMessage("Message not sent successfully!") });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(errorMessage(error?.message));
    }
}

module.exports = {
    otpVerificationHandler
}
