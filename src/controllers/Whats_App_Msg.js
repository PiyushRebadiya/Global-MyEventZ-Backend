const { errorMessage, getCommonAPIResponse, setSQLBooleanValue, checkKeysAndRequireValues, successMessage, getCommonKeys, generateUUID, getServerIpAddress, setSQLNumberValue, generateSixDigitCode, setSQLStringValue } = require("../common/main");
const { pool } = require("../sql/connectToDatabase");

const fetchWhatAppMsg = async (req, res) => {
    try {
        const { SentWhatsApp, SentEmail } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (SentWhatsApp) {
            whereConditions.push(`SentWhatsApp = ${setSQLBooleanValue(SentWhatsApp)}`);
        }
        if (SentEmail) {
            whereConditions.push(`SentEmail = ${setSQLBooleanValue(SentEmail)}`);
        }

        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `select * from WhatsAppMessages ${whereString} ORDER BY Id DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM WhatsAppMessages ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

const addWhatsAppMsg = async (req, res) => {
    try {
        const { Message = '', Mobile = '', EmailId = '', OrganizerUkeyId = '', TransMode = '' } = req.body;
        const fieldCheck = checkKeysAndRequireValues(['Message', 'Mobile', 'OrganizerUkeyId', 'TransMode'], req.body);
        if (fieldCheck.length !== 0) {
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const insertQuery = `INSERT INTO WhatsAppMessages (OrganizerUkeyId, Message, EmailId, Mobile, WhatsApp, Email, Msg, TransMode, Status, EntryTime) VALUES (${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Message)}, ${setSQLStringValue(EmailId)}, ${setSQLStringValue(Mobile)}, 0, 0, 0, ${setSQLStringValue(TransMode)}, 0, getdate())`;
        const result = await pool.query(insertQuery);
        if (result?.rowsAffected[0] === 0) {
            return res.status(400).send({ ...errorMessage('No rows inserted of Ticket Master')});
        }
        return res.status(200).send({ ...successMessage('Data inserted Successfully!') });
    } catch (error) {
        console.log('Add ticket master Error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const deleteWhatAppMsg = async (req, res) => {
    try {
        const { Id } = req.query;
        const fieldCheck = checkKeysAndRequireValues(['Id'], req.query);
        if (fieldCheck.length !== 0) {
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const deleteQuery = `DELETE FROM WhatsAppMessages WHERE Id = ${Id}`;
        const result = await pool.query(deleteQuery);
        if (result?.rowsAffected[0] === 0) {
            return res.status(400).send(errorMessage('No rows deleted of WhatApp Master'));
        }
        return res.status(200).send(successMessage('Data deleted Successfully!'));
    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

module.exports = { fetchWhatAppMsg, addWhatsAppMsg, deleteWhatAppMsg }