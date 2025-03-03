const { successMessage, checkKeysAndRequireValues, errorMessage } = require('../common/main');

const sentMobileOTPMsg = async (RegisterMobile, otp) => {
    try {
        const mobile = `${RegisterMobile}`
        const message = `Your%20OTP%20is%20${otp}%20for%20Monarch%20MyTaxReport%20Application.%20-%20MONARCH`
        const otpURL = `http://api.smsbrain.in/1.2/appsms/send.php?user=monaapp.t&passwd=monaapp123&senderId=MONAPP&recipients=${mobile}&message=${message}`
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
            return res.status(400).send(errorMessage(`Missing required fields: ${missingKeys.join(', ')}`));
        }
        if (Mobile.length !== 10) {
            return res.status(400).send(errorMessage("Invalid Mobile Number!"));
        }
        const otp = Math.random().toString().substr(2, 6);
        const sentMail = await sentMobileOTPMsg(Mobile, otp);
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
