const { errorMessage, getCommonAPIResponse, setSQLBooleanValue, checkKeysAndRequireValues, successMessage, getCommonKeys, generateUUID, getServerIpAddress, setSQLNumberValue, generateSixDigitCode, setSQLStringValue, setSQLDateTime } = require("../common/main");
const { pool } = require("../sql/connectToDatabase");

const addWhatsAppMsg = async (req, res) => {
    try {
        const { Message = '', Mobile = '', EmailId = '', OrganizerUkeyId = '', TransMode = '', EventUkeyId = '',FilePath='',BookingUkeyID='' } = req.body;
        const fieldCheck = checkKeysAndRequireValues(['Message', 'Mobile', 'OrganizerUkeyId', 'TransMode'], req.body);
        if (fieldCheck.length !== 0) {
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const insertQuery = `INSERT INTO WhatsAppMessages (OrganizerUkeyId, Message, EmailId, Mobile, WhatsApp, Email, Msg, TransMode, Status, EntryTime, EventUkeyId,FilePath,BookingUkeyID) VALUES (${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Message)}, ${setSQLStringValue(EmailId)}, ${setSQLStringValue(Mobile)}, 0, 0, 0, ${setSQLStringValue(TransMode)}, 0, getdate(), ${setSQLStringValue(EventUkeyId)},${setSQLStringValue(FilePath)},${setSQLStringValue(BookingUkeyID)})`;
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

const whatsappReport123 = async (req, res) => {
    try {
        const { OrganizerUkeyId, EventUkeyId, WhatsApp, StartDate, EndDate, TransMode } = req.query;
        let whereConditions = [];

        if (OrganizerUkeyId) {
            whereConditions.push(`wam.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (TransMode) {
            whereConditions.push(`wam.TransMode = ${setSQLStringValue(TransMode)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`wam.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (WhatsApp) {
            whereConditions.push(`wam.WhatsApp = ${setSQLBooleanValue(WhatsApp)}`);
        }
        if(StartDate && EndDate){
            whereConditions.push(`wam.EntryTime >= '${StartDate}' and wam.EntryTime <= DATEADD(DAY, 1,'${EndDate}')`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `select wam.Mobile, wam.WhatsApp, wam.TransMode, wam.EntryTime, om.OrganizerName, em.EventName, um.FullName from WhatsAppMessages wam
            left join OrganizerMaster om on om.OrganizerUkeyId = wam.OrganizerUkeyId
            left join EventMaster em on em.EventUkeyId = wam.EventUkeyId
            left join UserMaster um on um.Mobile1 = wam.Mobile
            ${whereString} order by entrytime desc`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM WhatsAppMessages wam ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

module.exports = {addWhatsAppMsg, deleteWhatAppMsg, whatsappReport123 }