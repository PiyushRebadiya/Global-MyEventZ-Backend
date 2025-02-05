const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, deleteImage, setSQLDateTime, setSQLNumberValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const EventList = async (req, res) => {
    try {
        const { EventUkeyId, IsActive } = req.query;
        let whereConditions = [];

        if(req.user.Role === 'SuperAdmin'){
        } else if(req.user.Role === 'Admin'){
            whereConditions.push(`em.OrganizerUkeyId = '${req.user.OrganizerUkeyId}'`);
        }else if(req.user.Role === 'SubAdmin'){
            whereConditions.push(`em.OrganizerUkeyId = '${req.user.ParentOrganizerUkeyId}'`);
        } else {
            whereConditions.push(`em.OrganizerUkeyId = '123'`);
        }

        // Build the WHERE clause based on the Status
        if (EventUkeyId) {
            whereConditions.push(`em.EventUkeyId = '${EventUkeyId}'`); // Specify alias 'em' for EventMaster
        }
        if (IsActive) {
            whereConditions.push(`em.IsActive = ${setSQLBooleanValue(IsActive)}`); // Specify alias 'em' for EventMaster
        }

        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const getUserList = {
            getQuery: `
                SELECT 
                    em.*, 
                    am.Address1, am.Address2, am.Pincode, am.StateName, am.CityName, 
                    am.IsPrimaryAddress, am.IsActive AS IsActiveAddress, 
                    am.MobileNumber, am.Email 
                FROM 
                    EventMaster em 
                LEFT JOIN 
                    AddressMaster am 
                ON 
                    am.AddressUkeyID = em.AddressUkeyID 
                ${whereString} 
                ORDER BY em.EventId DESC
            `,
            countQuery: `
                SELECT COUNT(*) AS totalCount 
                FROM EventMaster em 
                ${whereString}
            `,
        };

        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    } catch (error) {
        return res.status(500).send(errorMessage(error?.message));
    }
};

