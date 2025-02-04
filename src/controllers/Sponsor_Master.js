const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchSponsorMasterDetails = async (req, res)=>{
    try{
        const { SponsorUkeyId, IsActive, LinkType } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (SponsorUkeyId) {
            whereConditions.push(`SponsorUkeyId = '${SponsorUkeyId}'`);
        }
        if (LinkType) {
            whereConditions.push(`LinkType = ${setSQLStringValue(LinkType)}`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM SponsorMaster ${whereString} ORDER BY SponsorId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM SponsorMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const SponsorMaster = async (req, res) => {
    const { 
        SponsorUkeyId = generateUUID(), SponsorCatUkeyId = generateUUID(), Name = '', Mobile = '', CompanyName = '', UsrName = '', UsrID = '', flag = '' , OrganizerUkeyId = '',EventUkeyId = '', Description1 = '', Description2 = '', Description3 = '', Description4 = '', Link = '', LinkType = 'WEB'
    } = req.body;
    let {Img = ''} = req.body;

    Img = req?.files?.Img?.length ? `${req?.files?.Img[0]?.filename}` : Img;

    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys();

        const insertQuery = `
            INSERT INTO SponsorMaster (
                SponsorUkeyId, SponsorCatUkeyId, Name, Mobile, CompanyName, Img, UsrName, UsrID, IpAddress, HostName, EntryDate, flag, OrganizerUkeyId, EventUkeyId,Description1, Description2, Description3, Description4, Link, LinkType, OrganizerId
            ) VALUES (
                N'${SponsorUkeyId}', N'${SponsorCatUkeyId}', N'${Name}', N'${Mobile}', N'${CompanyName}', N'${Img}', N'${UsrName}', N'${UsrID}', N'${IPAddress}', N'${ServerName}', N'${EntryTime}', N'${flag}', N'${OrganizerUkeyId}', N'${EventUkeyId}', '${Description1}', '${Description2}', '${Description3}', '${Description4}', ${setSQLStringValue(Link)}, ${setSQLStringValue(LinkType)}, ${req?.user?.OrganizerId}
            );
        `;

        const deleteQuery = `
            DELETE FROM SponsorMaster WHERE SponsorUkeyId = '${SponsorUkeyId}';
        `;

        if (flag === 'A') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });

            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }

            const result = await pool.request().query(insertQuery);

            if (result?.rowsAffected?.[0] === 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Sponsor Created.') });
            }

            return res.status(200).json({ 
                ...successMessage('New Sponsor Created Successfully.'), 
                ...req.body, SponsorUkeyId, Img , SponsorCatUkeyId
            });

        } else if (flag === 'U') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });

            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }

            const oldImgResult = await pool.request().query(`
                SELECT Img FROM SponsorMaster WHERE SponsorUkeyId = '${SponsorUkeyId}';
            `);
            const oldImg = oldImgResult.recordset?.[0]?.Img;

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Sponsor Master Updated.') });
            }

            if (oldImg && req.files && req.files.Img && req.files.Img.length > 0) deleteImage('./media/Sponsor/' + oldImg); // Only delete old image if it exists
            return res.status(200).json({ 
                ...successMessage('New Sponsor Master Updated Successfully.'), 
                ...req.body, SponsorUkeyId, Img 
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
        const { SponsorUkeyId } = req.query;

        // Check if required keys are missing
        const missingKeys = checkKeysAndRequireValues(['SponsorUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // Fetch the old image path before deleting the record
        const oldImgResult = await pool.request().query(`
            SELECT Img FROM SponsorMaster WHERE SponsorUkeyId = '${SponsorUkeyId}';
        `);

        const oldImg = oldImgResult.recordset?.[0]?.Img; // Safely access the first record

        // Execute the DELETE query
        const deleteQuery = `
            DELETE FROM SponsorMaster WHERE SponsorUkeyId = '${SponsorUkeyId}';
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Sponsor Master Deleted.') });
        }

        // Delete the old image if it exists
        if (oldImg) {
            deleteImage('./media/Sponsor/' + oldImg);
        }

        // Return success response
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