const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, toFloat, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchContects = async(req, res)=>{
    try{
        const { ContactUkeyId, OrganizerUkeyId, EventUkeyId, FormType, QueryType } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (ContactUkeyId) {
            whereConditions.push(`ContactUkeyId = ${setSQLStringValue(ContactUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (FormType) {
            whereConditions.push(`FormType = ${setSQLStringValue(FormType)}`);
        }
        if (QueryType) {
            whereConditions.push(`QueryType = ${setSQLStringValue(QueryType)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM ContactMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM ContactMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const ContectMaster = async(req, res)=>{
    const { ContactUkeyId, EventUkeyId, OrganizerUkeyId, Name, Mobile, Email, Message, flag = 'A', FormType = '', QueryType = '', Subject = ''} = req.body;
    const {IPAddress, ServerName, EntryTime} = getCommonKeys(req);
    try{
        const missingKeys = checkKeysAndRequireValues(['ContactUkeyId', 'OrganizerUkeyId', 'EventUkeyId', 'Name', 'Mobile'], req.body)
        if(missingKeys.length > 0){
            return res.status(200).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        const insertQuery = `
            INSERT INTO ContactMaster (
                ContactUkeyId, EventUkeyId, OrganizerUkeyId, Name, Mobile, Email, Message, flag, IpAddress, HostName, EntryDate, FormType, QueryType, Subject
            ) VALUES (
                ${setSQLStringValue(ContactUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(Message)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(FormType)}, ${setSQLStringValue(QueryType)}, ${setSQLStringValue(Subject)}
            );
        `
        const deleteQuery = `
            DELETE FROM ContactMaster WHERE ContactUkeyId = ${setSQLStringValue(ContactUkeyId)}
        `
        if(flag == 'A'){
            const result = await pool.request().query(insertQuery);

            if(result.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Contect Created.'),})
            }

            return res.status(200).json({...successMessage('New Contect Created Successfully.'), ...req.body});

        }else if(flag === 'U'){

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Contect Updated.')})
            }

            return res.status(200).json({...successMessage('New Contect Updated Successfully.'), ...req.body});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Contect Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Contect Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
}

const RemoveContect = async(req, res)=>{
    try{
        const {ContactUkeyId, OrganizerUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['ContactUkeyId', 'OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const query = `
            DELETE FROM ContactMaster WHERE ContactUkeyId = ${setSQLStringValue(ContactUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `

        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Contect Deleted.')})
        }

        return res.status(200).json({...successMessage('Contect Deleted Successfully.'), ...req.query});
    }catch(error){
        console.log('Delete Contect Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    fetchContects,
    ContectMaster,
    RemoveContect
}