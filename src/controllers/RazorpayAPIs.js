const Razorpay = require("razorpay");
const { errorMessage, checkKeysAndRequireValues, setSQLStringValue } = require("../common/main");
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

const createRazorpayOrderId = async (req, res) => {
    try {
        const { BookingAmt, OrganizerUkeyId, EventUkeyId, UserUkeyID, TotalGST, TotalConviencefee, DiscountAmt, TotalNetAmount, TotalNumberOfTicket, CouponUkeyId = '', CouponAmount } = req.body;
        
        // Check for missing required values
        const missingKey = checkKeysAndRequireValues(['BookingAmt', 'OrganizerUkeyId', 'EventUkeyId', 'UserUkeyID', 'TotalGST', 'TotalConviencefee', 'DiscountAmt', 'TotalNetAmount', 'TotalNumberOfTicket', 'CouponAmount'], req.body);
        if (missingKey.length > 0) {
            return res.status(400).send(errorMessage(`${missingKey} is required`));
        }

        // Fetch Razorpay credentials from database
        const razorpayQuery = await pool.query(`
            SELECT * FROM PaymentGatewayMaster 
            WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            AND EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        `);
        
        if (!razorpayQuery?.recordset?.length) {
            return res.status(404).send(errorMessage('Razorpay credentials not found'));
        }

        // Extract API credentials
        const { KeyId, SecretKey } = razorpayQuery?.recordset[0];

        // Initialize Razorpay instance
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        });

        // Create Razorpay order with metadata
        const response = await razorpay.orders.create({
            amount: TotalNetAmount * 100, // Convert to paise
            currency: 'INR',
            notes: {
                BookingAmt : `${BookingAmt}`,
                OrganizerUkeyId: `${OrganizerUkeyId}`,  // Ensure string format
                EventUkeyId: `${EventUkeyId}`,
                UserUkeyID: `${UserUkeyID}`,
                CouponUkeyId : `${CouponUkeyId}`,
                TotalGST: `${TotalGST}`, 
                TotalConviencefee : `${TotalConviencefee}`, 
                DiscountAmt : `${DiscountAmt}`, 
                TotalNetAmount : `${TotalNetAmount}`,
                TotalNumberOfTicket : `${TotalNumberOfTicket}`,
                CouponAmount : `${CouponAmount}`,
                ProjectName : `GLOBAL_MYEVENTZ`
            }
        });


        return res.status(200).json({ Success: true, data: response });
    } catch (error) {   
        console.log('Error:', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
};

const fetchOrderDetails = async (req, res) => {
    try {
        const { orderId, OrganizerUkeyId, EventUkeyId } = req.query;

        if (!orderId) {
            return res.status(400).json(errorMessage("orderId is required"));
        }

        // Fetch Razorpay credentials from your database
        const razorpayQuery = await pool.query(`SELECT * FROM PaymentGatewayMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
        AND EventUkeyId = ${setSQLStringValue(EventUkeyId)}
`); 

        if (!razorpayQuery?.recordset?.length) {
            return res.status(404).json(errorMessage("Razorpay credentials not found"));
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0];

        // ✅ Create an instance of Razorpay
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        });

        // ✅ Now fetch order details using the instance
        const orderDetails = await razorpay.orders.fetch(orderId);

        console.log("Fetched Order Details:", orderDetails);

        return res.status(200).json({ success: true, data: orderDetails });
    } catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json(errorMessage(error.message || "Internal Server Error"));
    }
};

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
        const { OrganizerUkeyId, EventUkeyId } = req.query;
        const missingKey = checkKeysAndRequireValues(['OrganizerUkeyId', 'EventUkeyId'], req.query);
        
        if (missingKey.length > 0) {
            return res.status(400).send(errorMessage(`${missingKey} is required`));
        }

        const razorpayQuery = await pool.query(`
        SELECT * FROM PaymentGatewayMaster 
            WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            AND EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        `);

        if (!razorpayQuery?.recordset?.length) {
            return res.status(404).send(errorMessage('Razorpay credentials not found'));
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0];
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        });

        let allPayments = [];
        let skip = 0;
        const count = 100;

        while (true) {
            const response = await razorpay.payments.all({ count, skip });
            allPayments = allPayments.concat(response.items);

            if (response.items.length < count) {
                break;
            }

            skip += count;
        }

        // **Filter payments based on OrganizerUkeyId and EventUkeyId**
        const filteredPayments = allPayments.filter(payment => 
            payment.notes?.OrganizerUkeyId === OrganizerUkeyId && 
            payment.notes?.EventUkeyId === EventUkeyId
        );

        if (!filteredPayments.length) {
            return res.status(404).send(errorMessage('No payments found for the given OrganizerUkeyId and EventUkeyId'));
        }

        return res.status(200).json({ Success: true, data: filteredPayments, count: filteredPayments.length });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
};

const paymentRefund = async (req, res) => {
    try {
        const { orderId, OrganizerUkeyId, EventUkeyId } = req.query;

        if (!orderId) {
            return res.status(400).json(errorMessage("orderId is required"));
        }

        // Fetch Razorpay credentials from your database
        const razorpayQuery = await pool.query(`SELECT * FROM PaymentGatewayMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} AND EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);

        if (!razorpayQuery?.recordset?.length) {
            return res.status(404).json(errorMessage("Razorpay credentials not found"));
        }

        const { KeyId, SecretKey } = razorpayQuery?.recordset[0];
        const razorpay = new Razorpay({
            key_id: KeyId,
            key_secret: SecretKey
        });
        // ✅ Now fetch order details using the instance
        const orderDetails = await razorpay.orders.fetchPayments(orderId);

        if (orderDetails?.count !== 1 && orderDetails?.items[0]?.order_id !== orderId) {
            return res.status(404).json(errorMessage("Order not found"));
        }
        const PaymentId = orderDetails?.items[0]?.id;
        const Amount = orderDetails?.items[0]?.amount;

        // Check if the payment is already refunded
        const isRefunded = orderDetails?.items[0]?.status === 'refunded';
        const isPartiallyRefunded = orderDetails?.items[0]?.amount_refunded > 0;
        if (isRefunded || isPartiallyRefunded) {
            return res.status(400).json(errorMessage("Payment has already been refunded."));
        }

        // Refund the payment
        const refundResponse = await razorpay.payments.refund(`${PaymentId}`, {
            amount: Number(((Amount / 100) * 0.97).toFixed(2)) * 100, // Amount in paise
            currency: 'INR',
            notes: {
                reason: 'Refund for order ID: ' + orderId
            }
        });
        console.log("Refund Response:", refundResponse);

        if (!refundResponse) {
            return res.status(404).send(errorMessage('Refund failed'));
        }

        return res.status(200).json({ Success: true, data: refundResponse });
    }
    catch (error) {
        console.log('error :', error);
        return res.status(500).send(errorMessage(error?.message || error?.error?.description));
    }
}

module.exports = { getPaymentDetails, createRazorpayOrderId, getAllPayments, capturePayment, fetchOrderDetails, paymentRefund };