const {
    errorMessage,
    successMessage,
    checkKeysAndRequireValues,
    setSQLStringValue,
    setSQLNumberValue,
    setSQLBooleanValue,
    getCommonAPIResponse,
    getCommonKeys,
    generateUUID
} = require("../common/main");
const { pool } = require('../sql/connectToDatabase');

// Fetch TemplateMaster Details
const FetchTemplateMasterDetails = async (req, res) => {
    try {
        const { TemplateMasterUkeyId, TemplateName, IpAddress } = req.query;
        let whereConditions = [];

        if (TemplateMasterUkeyId) {
            whereConditions.push(`TemplateMasterUkeyId = '${TemplateMasterUkeyId}'`);
        }
        if (TemplateName) {
            whereConditions.push(`TemplateName LIKE '%${TemplateName}%'`);
        }
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const queries = {
            getQuery: `SELECT * FROM TemplateMaster ${whereString} ORDER BY TemplateMasterId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM TemplateMaster ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, queries);
        return res.json(result);
    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

// Insert or Update TemplateMaster
const ManageTemplateMaster = async (req, res) => {
    const {
        TemplateName = '',
        TemplateDescription = '',
        TemplateMasterUkeyId = generateUUID(),
        flag = null
    } = req.body;

    try {
        const missingKeys = checkKeysAndRequireValues(['TemplateName', 'TemplateDescription'], req.body);

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const insertQuery = `
            INSERT INTO TemplateMaster (TemplateMasterUkeyId, TemplateName, TemplateDescription, IpAddress, HostName, EntryDate)
            VALUES (
                ${setSQLStringValue(TemplateMasterUkeyId)},
                ${setSQLStringValue(TemplateName)},
                ${setSQLStringValue(TemplateDescription)},
                ${setSQLStringValue(IPAddress)},
                ${setSQLStringValue(ServerName)},
                ${setSQLStringValue(EntryTime)}
            );
        `;

        const oldQuery = `
            SELECT * FROM TemplateMaster WHERE TemplateMasterUkeyId = '${TemplateMasterUkeyId}';
        `;

        const deleteQuery = `
            DELETE FROM TemplateMaster WHERE TemplateMasterUkeyId = '${TemplateMasterUkeyId}';
        `;

        if (flag === 'A') {
            const result = await pool.request().query(insertQuery);

            if (result.rowsAffected[0] === 0) {
                return res.status(400).json(errorMessage('Failed to create template.'));
            }

            return res.status(200).json(successMessage('Template created successfully.'));
        } else if (flag === 'U') {

            const oldResult = await pool.request().query(oldQuery);
            if (oldResult.rowsAffected[0] === 0) {
                return res.status(400).json(errorMessage('No template found to update.'));
            }
            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                return res.status(400).json(errorMessage('Failed to update template.'));
            }

            return res.status(200).json(successMessage('Template updated successfully.'));
        } else {
            return res.status(400).json(errorMessage("Use 'A' flag to add and 'U' flag to update."));
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

// Remove TemplateMaster Entry
const RemoveTemplateMaster = async (req, res) => {
    try {
        const { TemplateMasterUkeyId } = req.query;

        const missingKeys = checkKeysAndRequireValues(['TemplateMasterUkeyId'], req.query);

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        const query = `
            DELETE FROM TemplateMaster WHERE TemplateMasterUkeyId = '${TemplateMasterUkeyId}';
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
    FetchTemplateMasterDetails,
    ManageTemplateMaster,
    RemoveTemplateMaster,
};
