const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchOrganizerDetails = async (req, res)=>{
    try{
        const { OrganizerUkeyId, IsActive, Role } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (OrganizerUkeyId) {
            whereConditions.push(`om.OrganizerUkeyId = '${OrganizerUkeyId}'`);
        }
        if (Role) {
            whereConditions.push(`om.Role = '${Role}'`);
        }
        if(IsActive){
            whereConditions.push(`om.IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT om.*, oum.Password FROM OrganizerMaster om
            left join OrgUserMaster oum on om.OrganizerUkeyId = oum.OrganizerUkeyId
            ${whereString} ORDER BY OrganizerId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM OrganizerMaster om ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const OrginazerMaster = async (req, res) => {
    try {
        const { 
            OrganizerUkeyId, OrganizerName, Mobile1, Mobile2 = null, Email = null, AliasName = null, 
            Description = null, Add1 = null, Add2 = null, City = null, StateCode, StateName = null, 
            IsActive = true, UserName = null, flag = null , Password
        } = req.body;

        if (!flag) return res.status(400).json(errorMessage("Flag is required. Use 'A' for Add or 'U' for Update."));

        const missingKeys = checkKeysAndRequireValues([
            "OrganizerUkeyId", "OrganizerName", "Mobile1", "StateCode", "IsActive", "UserName"
        ], req.body);

        if (missingKeys.length) return res.status(400).json(errorMessage(`${missingKeys.join(", ")} is required.`));

        const { IPAddress, ServerName, EntryTime } = getCommonKeys();

        const insertQuery = `
            INSERT INTO OrganizerMaster (
                OrganizerUkeyId, OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, Add2, City, StateCode, StateName, IsActive, UserName, IpAddress, HostName, EntryDate, flag
            ) VALUES (
                ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Mobile2)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(AliasName)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Add1)}, ${setSQLStringValue(Add2)}, ${setSQLStringValue(City)}, ${setSQLStringValue(StateCode)}, ${setSQLStringValue(StateName)}, ${setSQLBooleanValue(IsActive)}, ${setSQLStringValue(UserName)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(flag)}
            );
        `;

        const deleteQuery = `DELETE FROM OrganizerMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)};`;

        if (flag === "A") {
            const result = await pool.request().query(insertQuery);
            if (!result.rowsAffected[0]) return res.status(400).json(errorMessage("No Organizer Created."));
            return res.status(200).json({ ...successMessage("New Organizer Created Successfully."), OrganizerUkeyId });
        }

        if (flag === "U") {
            await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);
            const updatePassword = await pool.request().query(`
                update OrgUserMaster set Password = ${setSQLStringValue(Password)} where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
            `);
            if (!insertResult.rowsAffected[0]) return res.status(400).json(errorMessage("No Organizer Updated."));

            CommonLogFun({
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : OrganizerUkeyId, 
                MasterName : OrganizerName,  
                TableName : "OrganizerMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            return res.status(200).json({ ...successMessage("Organizer Updated Successfully."), OrganizerUkeyId });
        }

        return res.status(400).json(errorMessage("Invalid flag. Use 'A' for Add or 'U' for Update."));
    } catch (error) {
        console.error('orginizer master API error : ', error);
        return res.status(500).json(errorMessage(error?.message));
    }
};

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