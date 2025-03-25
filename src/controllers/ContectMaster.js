const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, toFloat, setSQLStringValue, deleteImage } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchContects = async (req, res) => {
    try {
        const { ContactUkeyId, OrganizerUkeyId, EventUkeyId, FormType, QueryType } = req.query;
        let whereConditions = [];

        if (ContactUkeyId) {
            whereConditions.push(`CM.ContactUkeyId = ${setSQLStringValue(ContactUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`CM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`CM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (FormType) {
            whereConditions.push(`CM.FormType = ${setSQLStringValue(FormType)}`);
        }
        if (QueryType) {
            whereConditions.push(`CM.QueryType = ${setSQLStringValue(QueryType)}`);
        }

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const getUserList = {
            getQuery: `
                SELECT CM.*, 
                (SELECT JSON_QUERY(
                    (SELECT FileName, Label 
                    FROM DocumentUpload 
                    WHERE UkeyId = CM.ContactUkeyId 
                    FOR JSON PATH)
                )) AS FileNames
                FROM ContactMaster CM
                ${whereString}
                ORDER BY CM.EntryDate DESC
            `,
            countQuery: `SELECT COUNT(*) AS totalCount FROM ContactMaster CM ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, getUserList);

        result.data.forEach(contact => {
            contact.FileNames = contact.FileNames ? JSON.parse(contact.FileNames) : [];
        });

        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

const ContectMaster = async(req, res)=>{
    const { ContactUkeyId, EventUkeyId, OrganizerUkeyId, Name, Mobile, Email, Message, flag = 'A', FormType = '', QueryType = ''} = req.body;
    let {Image} = req.body;
    Image = req?.files?.Image?.length ? `${req?.files?.Image[0]?.filename}` : Image;
    const {IPAddress, ServerName, EntryTime} = getCommonKeys(req);
    try{
        const missingKeys = checkKeysAndRequireValues(['ContactUkeyId', 'OrganizerUkeyId', 'EventUkeyId', 'Name', 'Mobile'], req.body)
        if(missingKeys.length > 0){
            if (Image) deleteImage(req?.files?.Image?.[0]?.path); // Only delete if `Img` exists
            return res.status(200).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        const insertQuery = `
            INSERT INTO ContactMaster (
                ContactUkeyId, EventUkeyId, OrganizerUkeyId, Name, Mobile, Email, Message, flag, IpAddress, HostName, EntryDate, FormType, QueryType, Image
            ) VALUES (
                ${setSQLStringValue(ContactUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(Message)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(FormType)}, ${setSQLStringValue(QueryType)}, ${setSQLStringValue(Image)}
            );
        `
        const deleteQuery = `
            DELETE FROM ContactMaster WHERE ContactUkeyId = ${setSQLStringValue(ContactUkeyId)}
        `
        if(flag == 'A'){
            const result = await pool.request().query(insertQuery);

            if(result.rowsAffected[0] === 0){
                if (Image) deleteImage(req?.files?.Image?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({...errorMessage('No Contect Created.'),})
            }

            return res.status(200).json({...successMessage('New Contect Created Successfully.'), ...req.bod, Imagey});

        }else if(flag === 'U'){
            const oldImageResult = await pool.request().query(`SELECT Image FROM ContactMaster WHERE ContactUkeyId = '${ContactUkeyId}'`);
            const oldImage = oldImageResult.recordset?.[0]?.Image; // Safely access the first record

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                if (Image) deleteImage(req?.files?.Image?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({...errorMessage('No Contect Updated.')})
            }

            if (oldImage && req?.files?.Image?.length) deleteImage(`./media/Contect/${oldImage}`);

            return res.status(200).json({...successMessage('New Contect Updated Successfully.'), ...req.body, Image});
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
        if (Image) deleteImage(req?.files?.Image?.[0]?.path); // Only delete if `Img` exists
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
        const oldImageResult = await pool.request().query(`SELECT Image FROM ContactMaster WHERE ContactUkeyId = '${ContactUkeyId}'`);
        const oldImage = oldImageResult.recordset?.[0]?.Image; // Safely access the first record


        const query = `
            DELETE FROM ContactMaster WHERE ContactUkeyId = ${setSQLStringValue(ContactUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `

        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Contect Deleted.')})
        }

        if (oldImage) deleteImage(`./media/Contect/${oldImage}`);

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