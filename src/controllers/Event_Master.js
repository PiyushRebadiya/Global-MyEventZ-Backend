const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, deleteImage, setSQLDateTime, setSQLNumberValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const EventList = async (req, res) => {
    try {
        const { EventUkeyId, IsActive, OrganizerUkeyId } = req.query;
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
        if (OrganizerUkeyId) {
            whereConditions.push(`em.OrganizerUkeyId = '${OrganizerUkeyId}'`); // Specify alias 'em' for EventMaster
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
                    am.MobileNumber, am.Email, om.OrganizerName 
                FROM 
                    EventMaster em 
                LEFT JOIN 
                    AddressMaster am 
                ON 
                    am.AddressUkeyID = em.AddressUkeyID 
				LEFT JOIN 
                    OrganizerMaster om 
                ON 
                    om.OrganizerUkeyId = em.OrganizerUkeyId  
                ${whereString} 
                ORDER BY em.EntryDate DESC
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
        OrganizerUkeyId = null, EventName = null, EventAlias = null, EventDate = null, EventDetails = null, IsActiveEvent = true, AddressAlias = null, Address1 = null, Address2 = null, Pincode = null, StateCode = null, StateName = null, CityName = null, CountryName = null, IsPrimaryAddress = null, IsActiveAddress = true, MobileNumber = null, Email = null, flag = null, EventUkeyId , AddressUkeyId , EventCode = generateCODE(EventName), Location = null, TicketLimit = null
    } = req.body;

    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const missingKeys = checkKeysAndRequireValues(['EventUkeyId', 'OrganizerUkeyId', 'AddressUkeyId', 'EventName', 'EventDate'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // SQL Queries
        const insertQuery = `
            INSERT INTO EventMaster (
                EventUkeyId, OrganizerUkeyId, EventName, Alias, EventDate, EventCode, EventDetails, AddressUkeyID, IsActive, IpAddress, HostName, EntryDate, flag, Location, TicketLimit
            ) VALUES (
                ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventName)}, ${setSQLStringValue(EventAlias)}, ${setSQLDateTime(EventDate)}, ${setSQLStringValue(EventCode)}, ${setSQLStringValue(EventDetails)}, ${setSQLStringValue(AddressUkeyId)}, ${setSQLBooleanValue(IsActiveEvent)}, '${IPAddress}', '${ServerName}', '${EntryTime}', '${flag}', ${setSQLStringValue(Location)}, ${setSQLNumberValue(TicketLimit)}
            );

            INSERT INTO AddressMaster (
                AddressUkeyID, EventUkeyId, OrganizerUkeyId, Alias, Address1, Address2, Pincode, StateCode, StateName, CityName, CountryName, IsPrimaryAddress, IsActive, MobileNumber, Email, flag, IpAddress, HostName, EntryDate
            ) VALUES (
                ${setSQLStringValue(AddressUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(AddressAlias)}, ${setSQLStringValue(Address1)}, ${setSQLStringValue(Address2)}, ${setSQLNumberValue(Pincode)}, ${setSQLNumberValue(StateCode)}, ${setSQLStringValue(StateName)}, ${setSQLStringValue(CityName)}, ${setSQLStringValue(CountryName)}, ${setSQLBooleanValue(IsPrimaryAddress)}, ${setSQLStringValue(IsActiveAddress)}, ${setSQLStringValue(MobileNumber)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}
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
                return res.status(400).json({ ...errorMessage('No Event Created.') });
            }

            return res.status(200).json({ ...successMessage('New Event Created Successfully.'), ...req.body, EventUkeyId, AddressUkeyId, EventCode });
        } else if (flag === 'U') {
            const deleteResult = await pool.request().query(deleteQuery);

            // INSERT new records
            const insertResult = await pool.request().query(insertQuery);

            // Ensure both operations succeed
            if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                return res.status(400).json({ ...errorMessage('No Event Updated.') });
            }

            return res.status(200).json({ ...successMessage('Event Updated Successfully.'), ...req.body, EventUkeyId, AddressUkeyId, EventCode });
        } else {
            return res.status(400).json({ ...errorMessage("Use 'A' flag to Add and 'U' flag to update. It is compulsory to send the flag.") });
        }
    } catch (error) {
        console.log('Event Error:', error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveEvent = async (req, res) => {
    try{
        const {EventUkeyId, OrganizerUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['EventUkeyId', 'OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const query = `
            DELETE FROM EventMaster WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
            DELETE FROM AddressMaster WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `
    
        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Event Deleted.')})
        }

        return res.status(200).json({...successMessage('New Event Deleted Successfully.'), ...req.query});
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