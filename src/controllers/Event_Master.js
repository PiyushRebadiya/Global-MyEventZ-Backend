const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, deleteImage, setSQLDateTime, setSQLNumberValue, setSQLDecimalValue, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');
const { sendEmailOrganizerEventTemplatesArray } = require("./sendEmail");
const moment = require("moment");

const EventList = async (req, res) => {
    try {
        const { EventUkeyId, IsActive, OrganizerUkeyId, EventCategoryUkeyId } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (EventUkeyId) {
            whereConditions.push(`em.EventUkeyId = '${EventUkeyId}'`); // Specify alias 'em' for EventMaster
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`em.OrganizerUkeyId = '${OrganizerUkeyId}'`); // Specify alias 'em' for EventMaster
        }
        if (EventCategoryUkeyId) {
            whereConditions.push(`em.EventCategoryUkeyId = ${setSQLStringValue(EventCategoryUkeyId)}`); // Specify alias 'em' for EventMaster
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
            am.Address1, 
            am.Address2, 
            am.Pincode, 
            am.StateName,
            am.StateCode, 
            am.CityName, 
            am.IsPrimaryAddress, 
            am.IsActive AS IsActiveAddress, 
            om.OrganizerName, 
            ecm.CategoryName AS EventCategoryName,
            pgm.GatewayName,
            (
                SELECT du.FileName, du.Label, du.docukeyid
                FROM DocumentUpload du 
                WHERE du.UkeyId = em.EventUkeyId
                FOR JSON PATH
            ) AS FileNames,
			 (
                SELECT pgm.ShortName, pgm.GatewayName, pgm.ConvenienceFee, pgm.GST, pgm.DonationAmt, pgm.AdditionalCharges, pgm.IsActive, pgm.KeyId, pgm.SecretKey
                FROM PaymentGatewayMaster pgm 
                WHERE em.PaymentGateway = pgm.GatewayUkeyId
                FOR JSON PATH
            ) AS PaymentGatewayDetails
        FROM EventMaster em 
        LEFT JOIN AddressMaster am ON am.EventUkeyId = em.EventUkeyId 
        LEFT JOIN OrganizerMaster om ON om.OrganizerUkeyId = em.OrganizerUkeyId
        LEFT JOIN EventCategoryMaster ecm on em.EventCategoryUkeyId = ecm.EventCategoryUkeyId
        LEFT JOIN PaymentGatewayMaster pgm on em.PaymentGateway = pgm.GatewayUkeyId
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
        result.data?.forEach(event => {
            if(event.FileNames){
                event.FileNames = JSON.parse(event?.FileNames)
            } else {
                event.FileNames = []
            }
            if(event.PaymentGatewayDetails){
                event.PaymentGatewayDetails = JSON.parse(event?.PaymentGatewayDetails)
            } else {
                event.PaymentGatewayDetails = []
            }
        });
        return res.json(result);

    } catch (error) {
        return res.status(500).send(errorMessage(error?.message));
    }
};

