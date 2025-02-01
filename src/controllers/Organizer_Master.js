const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchOrganizerDetails = async (req, res)=>{
    try{
        const { OrganizerUkeyId, IsActive, Role } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = '${OrganizerUkeyId}'`);
        }
        if (Role) {
            whereConditions.push(`Role = '${Role}'`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM OrganizerMaster ${whereString} ORDER BY OrganizerId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM OrganizerMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const OrginazerMaster = async (req, res)=>{
    const { OrganizerName = '', OrganizerUkeyId = generateUUID(), ParentOrganizerUkeyId = '', StateCode = '', StateName = null, Email = null, Mobile1 = null, Mobile2 = null, AliasName = null, Description = null, Add1 = null, Add2 = null, City = null, IsActive = true, UsrID = null, UPI = null, flag = null, UserName = null,
    Password = null, Role = 'Admin', RazorpayKeyId = null, RazorpaySecretKey = null, RazorpayBusinessName = null } = req.body;
    
    try{
        const {IPAddress, ServerName, EntryTime} = getCommonKeys();

        const insertQuery = `
            INSERT INTO OrganizerMaster (OrganizerUkeyId, ParentOrganizerUkeyId, OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, Add2, City, StateCode, StateName, UPI, IsActive, UsrID, IpAddress, HostName, EntryDate, flag, UserName, Password, Role, RazorpayKeyId, RazorpaySecretKey, RazorpayBusinessName) VALUES (
            ${setSQLStringValue(OrganizerUkeyId)},
            ${setSQLStringValue(ParentOrganizerUkeyId)}, 
            ${setSQLStringValue(OrganizerName)}, 
            ${setSQLStringValue(Mobile1)}, 
            ${setSQLStringValue(Mobile2)}, 
            ${setSQLStringValue(Email)}, 
            ${setSQLStringValue(AliasName)}, 
            ${setSQLStringValue(Description)}, 
            ${setSQLStringValue(Add1)}, 
            ${setSQLStringValue(Add2)}, 
            ${setSQLStringValue(City)}, ${StateCode}, 
            ${setSQLStringValue(StateName)}, 
            ${setSQLStringValue(UPI)}, 
            ${setSQLBooleanValue(IsActive)}, 
            ${setSQLStringValue(UsrID)}, 
            ${setSQLStringValue(IPAddress)}, 
            ${setSQLStringValue(ServerName)}, 
            ${setSQLStringValue(EntryTime)}, 
            ${setSQLStringValue(flag)}, 
            ${setSQLStringValue(UserName)}, 
            ${setSQLStringValue(Password)}, 
            ${setSQLStringValue(Role)},
            ${setSQLStringValue(RazorpayKeyId)}, 
            ${setSQLStringValue(RazorpaySecretKey)}, 
            ${setSQLStringValue(RazorpayBusinessName)});
        `

        const deleteQuery = `
            DELETE FROM OrganizerMaster WHERE OrganizerUkeyId = '${OrganizerUkeyId}';
        `

        if(flag == 'A'){
            // const missingKeys = checkKeysAndRequireValues(['OrganizerUkeyId', 'EventName', 'AddressAlias', 'EventDate', 'EventDetails', 'flag'], req.body);
    
            // if(missingKeys.length > 0){
            //     return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            // }

            const result = await pool.request().query(insertQuery);
                
            if(result.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Event Created.'),})
            }
    
            return res.status(200).json({...successMessage('New Event Created Successfully.'), ...req.body, OrganizerUkeyId});

        }else if(flag === 'U'){

            // const missingKeys = checkKeysAndRequireValues(['OrganizerUkeyId', 'EventName', 'Alias', 'EventDate', 'EventCode', 'EventDetails', 'AddressUkeyID', 'Img1', 'Img2', 'Img3', 'IsActive', 'UsrName', 'UsrID', 'IpAddress', 'flag', 'EventId'], req.body);

            // if(missingKeys.length > 0){
            //     return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            // }

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Event Updated.')})
            }
    
            return res.status(200).json({...successMessage('New Event Updated Successfully.'), ...req.body, OrganizerUkeyId});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Event Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Event Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
}

const RemoveOrginazer = async (req, res) => {
    try{
        const {OrganizerUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const checkOrganizer = await pool.request().query(`SELECT * FROM OrganizerMaster WHERE OrganizerUkeyId = '${OrganizerUkeyId}'`);

        if(checkOrganizer.rowsAffected[0] == 0){
            return res.status(400).json({...errorMessage('No Orginizer Found.')})
        }

        if(checkOrganizer.recordset[0].Role == 'SuperAdmin' || checkOrganizer.recordset[0].Role == 'Admin'){
            return res.status(400).json({...errorMessage('Admin cannot be deleted.')})
        }

        const query = `
            DELETE FROM OrganizerMaster WHERE OrganizerUkeyId = '${OrganizerUkeyId}'
        `

        const result = await pool.request().query(query);

        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Orginizer Deleted.')})
        }

        return res.status(200).json({...successMessage('Orginizer Deleted Successfully.'), OrganizerUkeyId});
    }catch(error){
        console.log('Delete Event Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    FetchOrganizerDetails,
    OrginazerMaster,
    RemoveOrginazer,
}