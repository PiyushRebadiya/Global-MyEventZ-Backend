const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLOrderId, setSQLStringValue, setSQLNumberValue, setSQLDecimalValue, setSQLDateTime } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchBookings = async (req, res) => {
    try {
        const { 
            SortBy = 'EntryDate', 
            SortOrder = 'DESC', 
            BookingUkeyID,
            EventUkeyId,
            OrganizerUkeyId,
            UserUkeyID
        } = req.query;

        let whereConditions = [];

        // Build the WHERE clause based on the query parameters
        if (BookingUkeyID) {
            whereConditions.push(`BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (UserUkeyID) {
            whereConditions.push(`UserUkeyID = ${setSQLStringValue(UserUkeyID)}`);
        }

        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Query definitions
        const getAutoSentNotificationList = {
            getQuery: `
            select * from bookinglistview 
                ${whereString}
                ORDER BY ${SortBy} ${SortOrder}
            `,
            countQuery: `
            select COUNT(*) AS totalCount from bookinglistview
                ${whereString}
            `,
        };

        // Execute the query and return results
        const result = await getCommonAPIResponse(req, res, getAutoSentNotificationList);

        result.data.forEach(contact => {
            contact.FileNames = contact.FileNames ? JSON.parse(contact.FileNames) : [];
        });

        return res.json(result);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

const fetchBookingInfoById = async( req, res)=> {
    try{
        const { 
            BookingUkeyID
        } = req.query;

        const missingKeys = checkKeysAndRequireValues(['BookingUkeyID'], req.query)
        if (missingKeys.length > 0) {
            return res.status(400).send(errorMessage(`${missingKeys.join(', ')} is required`));
        }

        let whereConditions = [];

        if (BookingUkeyID) {
            whereConditions.push(`BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`);
        }

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getAutoSentNotificationList = {
            getQuery: `
            select * from bookinglistview ${whereString}
            `,
            countQuery: `
            select COUNT(*) AS totalCount from bookinglistview ${whereString}
            `,
        };

        const bookingDetails = await pool.request().query(`select * from Bookingdetails where BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`)

        // Execute the query and return results
        const result = await getCommonAPIResponse(req, res, getAutoSentNotificationList);
        if(result.data.length > 0){
            result.data[0].Bookingdetails = bookingDetails.recordset
        }
        result.data.forEach(contact => {
            contact.FileNames = contact.FileNames ? JSON.parse(contact.FileNames) : [];
        });
        return res.json({ BookingMaster : result.data[0] });
    }catch(error){
        console.error('Error fetching bookings:', error);
        return res.status(500).send(errorMessage(error?.message));
    }
}

const BookingMaster = async (req, res) => {
    const {
        flag, BookingMast, bookingdetails
    } = req.body;
    const {
        BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId
    } = BookingMast
    try {
        if(flag !== 'A' && flag !== 'U'){
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to Update. It is compulsory to send the flag.")
            });
        }
        const missingKeys = checkKeysAndRequireValues(['flag', 'BookingMast', 'bookingdetails'], { ...req.body });
        if (missingKeys.length > 0) {
            return res.status(400).send(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);
        let query = ''

        if(flag === 'U'){
            query += `
            delete from Bookingmast where BookingUkeyID = ${setSQLStringValue(BookingUkeyID)} and  EventUkeyId = ${setSQLStringValue(EventUkeyId)};
            delete from bookingdetails where BookingUkeyID = ${setSQLStringValue(BookingUkeyID)};
            `
        }

        query += `
        INSERT INTO Bookingmast (
            BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, flag, IpAddress, HostName, EntryDate, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId
        ) VALUES ( 
            ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(UserUkeyID)}, ${setSQLDateTime(BookingDate)}, ${setSQLNumberValue(BookingAmt)}, ${setSQLDecimalValue(TotalGST)}, ${setSQLDecimalValue(TotalConviencefee)}, ${setSQLDecimalValue(DiscountPer)}, ${setSQLDecimalValue(DiscountAmt)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLDecimalValue(TotalNetAmount)}, ${setSQLStringValue(CouponUkeyId)}
        );
        `;

        if(typeof bookingdetails === 'object' && bookingdetails.length > 0){
            for (const Detail of bookingdetails) {
                const {BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, Amount, DiscAmt} = Detail
                query +=`insert into bookingdetails (
                    BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, flag, IpAddress, HostName, EntryDate, Amount, DiscAmt
                ) values (
                    ${setSQLStringValue(BookingdetailUkeyID)}, ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLDecimalValue(GST)}, ${setSQLDecimalValue(Conviencefee)}, ${setSQLStringValue(TicketCateUkeyId)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLDecimalValue(Amount)}, ${setSQLDecimalValue(DiscAmt)}
                );`
            }
        }
        const result = await pool.request().query(query)

        if (result?.rowsAffected?.[0] === 0) {
            return res.status(400).json(errorMessage('No Booking Entry Created.'));
        }
        return res.status(200).json({ 
            ...successMessage('New Booking Entry Created Successfully.'), 
            ...req.body 
        });
    } catch (error) {
        console.error(flag === 'A' ? 'Add AutoSentNotification Error:' : 'Update AutoSentNotification Error:', error);
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveBookings = async (req, res) => {
    try {
        const { BookingUkeyID, EventUkeyId, OrganizerUkeyId } = req.query;
        // Check if required keys are missing
        const missingKeys = checkKeysAndRequireValues(['BookingUkeyID', 'EventUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // Execute the DELETE query
        const deleteQuery = `
            DELETE FROM Bookingmast WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)} AND EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)};
            DELETE FROM Bookingdetails WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)};
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Booking Entry Deleted.') });
        }

        // Return success response
        return res.status(200).json({ ...successMessage('Booking Entry Deleted Successfully.'), ...req.query });
    } catch (error) {
        console.log('Delete Booking Entry Error :', error);
        return res.status(500).json({ ...errorMessage(error.message) });
    }
};



module.exports = {
    fetchBookings,
    fetchBookingInfoById,
    BookingMaster,
    RemoveBookings
}