const fetchEventById = async (req, res)=> {
    try{
        const {EventUkeyId, OrganizerUkeyId} = req.query

        const missingKeys = checkKeysAndRequireValues(['EventUkeyId', 'OrganizerUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (EventUkeyId) {
            whereConditions.push(`em.EventUkeyId = '${EventUkeyId}'`); // Specify alias 'em' for EventMaster
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`em.OrganizerUkeyId = '${OrganizerUkeyId}'`); // Specify alias 'em' for EventMaster
        }

        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const getUserList = {
            getQuery: `
            SELECT 
            em.*, 
            am.Address1, 
            am.Address2, 
            am.Pincode, 
            am.StateName,
            am.StateCode, 
            am.CityName, 
            am.IsPrimaryAddress, 
            am.IsActive AS IsActiveAddress, 
            om.OrganizerName, 
            ecm.CategoryName AS EventCategoryName,
            pgm.GatewayName,
            (
                SELECT du.FileName, du.Label, du.docukeyid
                FROM DocumentUpload du 
                WHERE du.UkeyId = em.EventUkeyId
                FOR JSON PATH
            ) AS FileNames,
			 (
                SELECT pgm.ShortName, pgm.GatewayName, pgm.ConvenienceFee, pgm.GST, pgm.DonationAmt, pgm.AdditionalCharges, pgm.IsActive, pgm.KeyId, pgm.SecretKey
                FROM PaymentGatewayMaster pgm 
                WHERE em.PaymentGateway = pgm.GatewayUkeyId
                FOR JSON PATH
            ) AS PaymentGatewayDetails
        FROM EventMaster em 
        LEFT JOIN AddressMaster am ON am.EventUkeyId = em.EventUkeyId 
        LEFT JOIN OrganizerMaster om ON om.OrganizerUkeyId = em.OrganizerUkeyId
        LEFT JOIN EventCategoryMaster ecm on em.EventCategoryUkeyId = ecm.EventCategoryUkeyId
        LEFT JOIN PaymentGatewayMaster pgm on em.PaymentGateway = pgm.GatewayUkeyId
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

        result.data?.forEach(event => {
            if(event.FileNames){
                event.FileNames = JSON.parse(event?.FileNames)
            } else {
                event.FileNames = []
            }
            if(event.PaymentGatewayDetails){
                event.PaymentGatewayDetails = JSON.parse(event?.PaymentGatewayDetails)
            } else {
                event.PaymentGatewayDetails = []
            }
        });

        return res.json(result);

    }catch(error){
        return res.status(500).json(errorMessage(error.message))
    }
}

const addEvent = async (req, res) => {
    const { flag, Event, Addresses } = req.body;
    const {
        EventUkeyId, OrganizerUkeyId, EventName, Alias, StartEventDate, EventDetails, IsActive = false, TicketLimit,
        EventCode = generateCODE(EventName), Location, PaymentGateway, Longitude, Latitude, EndEventDate, EventCategoryUkeyId, Tagline1, Tagline2, UserBookingLimit, BookingStartDate, BookingEndDate
    } = Event;

    let transaction;

    try {
        if (!['A', 'U'].includes(flag)) {
            return res.status(400).json(errorMessage("Invalid flag. Use 'A' for Add or 'U' for Update."));
        }

        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        // Ensure required fields exist
        const missingKeys = checkKeysAndRequireValues(
            ['EventUkeyId', 'OrganizerUkeyId', 'EventName'], { ...Event }
        );
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }
        const primaryAddress = Addresses.find(i => i.IsPrimaryAddress === true);
        
        // Start SQL transaction
        transaction = pool.transaction();
        await transaction.begin();

        if (flag === 'U') {
            await transaction.request().query(`
                DELETE FROM AddressMaster WHERE EventUkeyId = '${EventUkeyId}';
                DELETE FROM EventMaster WHERE EventUkeyId = '${EventUkeyId}';
            `);
        }

        // INSERT into EventMaster
        await transaction.request().query(`
            INSERT INTO EventMaster (
                EventUkeyId, OrganizerUkeyId, EventName, Alias, StartEventDate, EventCode, EventDetails, IsActive, IpAddress, HostName, EntryDate, flag, TicketLimit, Location, PaymentGateway, UserName, UserID, AddressUkeyId, Longitude, Latitude, EndEventDate, EventCategoryUkeyId, Tagline1, Tagline2, UserBookingLimit, BookingStartDate, BookingEndDate 
            ) VALUES (
                ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventName)}, ${setSQLStringValue(Alias)}, ${setSQLDateTime(StartEventDate)}, ${setSQLStringValue(EventCode)}, ${setSQLStringValue(EventDetails)}, ${setSQLBooleanValue(IsActive)}, '${IPAddress}', '${ServerName}', '${EntryTime}', '${flag}', ${setSQLNumberValue(TicketLimit)}, ${setSQLStringValue(Location)}, ${setSQLStringValue(PaymentGateway)}, ${setSQLStringValue(req.user.FirstName)}, ${setSQLNumberValue(req.user.UserId)}, ${setSQLStringValue(primaryAddress.AddressUkeyId)}, ${setSQLStringValue(Longitude)}, ${setSQLStringValue(Latitude)}, ${setSQLDateTime(EndEventDate)}, ${setSQLStringValue(EventCategoryUkeyId)}, ${setSQLStringValue(Tagline1)}, ${setSQLStringValue(Tagline2)}, ${setSQLNumberValue(UserBookingLimit)}, ${setSQLDateTime(BookingStartDate)}, ${setSQLDateTime(BookingEndDate)}
            );
        `);

        let addressValue = '';
        // INSERT multiple addresses
        if (Addresses && Addresses.length > 0) {
            for (const address of Addresses) {
                if (!address || typeof address !== "object") continue; // Skip invalid entries

                const {
                    AddressUkeyId, Alias, Address1, Address2, Pincode, StateCode, StateName, CityName, CountryName, IsPrimaryAddress, IsActive
                } = address;

                await transaction.request().query(`
                    INSERT INTO AddressMaster (
                        AddressUkeyID, EventUkeyId, OrganizerUkeyId, Alias, Address1, Address2, Pincode, StateCode, 
                        StateName, CityName, CountryName, IsPrimaryAddress, IsActive, flag, 
                        IpAddress, HostName, EntryDate, UsrName, UsreID
                    ) VALUES (
                        ${setSQLStringValue(AddressUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Alias)}, ${setSQLStringValue(Address1)}, ${setSQLStringValue(Address2)}, ${setSQLNumberValue(Pincode)}, ${setSQLNumberValue(StateCode)}, ${setSQLStringValue(StateName)}, 
                        ${setSQLStringValue(CityName)}, ${setSQLStringValue(CountryName)}, ${setSQLBooleanValue(IsPrimaryAddress)}, ${setSQLBooleanValue(IsActive)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(req.user.FirstName)}, ${setSQLNumberValue(req.user.UserId)}
                    );
                `);
                addressValue = [Address1, Address2, CityName, StateName, Pincode].filter(Boolean).join(', ');
            }
        }

        // Commit transaction
        await transaction.commit();
        let usersList = [];
        const organizerDetails = await pool.request().query(`
            SELECT Mobile1, Mobile2, OrganizerName FROM OrganizerMaster WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `);
        if(organizerDetails?.recordset?.length > 0 && setSQLBooleanValue(IsActive) === 1){
            const { Mobile1 = '', Mobile2 = '', OrganizerName = '' } = organizerDetails.recordset[0];

            const userDetails = await pool.request().query(`WITH EmailRanked AS (
                SELECT 
                    [UserId],
                    [UserUkeyId],
                    [FullName],
                    [Mobile1],
                    [Email],
                    [IsActive],
                    ROW_NUMBER() OVER (PARTITION BY LTRIM(RTRIM([Email])) ORDER BY [UserId]) AS rn
                FROM 
                    [GlobalMyEventZ].[dbo].[UserMaster]
                WHERE 
                    [Email] IS NOT NULL
                    AND LTRIM(RTRIM([Email])) <> '' AND IsActive = 1 AND UserUkeyId = '9CC5-AA2025-121c6a8e-17e1-4207-bc22-dd784cd17132-W'
            )
            SELECT 
                [UserId],
                [UserUkeyId],
                [FullName],
                [Mobile1],
                [Email],
                [IsActive]
            FROM 
                EmailRanked
            WHERE 
                rn = 1;
            `);

            if(userDetails?.recordset?.length > 0){
                usersList = userDetails.recordset;
            }
            setImmediate(async () => {
                const index= Math.floor(Math.random() * 5);
                for (const user of usersList) {
                    const { Email = '', FullName = '', UserUkeyId = '' } = user;
                    try {
                        const checkEmailLog = await pool.request().query(`SELECT * FROM EmailLogs WHERE UserUkeyId = ${setSQLStringValue(UserUkeyId)} AND EventUkeyId = ${setSQLStringValue(EventUkeyId)} AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} AND Category = 'EVENT_PUBLISHED'`);
                        if(checkEmailLog?.recordset?.length > 0){
                            console.log('Email already sent to this user', FullName, Email);
                        } else {
                      const responseSentMail = await sendEmailOrganizerEventTemplatesArray[index](
                            Email,
                            FullName || 'User',
                            EventName,
                            moment(StartEventDate).format("dddd, MMMM Do YYYY"),
                            moment(StartEventDate).format("h:mm A"),
                            addressValue,
                            Mobile1,
                            Mobile2,
                            OrganizerName
                        );
                        try {
                            const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);
                            
                            // Check already sent email
                            const insertQuery = `INSERT INTO [EmailLogs] ([OrganizerUkeyId],[EventUkeyId],[UkeyId],[Category],[Language],[Email],[IsSent],[UserUkeyId],[IpAddress],[HostName],[EntryTime],[flag]) VALUES (${setSQLStringValue(OrganizerUkeyId)},${setSQLStringValue(EventUkeyId)},${setSQLStringValue(generateUUID())},'EVENT_PUBLISHED','ENGLISH',${setSQLStringValue(Email)},${setSQLBooleanValue(responseSentMail)},${setSQLStringValue(UserUkeyId)},${setSQLStringValue(IPAddress)},${setSQLStringValue(ServerName)},GETDATE(),'A')`
                            await pool.request().query(insertQuery);
                            console.log(`Email sent to ${Email}:`, responseSentMail);
                        } catch (error) {
                            console.error('Error inserting into EmailLogs:', error);
                        }
                    }
                    } catch (err) {
                        console.error(`Failed to send email to ${Email}:`, err);
                    }
                }
            });
        }

        CommonLogFun({
            EventUkeyId : EventUkeyId, 
            OrganizerUkeyId : OrganizerUkeyId, 
            ReferenceUkeyId : EventUkeyId, 
            MasterName : EventName,  
            TableName : "EventMaster", 
            UserId : req.user.UserId, 
            UserName : req.user.FirstName, 
            IsActive : IsActive,
            flag : flag, 
            IPAddress : IPAddress, 
            ServerName : ServerName, 
            EntryTime : EntryTime
        })

        return res.status(200).json({
            ...successMessage(flag === 'A' ? 'New Event Created Successfully.' : 'Event Updated Successfully.'),
            ...req.body,
            EventUkeyId,
            EventCode
        });

    } catch (error) {
        console.error('Event Transaction Error:', error);
        if (transaction) await transaction.rollback(); // Rollback transaction on failure
        return res.status(500).send(errorMessage(error?.message || "Internal Server Error"));
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
    fetchEventById
}