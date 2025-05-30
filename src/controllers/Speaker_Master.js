const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLStringValue, setSQLNumberValue, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');
const FetchSpeakerMasterDetails = async (req, res) => {
    try {
        const { SpeakerUkeyId, OrganizerUkeyId, EventUkeyId } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (SpeakerUkeyId) {
            whereConditions.push(`SM.SpeakerUkeyId = ${setSQLStringValue(SpeakerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`SM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`SM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }

        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const getUserList = {
            getQuery: `
                SELECT SM.*, 
                    (SELECT JSON_QUERY(
                        (SELECT FileName, Label , DocUkeyId, EventUkeyId, OrganizerUkeyId, Category
                        FROM DocumentUpload 
                        WHERE UkeyId = SM.SpeakerUkeyId 
                        FOR JSON PATH)
                    )) AS FileNames
                FROM SpeakerMaster SM
                ${whereString}
                ORDER BY SM.EntryDate DESC
            `,
            countQuery: `SELECT COUNT(*) AS totalCount FROM SpeakerMaster SM ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, getUserList);
        if(result?.data?.length > 0){
            result?.data?.forEach(event => {
                if(event.FileNames){
                    event.FileNames = JSON.parse(event?.FileNames)
                } else {
                    event.FileNames = []
                }
            });
        }
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

const SpeakerMaster = async (req, res) => {
    const { SpeakerUkeyId, OrganizerUkeyId, EventUkeyId, Name, Alias, Description, Email, Mobile, FB, Instagram, Youtube, Other, flag, DiscriptionHindi, DiscriptionGujarati, IsActive,Type} = req.body;
    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);
        
        const insertQuery = `
            INSERT INTO SpeakerMaster (
                SpeakerUkeyId, Name, Alias, Description, Email, Mobile, FB, Instagram, Youtube, Other, 
                UserName, UserID, IpAddress, HostName, EntryDate, flag, OrganizerUkeyId, EventUkeyId, DiscriptionHindi, DiscriptionGujarati, IsActive,Type
            ) VALUES (
                ${setSQLStringValue(SpeakerUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Alias)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(Mobile)}, ${setSQLStringValue(FB)}, 
                ${setSQLStringValue(Instagram)}, ${setSQLStringValue(Youtube)}, ${setSQLStringValue(Other)}, ${setSQLStringValue(req.user.FirstName)}, ${setSQLNumberValue(req.user.UserId)}, ${setSQLStringValue(IPAddress)}, 
                ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(DiscriptionHindi)}, 
                ${setSQLStringValue(DiscriptionGujarati)}, ${setSQLBooleanValue(IsActive)},${setSQLStringValue(Type)}
            );
        `;

        const deleteQuery = `
            DELETE FROM SpeakerMaster WHERE SpeakerUkeyId = '${SpeakerUkeyId}';
        `;

        const missingKeys = checkKeysAndRequireValues(['SpeakerUkeyId', 'OrganizerUkeyId', 'EventUkeyId', 'Name'], req.body);

        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }
        if (flag === 'A') {

            const result = await pool.request().query(insertQuery);

            if (result.rowsAffected[0] === 0) {
                return res.status(400).json({ ...errorMessage('No Speaker Created.') });
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SpeakerUkeyId, 
                MasterName : Name,  
                TableName : "SpeakerMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            return res.status(200).json({ 
                ...successMessage('New Speaker Created Successfully.'), 
                ...req.body 
            });

        } else if (flag === 'U') {

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                return res.status(400).json({ ...errorMessage('No Speaker Master Updated.') });
            }

            CommonLogFun({
                EventUkeyId : EventUkeyId, 
                OrganizerUkeyId : OrganizerUkeyId, 
                ReferenceUkeyId : SpeakerUkeyId, 
                MasterName : Name,  
                TableName : "SpeakerMaster", 
                UserId : req.user.UserId, 
                UserName : req.user.FirstName, 
                IsActive : IsActive,
                flag : flag, 
                IPAddress : IPAddress, 
                ServerName : ServerName, 
                EntryTime : EntryTime
            })

            return res.status(200).json({ 
                ...successMessage('Speaker Master Updated Successfully.'), 
                ...req.body 
            });

        } else {
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsory to send flag.")
            });
        }
    } catch (error) {
        console.log('Add Speaker Master Error :', error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveSpeaker = async (req, res) => {
    try {
        const { SpeakerUkeyId, OrganizerUkeyId } = req.query;

        const missingKeys = checkKeysAndRequireValues(['SpeakerUkeyId', 'OrganizerUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const deleteQuery = `
            DELETE FROM SpeakerMaster WHERE SpeakerUkeyId = ${setSQLStringValue(SpeakerUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)};
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Speaker Master Deleted.') });
        }

        return res.status(200).json({ ...successMessage('Speaker Master Deleted Successfully.'), ...req.body });
    } catch (error) {
        console.log('Delete Speaker Master Error :', error);
        return res.status(500).json({ ...errorMessage(error.message) });
    }
};

module.exports = {
    FetchSpeakerMasterDetails,
    SpeakerMaster,
    RemoveSpeaker,
}