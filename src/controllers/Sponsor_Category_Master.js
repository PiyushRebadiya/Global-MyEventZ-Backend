const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLNumberValue, setSQLStringValue, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchSponsorCategoryMasterDetails = async (req, res)=>{
    try{
        const { SpCatUkeyId, OrganizerUkeyId, EventUkeyId, IsActive } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (SpCatUkeyId) {
            whereConditions.push(`SpCatUkeyId = ${setSQLStringValue(SpCatUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM SponsorCatMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM SponsorCatMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const SponsorCategoryMaster = async (req, res) => {
    const {  SpCatUkeyId, OrganizerUkeyId, EventUkeyId, Name, IsActive, flag} = req.body;
    
    try{
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const insertQuery = `
            INSERT INTO SponsorCatMaster (
                SpCatUkeyId, OrganizerUkeyId, EventUkeyId, Name, IsActive, flag, IpAddress, HostName,EntryDate
            ) VALUES (
                ${setSQLStringValue(SpCatUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLBooleanValue(IsActive)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)},${setSQLStringValue(EntryTime)}
            );
        `
        const deleteQuery = `
            DELETE FROM SponsorCatMaster WHERE SpCatUkeyId = '${SpCatUkeyId}';
        `
        if(flag == 'A'){
            const result = await pool.request().query(insertQuery);
                
            if(result.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Sponsor Category Created.'),})
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SpCatUkeyId, 
                MasterName : Name,  
                TableName : "SponsorCategoryMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })
    
            return res.status(200).json({...successMessage('New Sponsor Category Created Successfully.'), ...req.body});

        }else if(flag === 'U'){

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Sponsor Category Updated.')})
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SpCatUkeyId, 
                MasterName : Name,  
                TableName : "SponsorCategoryMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })
    
            return res.status(200).json({...successMessage('New Sponsor Category Updated Successfully.'), ...req.body});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Sponsor Category Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Sponsor Category Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveSponsorCategory = async (req, res) => {
    try{
        const {SpCatUkeyId, OrganizerUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['SpCatUkeyId', 'OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const query = `
            DELETE FROM SponsorCatMaster WHERE SpCatUkeyId = ${setSQLStringValue(SpCatUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `
    
        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Sponsor Category Deleted.')})
        }

        return res.status(200).json({...successMessage('Sponsor Category Deleted Successfully.')});
    }catch(error){
        console.log('Delete Sponsor Category Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
};

module.exports = {
    FetchSponsorCategoryMasterDetails,
    SponsorCategoryMaster,
    RemoveSponsorCategory,
}