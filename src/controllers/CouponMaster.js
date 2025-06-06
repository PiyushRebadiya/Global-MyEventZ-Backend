const {
    errorMessage,successMessage, checkKeysAndRequireValues, setSQLStringValue, setSQLNumberValue, setSQLBooleanValue, getCommonAPIResponse, getCommonKeys,
    setSQLDecimalValue,
    setSQLDateTime
} = require("../common/main");
const { pool } = require('../sql/connectToDatabase');

// Fetch CouponMaster Details
const FetchCoupons = async (req, res) => {
    try {
        const { CouponUkeyId, Name, IsActive, EventUkeyId, OrganizerUkeyId } = req.query;
        let whereConditions = [];

        if (CouponUkeyId) {
            whereConditions.push(`CouponUkeyId = ${setSQLStringValue(CouponUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (IsActive) {
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        whereConditions.push(`flag <> 'D'`);
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const queries = {
            getQuery: `SELECT * FROM CouponMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM CouponMaster ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, queries);
        return res.json(result);
    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

// Insert or Update CouponMaster
const CouponMaster = async (req, res) => {
    const {
        CouponUkeyId, EventUkeyId, OrganizerUkeyId, CouponCode, Remarks, isAmount, Discount, IsActive, StartDate, EndDate, flag
    } = req.body;

    try {
        const missingKeys = checkKeysAndRequireValues(['CouponUkeyId', 'EventUkeyId', 'CouponCode', 'isAmount', 'Discount'], req.body);

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const insertQuery = `
            INSERT INTO CouponMaster (
                CouponUkeyId, EventUkeyId, OrganizerUkeyId, CouponCode, Remarks, isAmount, Discount, IsActive, UserId, UserName, flag, IpAddress, HostName, EntryDate, StartDate, EndDate
            ) VALUES (
                ${setSQLStringValue(CouponUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(CouponCode)}, ${setSQLStringValue(Remarks)}, ${setSQLBooleanValue(isAmount)}, ${setSQLDecimalValue(Discount)}, ${setSQLBooleanValue(IsActive)}, ${setSQLStringValue(req.user.UserId)}, ${setSQLStringValue(req.user.FirstName)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLDateTime(StartDate)}, ${setSQLDateTime(EndDate)}
            );
        `;
        
        const deleteQuery = `
            DELETE FROM CouponMaster WHERE CouponUkeyId = ${setSQLStringValue(CouponUkeyId)};
        `;

        if (flag === 'A') {
            const result = await pool.request().query(insertQuery);

            if (result.rowsAffected[0] === 0) {
                return res.status(400).json(errorMessage('Failed to create template.'));
            }

            return res.status(200).json({...successMessage('Template created successfully.'), ...req.body});
        } else if (flag === 'U') {

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                return res.status(400).json(errorMessage('Failed to update template.'));
            }

            return res.status(200).json({...successMessage('Template updated successfully.'), ...req.body});
        } else {
            return res.status(400).json(errorMessage("Use 'A' flag to add and 'U' flag to update."));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

// Remove Coupon Entry
const RemoveCoupon = async (req, res) => {
    try {
        const { CouponUkeyId, OrganizerUkeyId } = req.query;

        const missingKeys = checkKeysAndRequireValues(['CouponUkeyId', 'OrganizerUkeyId'], req.query);

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        const query = `
            update CouponMaster set flag = 'D' WHERE CouponUkeyId = ${setSQLStringValue(CouponUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)};
        `;

        const result = await pool.request().query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json(errorMessage('No template found to delete.'));
        }

        return res.status(200).json(successMessage('Template deleted successfully.'));
    } catch (error) {
        console.error(error);
        return res.status(500).json(errorMessage(error.message));
    }
};

module.exports = {
    FetchCoupons,
    CouponMaster,
    RemoveCoupon,
};