const addEvent = async (req, res) => {
    const {
        OrganizerUkeyId = null, EventName = null, EventAlias = null, EventDate = null, EventDetails = null, IsActiveEvent = true, AddressAlias = null, TypeofAddress = null, Address1 = null, Address2 = null, Pincode = null, StateCode = null, StateName = null, CityName = null, CountryName = null, IsPrimaryAddress = null, IsActiveAddress = true, MobileNumber = null, Email = null, flag = null, EventUkeyId =  generateUUID(), AddressUkeyId = generateUUID(), EventCode = generateCODE(EventName), Location = null, IsRazorpay = false, TicketLimit = null
    } = req.body;

    let {Img1 = null, Img2 = null, Img3 = null} = req.body

    Img1 = req?.files?.Img1?.length ? `${req?.files?.Img1[0]?.filename}` : Img1;
    Img2 = req?.files?.Img2?.length ? `${req?.files?.Img2[0]?.filename}` : Img2;
    Img3 = req?.files?.Img3?.length ? `${req?.files?.Img3[0]?.filename}` : Img3;

    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys();

        // SQL Queries
        const insertQuery = `
            INSERT INTO EventMaster (
                EventUkeyId, OrganizerUkeyId, EventName, Alias, EventDate, EventCode, EventDetails, AddressUkeyID, IsActive, Img1, Img2, Img3, IpAddress, HostName, EntryDate, flag, Location, IsRazorpay, OrganizerId, TicketLimit
            ) VALUES (
                ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventName)}, ${setSQLStringValue(EventAlias)}, ${setSQLDateTime(EventDate)}, ${setSQLStringValue(EventCode)}, ${setSQLStringValue(EventDetails)}, ${setSQLStringValue(AddressUkeyId)}, ${setSQLBooleanValue(IsActiveEvent)}, ${setSQLStringValue(Img1)}, ${ setSQLStringValue(Img2)}, ${setSQLStringValue(Img3)}, '${IPAddress}', '${ServerName}', '${EntryTime}', '${flag}', ${setSQLStringValue(Location)}, ${setSQLBooleanValue(IsRazorpay)}, ${setSQLNumberValue(req?.user?.OrganizerId)}, ${setSQLNumberValue(TicketLimit)}
            );

            INSERT INTO AddressMaster (
                AddressUkeyID, EventUkeyId, OrganizerUkeyId, Alias, TypeofAddress, Address1, Address2, Pincode, StateCode, StateName, CityName, CountryName, IsPrimaryAddress, IsActive, MobileNumber, Email
            ) VALUES (
                ${setSQLStringValue(AddressUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(AddressAlias)}, ${setSQLStringValue(TypeofAddress)}, ${setSQLStringValue(Address1)}, ${setSQLStringValue(Address2)}, ${setSQLNumberValue(Pincode)}, ${setSQLNumberValue(StateCode)}, ${setSQLStringValue(StateName)}, ${setSQLStringValue(CityName)}, ${setSQLStringValue(CountryName)}, ${setSQLBooleanValue(IsPrimaryAddress)}, ${setSQLStringValue(IsActiveAddress)}, ${setSQLStringValue(MobileNumber)}, ${setSQLStringValue(Email)}
            );
        `;

        const deleteQuery = `
            DELETE FROM AddressMaster WHERE EventUkeyId = '${EventUkeyId}';
            DELETE FROM EventMaster WHERE EventUkeyId = '${EventUkeyId}';
        `;

        // Handle Add or Update
        if (flag === 'A') {
            const result = await pool.request().query(insertQuery);

            if (result.rowsAffected[0] === 0) {
                if (Img1) deleteImage(req?.files?.Img1?.[0]?.path); // Only delete if `Img` exists
                if (Img2) deleteImage(req?.files?.Img2?.[0]?.path); // Only delete if `Img` exists
                if (Img3) deleteImage(req?.files?.Img3?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Event Created.') });
            }

            return res.status(200).json({ ...successMessage('New Event Created Successfully.'), ...req.body, EventUkeyId, AddressUkeyId, EventCode, Img1, Img2, Img3 });
        } else if (flag === 'U') {

            try {
                // DELETE existing records
                const deleteResult = await pool.request().query(deleteQuery);

                // FETCH old image records
                const oldImgsResult =await pool.request().query(`SELECT * FROM EventMaster WHERE EventUkeyId = '${EventUkeyId}'`);

                // INSERT new records
                const insertResult = await pool.request().query(insertQuery);

                // Ensure both operations succeed
                if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                    if (Img1) deleteImage(req?.files?.Img1?.[0]?.path); 
                    if (Img2) deleteImage(req?.files?.Img2?.[0]?.path); 
                    if (Img3) deleteImage(req?.files?.Img3?.[0]?.path);     
                    return res.status(400).json({ ...errorMessage('No Event Updated.') });
                }

                oldImg1 = oldImgsResult?.recordset?.[0]?.Img1;
                oldImg2 = oldImgsResult?.recordset?.[0]?.Img2;
                oldImg3 = oldImgsResult?.recordset?.[0]?.Img3;

                if (oldImg1 && req.files && req.files.oldImg1 && req.files.oldImg1.length > 0) deleteImage('./media/Event/' + oldImg1); 

                if (oldImg2 && req.files && req.files.oldImg2 && req.files.oldImg2.length > 0) deleteImage('./media/Event/' + oldImg2); 

                if (oldImg3 && req.files && req.files.oldImg3 && req.files.oldImg3.length > 0) deleteImage('./media/Event/' + oldImg3); 

                return res.status(200).json({ ...successMessage('Event Updated Successfully.'), ...req.body, EventUkeyId, AddressUkeyId, EventCode });
            } catch (error) {
                if (Img1) deleteImage(req?.files?.Img1?.[0]?.path); 
                if (Img2) deleteImage(req?.files?.Img2?.[0]?.path); 
                if (Img3) deleteImage(req?.files?.Img3?.[0]?.path); 
            }
        } else {
            if (Img1) deleteImage(req?.files?.Img1?.[0]?.path); 
            if (Img2) deleteImage(req?.files?.Img2?.[0]?.path); 
            if (Img3) deleteImage(req?.files?.Img3?.[0]?.path); 
            return res.status(400).json({ ...errorMessage("Use 'A' flag to Add and 'U' flag to update. It is compulsory to send the flag.") });
        }
    } catch (error) {
        if (Img1) deleteImage(req?.files?.Img1?.[0]?.path); 
        if (Img2) deleteImage(req?.files?.Img2?.[0]?.path); 
        if (Img3) deleteImage(req?.files?.Img3?.[0]?.path); 
        if (flag === 'A') {
            console.log('Add Event Error:', error);
        }
        if (flag === 'U') {
            console.log('Update Event Error:', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveEvent = async (req, res) => {
    try{
        const {EventUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['EventUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const oldRecordQuery = `
            SELECT * 
            FROM EventMaster 
            WHERE EventUkeyId = '${EventUkeyId}';
        `;
        const oldRecordResult = await pool.request().query(oldRecordQuery);
        oldImg1 = oldRecordResult?.recordset?.[0]?.Img1
        oldImg2 = oldRecordResult?.recordset?.[0]?.Img2
        oldImg3 = oldRecordResult?.recordset?.[0]?.Img3

        const query = `
            DELETE FROM EventMaster WHERE EventUkeyId = '${EventUkeyId}'
            DELETE FROM AddressMaster WHERE EventUkeyId = '${EventUkeyId}'
        `
    
        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Event Deleted.')})
        }

        if (oldImg1) deleteImage('./media/Event/' + oldImg1); 

        if (oldImg2) deleteImage('./media/Event/' + oldImg2); 

        if (oldImg3) deleteImage('./media/Event/' + oldImg3); 

        return res.status(200).json({...successMessage('New Event Deleted Successfully.')});
    }catch(error){
        console.log('Delete Event Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    EventList,
    addEvent,
    RemoveEvent,
}