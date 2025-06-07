const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, CommonLogFun, deleteImage } = require("../common/main");
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
            whereConditions.push(`oum.Role = '${Role}'`);
        }
        if(IsActive){
            whereConditions.push(`om.IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        whereConditions.push(`om.flag <> 'D'`);
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT om.*, oum.Password, oum.UserUkeyId FROM OrganizerMaster om
            left join OrgUserMaster oum on om.OrganizerUkeyId = oum.OrganizerUkeyId
            ${whereString} ORDER BY OrganizerId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM OrganizerMaster om
            left join OrgUserMaster oum on om.OrganizerUkeyId = oum.OrganizerUkeyId
            ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const fetchAllOrganizer = async (req, res) => {
    try{
        const getUserList = {
            getQuery: `SELECT * FROM OrganizerMaster 
            where flag <> 'D'
            ORDER BY OrganizerId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM OrganizerMaster where flag <> 'D' `,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);
    }catch(error) {
        console.log('fetch all organizer error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const OrginazerMaster = async (req, res) => {
    try {
        const { 
            OrganizerUkeyId, OrganizerName, Mobile1, Mobile2 = null, Email = null, AliasName = null, 
            Description = null, Add1 = null, Add2 = null, City = null, StateCode, StateName = null, 
            IsActive = true, UserName = null, flag = null , Password, UserUkeyId
        } = req.body;

        if (!flag) return res.status(400).json(errorMessage("Flag is required. Use 'A' for Add or 'U' for Update."));

        const missingKeys = checkKeysAndRequireValues([
            "OrganizerUkeyId", "OrganizerName", "Mobile1", "StateCode", "IsActive"
        ], req.body);

        if (missingKeys.length) return res.status(400).json(errorMessage(`${missingKeys.join(", ")} is required.`));

        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

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
            CommonLogFun({
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : OrganizerUkeyId, 
                MasterName : OrganizerName,  
                TableName : "OrganizerMaster", 
                UserId : req.user?.UserId, 
                UserName : req.user?.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })
            return res.status(200).json({ ...successMessage("New Organizer Created Successfully."), OrganizerUkeyId });
        }

        if (flag === "U") {
            await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);
            const updatePassword = await pool.request().query(`
                update OrgUserMaster set Password = ${setSQLStringValue(Password)}, Mobile1 = ${setSQLStringValue(Mobile1)}, Mobile2 = ${setSQLStringValue(Mobile2)}, Email = ${setSQLStringValue(Email)}, StateCode = ${setSQLStringValue(StateCode)}, StateName = ${setSQLStringValue(StateName)}, CityName = ${setSQLStringValue(City)}, Add1 = ${setSQLStringValue(Add1)}, Add2 = ${setSQLStringValue(Add2)}, FirstName = ${setSQLStringValue(OrganizerName)} where UserUkeyId = ${setSQLStringValue(UserUkeyId)}
            `);
            if (!insertResult.rowsAffected[0]) return res.status(400).json(errorMessage("No Organizer Updated."));

            CommonLogFun({
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : OrganizerUkeyId, 
                MasterName : OrganizerName,  
                TableName : "OrganizerMaster", 
                UserId : req.user?.UserId, 
                UserName : req.user?.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            if( !IsActive && IsActive == false){
                await pool.request().query(`
                    update OrgUserMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update EventMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update AddressMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update CouponMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update PaymentGatewayMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update DocumentUpload set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update SpeakerMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update SponsorMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update SponsorCatMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update TicketCategoryMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    update TemplateMaster set IsActive = 0 where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                `)
            }

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
        const {OrganizerUkeyId, IsPermanentDelete = false} = req.query;

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

        const allDocument = await pool.request().query(`select * from DocumentUpload where OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`)
        let query
        if(IsPermanentDelete){
            query = `
                DELETE FROM OrganizerMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM EventMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM AddressMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM OrgUserMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM Carousel WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM SpeakerMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM SponsorCatMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM SponsorMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                DELETE FROM DocumentUpload WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
            `
            for (const doc of allDocument.recordset) {
                deleteImage('./media/DocumentUpload/' + doc);
            }
        }else {
            query = `
                update OrganizerMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update EventMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update AddressMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update OrgUserMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update Carousel set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update SpeakerMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update SponsorCatMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update SponsorMaster set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                update DocumentUpload set flag = 'D' WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
            `
        }

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
    fetchAllOrganizer,
}