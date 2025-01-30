const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchSpeakerMasterDetails = async (req, res)=>{
    try{
        const { SpeakerUkeyId, EventUkeyId, IsActive } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (SpeakerUkeyId) {
            whereConditions.push(`SpeakerUkeyId = '${SpeakerUkeyId}'`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = '${EventUkeyId}'`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM SpeakerMaster ${whereString} ORDER BY SpeakerUkeyId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM SpeakerMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const SpeakerMaster = async (req, res) => {
    const { 
        SpeakerUkeyId = generateUUID(), 
        Name = null, Alias = null, Description = null, Email = null, Mobile = null, FB = null, Instagram = null, Youtube = null, Other = null, 
        UsrName = null, UsrID = null, flag = null , OrganizerUkeyId = null, EventUkeyId = null, DescriptionHindi = null, DescriptionGujarati = null        
    } = req.body;
    let {Img = ''} = req.body;

    Img = req?.files?.Img?.length ? `${req?.files?.Img[0]?.filename}` : Img;

    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys();

        const insertQuery = `
            INSERT INTO SpeakerMaster (
                SpeakerUkeyId, Name, Alias, Description, Email, Mobile, FB, Instagram, Youtube, Other, Img, 
                UsrName, UsrID, IpAddress, HostName, EntryDate, flag, OrganizerUkeyId, EventUkeyId, DescriptionHindi, DescriptionGujarati
            ) VALUES (
                ${setSQLStringValue(SpeakerUkeyId)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Alias)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(Mobile)}, ${setSQLStringValue(FB)}, 
                ${setSQLStringValue(Instagram)}, ${setSQLStringValue(Youtube)}, ${setSQLStringValue(Other)}, ${setSQLStringValue(Img)}, ${setSQLStringValue(UsrName)}, ${setSQLStringValue(UsrID)}, N'${IPAddress}', 
                N'${ServerName}', N'${EntryTime}', N'${flag}', ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(DescriptionHindi)}, ${setSQLStringValue(DescriptionGujarati)}
            );
        `;

        const deleteQuery = `
            DELETE FROM SpeakerMaster WHERE SpeakerUkeyId = '${SpeakerUkeyId}';
        `;

        if (flag === 'A') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });

            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }

            const result = await pool.request().query(insertQuery);

            if (result.rowsAffected[0] === 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Speaker Created.') });
            }

            return res.status(200).json({ 
                ...successMessage('New Speaker Created Successfully.'), 
                ...req.body, SpeakerUkeyId, Img 
            });

        } else if (flag === 'U') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });

            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }

            const oldImgResult = await pool.request().query(`
                SELECT Img FROM SpeakerMaster WHERE SpeakerUkeyId = '${SpeakerUkeyId}';
            `);
            const oldImg = oldImgResult.recordset?.[0]?.Img;

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Speaker Master Updated.') });
            }

            if (oldImg && req.files && req.files.Img && req.files.Img.length > 0) deleteImage('./media/Speaker/' + oldImg); // Only delete old image if it exists
            return res.status(200).json({ 
                ...successMessage('Speaker Master Updated Successfully.'), 
                ...req.body, SpeakerUkeyId, Img 
            });

        } else {
            if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsory to send flag.")
            });
        }
    } catch (error) {
        if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
        if (flag === 'A') {
            console.log('Add Speaker Master Error :', error);
        }
        if (flag === 'U') {
            console.log('Update Speaker Master Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveSpeaker = async (req, res) => {
    try {
        const { SpeakerUkeyId } = req.query;

        // Check if required keys are missing
        const missingKeys = checkKeysAndRequireValues(['SpeakerUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // Fetch the old image path before deleting the record
        const oldImgResult = await pool.request().query(`
            SELECT Img FROM SpeakerMaster WHERE SpeakerUkeyId = '${SpeakerUkeyId}';
        `);

        const oldImg = oldImgResult.recordset?.[0]?.Img; // Safely access the first record

        // Execute the DELETE query
        const deleteQuery = `
            DELETE FROM SpeakerMaster WHERE SpeakerUkeyId = '${SpeakerUkeyId}';
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Speaker Master Deleted.') });
        }

        // Delete the old image if it exists
        if (oldImg) {
            deleteImage('./media/Speaker/' + oldImg);
        }

        // Return success response
        return res.status(200).json({ ...successMessage('Speaker Master Deleted Successfully.'), SpeakerUkeyId });
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