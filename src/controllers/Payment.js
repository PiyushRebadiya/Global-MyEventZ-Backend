const Razorpay = require("razorpay");
const { errorMessage, checkKeysAndRequireValues } = require("../common/main");
const { pool } = require("../sql/connectToDatabase");

const getPaymentDetails = async (req, res) => {
    try {
        const { PaymentID } = req.query
        const missingKey = checkKeysAndRequireValues(['PaymentID'], req.query)
        if (missingKey.length > 0) {
            return res.status(400).send(errorMessage(`${missingKey} is required`))
        }
        const razorpayQuery = await pool.query('SELECT * FROM RazorpayCredentials')
        if(!razorpayQuery?.recordset?.length){
            return res.status(404).send(errorMessage('Razorpay credentials not found'))
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0]
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        })

        const response = await razorpay.payments.fetch(PaymentID);
        if(!response){
            return res.status(404).send(errorMessage('Payment not found'))
        }

        return res.status(200).json({ Success: true, data: response });
    } catch (error) {
        console.log('error :', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
};

const createPayment = async (req, res) => {
    try {
        const { Amount } = req.body
        const missingKey = checkKeysAndRequireValues(['Amount'], req.body)
        if (missingKey.length > 0) {
            return res.status(400).send(errorMessage(`${missingKey} is required`))
        }
        const razorpayQuery = await pool.query('SELECT * FROM RazorpayCredentials')
        if(!razorpayQuery?.recordset?.length){
            return res.status(404).send(errorMessage('Razorpay credentials not found'))
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0]
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        })
        const response = await razorpay.orders.create({
            amount: Amount * 100,
            currency: 'INR',
        })
        return res.status(200).json({ Success: true, data: response });
    } catch (error) {   
        console.log('error :', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
}  

const capturePayment = async (req, res) => {
    try {
        const { PaymentId, Amount } = req.body;
        const missingKeys = checkKeysAndRequireValues(['PaymentId', 'Amount'], req.body);
        if (missingKeys.length > 0) {
            return res.status(400).send(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        const razorpayQuery = await pool.query('SELECT * FROM RazorpayCredentials');
        if (!razorpayQuery?.recordset?.length) {
            return res.status(404).send(errorMessage('Razorpay credentials not found'));
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0];
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey,
        });

        // Capturing payment
        const response = await razorpay.payments.capture(PaymentId, Amount * 100, 'INR');
        return res.status(200).json({ Success: true, data: response });
    } catch (error) {
        console.log('error :', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
};


const getAllPayments = async (req, res) => {
    try {
        const razorpayQuery = await pool.query('SELECT * FROM RazorpayCredentials')
        if(!razorpayQuery?.recordset?.length){
            return res.status(404).send(errorMessage('Razorpay credentials not found'))
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0]
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        })

        // const allPaymentList = await razorpay.payments.all({ count: 100, skip: 0 });
        let allPayments = [];
        let skip = 0;
        const count = 100; // Max number of records to fetch per request

        while (true) {
            const response = await razorpay.payments.all({ count, skip });
            allPayments = allPayments.concat(response.items);

            // If the number of payments returned is less than the count, we've retrieved all available records
            if (response.items.length < count) {
                break;
            }

            skip += count; // Move to the next set of records
        }

        if(!allPayments?.length){
            return res.status(404).send(errorMessage('No payments found'))
        }
        return res.status(200).json({ Success: true, data: allPayments, count: allPayments.length });
    } catch (error) {
        console.log('error :', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
}

module.exports = { getPaymentDetails, createPayment, getAllPayments, capturePayment };