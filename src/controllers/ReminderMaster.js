const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, toFloat, setSQLStringValue, setSQLNumberNullValue, deleteImage, setSQLDateTime } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchReminderMaster = async(req, res)=>{
    try{
        const { ReminderUkeyId, OrganizerUkeyId, EventUkeyId, IsActive } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (ReminderUkeyId) {
            whereConditions.push(`ReminderUkeyId = ${setSQLStringValue(ReminderUkeyId)}`);
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
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM ReminderMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM ReminderMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const ReminderMaster = async(req, res)=>{
    const { EventUkeyId = '', OrganizerUkeyId = '', ReminderUkeyId = '', Title = '', Description = '', Link = '', LinkType = '', IsActive = false, SentTime = null, flag = ''} = req.body;
    let {Image} = req.body
    Image = req?.files?.Image?.length ? `${req?.files?.Image[0]?.filename}` : Image;
    try{
        const missingKeys = checkKeysAndRequireValues(['ReminderUkeyId', 'OrganizerUkeyId', 'EventUkeyId', 'Title', 'Description'], req.body)
        if(missingKeys.length > 0){
            if (Image) deleteImage(req?.files?.Image?.[0]?.path);
            return res.status(200).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        const {IPAddress, ServerName, EntryTime} = getCommonKeys(req);
        const insertQuery = `
            INSERT INTO ReminderMaster (
                OrganizerUkeyId, EventUkeyId, ReminderUkeyId, Image, Title, Description, Link, LinkType, IsActive, SentTime, flag, IpAddress, HostName, EntryDate, UserID, UserName
            ) VALUES (
                ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(ReminderUkeyId)}, ${setSQLStringValue(Image)}, ${setSQLStringValue(Title)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Link)}, ${setSQLStringValue(LinkType)}, ${setSQLStringValue(IsActive)}, ${setSQLDateTime(SentTime)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLNumberNullValue(req.user.UserId)}, ${setSQLStringValue(req.user.FirstName)}
            );
        `
        const deleteQuery = `
            DELETE FROM ReminderMaster WHERE ReminderUkeyId = ${setSQLStringValue(ReminderUkeyId)}
        `
        if(flag == 'A'){
            const result = await pool.request().query(insertQuery);

            if(result.rowsAffected[0] === 0){
                if (Image) deleteImage(req?.files?.Image?.[0]?.path);
                return res.status(400).json({...errorMessage('No Notification Created.'),})
            }

            return res.status(200).json({...successMessage('New Notification Created Successfully.'), ...req.body});

        }else if(flag === 'U'){
            const oldImgResult = await pool.request().query(`
                SELECT Image FROM ReminderMaster WHERE ReminderUkeyId = ${setSQLStringValue(ReminderUkeyId)};
            `);
            const oldImg = oldImgResult.recordset?.[0]?.Image;

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                if (Image) deleteImage(req?.files?.Image?.[0]?.path);
                return res.status(400).json({...errorMessage('No Notification Updated.')})
            }

            if (oldImg && req.files && req.files.Image && req.files.Image.length > 0){
                deleteImage('./media/Reminder/' + oldImg);
            }

            return res.status(200).json({...successMessage('New Notification Updated Successfully.'), ...req.body});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Notification Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Notification Error :', error);
        }
        if (Image) deleteImage(req?.files?.Image?.[0]?.path);
        return res.status(500).send(errorMessage(error?.message));
    }
}

const RemoveReminderMaster = async(req, res)=>{
    try{
        const {ReminderUkeyId, OrganizerUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['ReminderUkeyId', 'OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const oldImgResult = await pool.request().query(`
            SELECT Image FROM ReminderMaster WHERE ReminderUkeyId = ${setSQLStringValue(ReminderUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `);
        
        const oldImg = oldImgResult.recordset?.[0]?.Image;

        const query = `
            DELETE FROM ReminderMaster WHERE ReminderUkeyId = ${setSQLStringValue(ReminderUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `

        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Notification Deleted.')})
        }

        if (oldImg){
            deleteImage('./media/Reminder/' + oldImg);
        }

        return res.status(200).json({...successMessage('Notification Deleted Successfully.'), ...req.query});
    }catch(error){
        console.log('Delete Notification Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    fetchReminderMaster,
    ReminderMaster,
    RemoveReminderMaster
}