const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLStringValue, setSQLNumberValue, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchSponsorMasterDetails = async (req, res) => {
    try {
        const { SponsorUkeyId, OrganizerUkeyId, EventUkeyId, SponsorCatUkeyId } = req.query;
        let whereConditions = [];

        if (SponsorUkeyId) {
            whereConditions.push(`SM.SponsorUkeyId = ${setSQLStringValue(SponsorUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`SM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`SM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (SponsorCatUkeyId) {
            whereConditions.push(`SM.SponsorCatUkeyId = ${setSQLStringValue(SponsorCatUkeyId)}`);
        }
        
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const getUserList = {
            getQuery: `
                SELECT SM.*, SCM.Name AS SponsorCategoryName,
                (SELECT JSON_QUERY(
                    (SELECT FileName, Label 
                    FROM DocumentUpload 
                    WHERE UkeyId = SM.SponsorUkeyId 
                    FOR JSON PATH)
                )) AS FileNames
                FROM SponsorMaster SM
                left join SponsorCatMaster SCM on SM.SponsorCatUkeyId = SCM.SpCatUkeyId
                ${whereString}
                ORDER BY SM.EntryDate DESC
            `,
            countQuery: `SELECT COUNT(*) AS totalCount FROM SponsorMaster SM ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, getUserList);
        result.data.forEach(event => {
            if(event.FileNames){
                event.FileNames = JSON.parse(event?.FileNames)
            } else {
                event.FileNames = []
            }
        });

        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

const SponsorMaster = async (req, res) => {
    const { 
        SponsorUkeyId = '', SponsorCatUkeyId = '', Name = '', Mobile = '', CompanyName = '', flag = '' , OrganizerUkeyId = '',EventUkeyId = '', Description1 = '', Description2 = '', Description3 = '', Description4 = '', Link = '', LinkType = '', IsActive
    } = req.body;
    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const insertQuery = `
            INSERT INTO SponsorMaster (
                SponsorUkeyId, SponsorCatUkeyId, Name, Mobile, CompanyName, UserName, UserID, IpAddress, HostName, EntryDate, flag, OrganizerUkeyId, EventUkeyId,Description1, Description2, Description3, Description4, Link, LinkType, IsActive
            ) VALUES (
                ${setSQLStringValue(SponsorUkeyId)}, ${setSQLStringValue(SponsorCatUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLStringValue(CompanyName)}, ${setSQLStringValue(req.user.FirstName)}, ${setSQLStringValue(req.user.UserId)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(Description1)}, ${setSQLStringValue(Description2)}, ${setSQLStringValue(Description3)}, ${setSQLStringValue(Description4)}, ${setSQLStringValue(Link)}, ${setSQLStringValue(LinkType)}, ${setSQLBooleanValue(IsActive)}
            );
        `;

        const deleteQuery = `
            DELETE FROM SponsorMaster WHERE SponsorUkeyId = ${setSQLStringValue(SponsorUkeyId)};
        `;

        const missingKeys = checkKeysAndRequireValues(['SponsorUkeyId', 'SponsorCatUkeyId', 'Name', 'OrganizerUkeyId', 'EventUkeyId'], { ...req.body });

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }
        if (flag === 'A') {

            const result = await pool.request().query(insertQuery);

            if (result?.rowsAffected?.[0] === 0) {
                return res.status(400).json({ ...errorMessage('No Sponsor Created.') });
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SponsorUkeyId, 
                MasterName : Name,  
                TableName : "SponsorMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            return res.status(200).json({ 
                ...successMessage('New Sponsor Created Successfully.'), 
                ...req.body
            });

        } else if (flag === 'U') {

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                return res.status(400).json({ ...errorMessage('No Sponsor Master Updated.') });
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SponsorUkeyId, 
                MasterName : Name,  
                TableName : "SponsorMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            return res.status(200).json({ 
                ...successMessage('New Sponsor Master Updated Successfully.'), 
                ...req.body 
            });

        } else {
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsory to send flag.")
            });
        }
    } catch (error) {
        if (flag === 'A') {
            console.log('Add Sponsor Master Error :', error);
        }
        if (flag === 'U') {
            console.log('Update Sponsor Master Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveSponsor = async (req, res) => {
    try {
        const { SponsorUkeyId, OrganizerUkeyId } = req.query;

        const missingKeys = checkKeysAndRequireValues(['SponsorUkeyId', 'OrganizerUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const deleteQuery = `
            DELETE FROM SponsorMaster WHERE SponsorUkeyId = ${setSQLStringValue(SponsorUkeyId)} AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)};
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Sponsor Master Deleted.') });
        }

        return res.status(200).json({ ...successMessage('Sponsor Master Deleted Successfully.'), SponsorUkeyId });
    } catch (error) {
        console.log('Delete Sponsor Master Error :', error);
        return res.status(500).json({ ...errorMessage(error.message) });
    }
};

module.exports = {
    FetchSponsorMasterDetails,
    SponsorMaster,
    RemoveSponsor,
}