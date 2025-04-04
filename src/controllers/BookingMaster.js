const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLOrderId, setSQLStringValue, setSQLNumberValue, setSQLDecimalValue, setSQLDateTime, generateBookingCode } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchBookings = async (req, res) => {
    try {
        const { 
            SortBy = 'EntryDate', 
            SortOrder = 'DESC', 
            BookingUkeyID,
            EventUkeyId,
            OrganizerUkeyId,
            UserUkeyID,
            IsVerify
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
        if (IsVerify) {
            whereConditions.push(`IsVerify = ${setSQLBooleanValue(IsVerify)}`);
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

        const bookingDetails = await pool.request().query(`select BD.*, TCM.Category from Bookingdetails BD  left join TicketCategoryMaster TCM on BD.TicketCateUkeyId = TCM.TicketCateUkeyId where BD.BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`)

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
        BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId, RazorpayPaymentId, RazorpayOrderId, RazorpaySignatureId, IsWhatsapp, IsVerify, IsPayment, BookingCode = generateBookingCode()
    } = BookingMast
    try {
        if(flag !== 'A' && flag !== 'U'){
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to Update. It is compulsory to send the flag.")
            });
        }
        const missingKeys = checkKeysAndRequireValues(['flag', 'BookingMast', 'bookingdetails'], { ...req.body });
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);
        let sqlQuery = '';

        // ✅ Fetch ticket category limits and already booked tickets
        const ticketCategoryData = await pool.request().query(`
            SELECT COUNT(bd.BookingdetailID) AS TotalBookedTickets, 
                   bd.TicketCateUkeyId, 
                   tm.TicketLimits, 
                   tm.Category 
            FROM Bookingdetails bd
            LEFT JOIN Bookingmast bm ON bd.BookingUkeyID = bm.BookingUkeyID
            LEFT JOIN TicketCategoryMaster tm ON tm.TicketCateUkeyId = bd.TicketCateUkeyId
            WHERE bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
                  AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            GROUP BY bd.TicketCateUkeyId, tm.TicketLimits, tm.Category
        `);

        const categoryLimitExceeded = [];
        const categoryTicketCount = {};

        // ✅ Count new ticket requests per category
        bookingdetails.forEach(ticket => {
            const categoryId = ticket.TicketCateUkeyId;
            categoryTicketCount[categoryId] = (categoryTicketCount[categoryId] || 0) + 1;
        });

        // ✅ Check if any category exceeds its limit
        ticketCategoryData.recordset.forEach(category => {
            const requestedCount = categoryTicketCount[category.TicketCateUkeyId] || 0;
            const availableTickets = category.TicketLimits - category.TotalBookedTickets;

            if (requestedCount > availableTickets) {
                categoryLimitExceeded.push({
                    CategoryId: category.TicketCateUkeyId,
                    AvailableTickets: availableTickets,
                    CategoryName : category.Category
                });
            }
        });

        if (categoryLimitExceeded.length > 0) {
            const errorMsg = `Ticket limit exceeded for: ${categoryLimitExceeded.map(c => `${c.CategoryName} ${c.AvailableTickets} left`).join(', ')}`;
            return res.status(400).json({ ...errorMessage(errorMsg), categoryLimitExceeded });
        }
                        
        // ✅ Handle Update Scenario (flag === 'U')
        if (flag === 'U') {
            sqlQuery += `
                DELETE FROM Bookingmast WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)} AND EventUkeyId = ${setSQLStringValue(EventUkeyId)};
                DELETE FROM bookingdetails WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)};
            `;
        }

        sqlQuery += `
        INSERT INTO Bookingmast (
            BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, flag, IpAddress, HostName, EntryDate, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId, RazorpayPaymentId, RazorpayOrderId, RazorpaySignatureId, IsWhatsapp, IsVerify, IsPayment, BookingCode
        ) VALUES ( 
            ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(UserUkeyID)}, ${setSQLDateTime(BookingDate)}, ${setSQLNumberValue(BookingAmt)}, ${setSQLDecimalValue(TotalGST)}, ${setSQLDecimalValue(TotalConviencefee)}, ${setSQLDecimalValue(DiscountPer)}, ${setSQLDecimalValue(DiscountAmt)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLDecimalValue(TotalNetAmount)}, ${setSQLStringValue(CouponUkeyId)}, ${setSQLStringValue(RazorpayPaymentId)}, ${setSQLStringValue(RazorpayOrderId)}, ${setSQLStringValue(RazorpaySignatureId)}, ${setSQLBooleanValue(IsWhatsapp)}, ${setSQLBooleanValue(IsVerify)}, ${setSQLBooleanValue(IsPayment)}, ${setSQLStringValue(BookingCode)}
        );
        `;

        if(typeof bookingdetails === 'object' && bookingdetails.length > 0){
            for (const Detail of bookingdetails) {
                const {BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, Amount, DiscAmt} = Detail
                sqlQuery +=`insert into bookingdetails (
                    BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, flag, IpAddress, HostName, EntryDate, Amount, DiscAmt
                ) values (
                    ${setSQLStringValue(BookingdetailUkeyID)}, ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLDecimalValue(GST)}, ${setSQLDecimalValue(Conviencefee)}, ${setSQLStringValue(TicketCateUkeyId)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLDecimalValue(Amount)}, ${setSQLDecimalValue(DiscAmt)}
                );`
            }
        }

        // ✅ Execute Query
        const result = await pool.request().query(sqlQuery);

        if (result?.rowsAffected?.[0] === 0) {
            return res.status(400).json(errorMessage('No booking entry created.'));
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

const VerifyTicket = async (req, res)=> {
    try{
        const {BookingUkeyID, EventUkeyId, OrganizerUkeyId, UserUkeyID, IsWhatsapp = null, IsVerify = true, BookingCode = ''} = req.query;
        const missingKeys = checkKeysAndRequireValues(['BookingUkeyID', 'EventUkeyId', 'OrganizerUkeyId', 'UserUkeyID'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const IsTicketBooked = await pool.request().query(`select IsVerify from Bookingmast where BookingUkeyID = ${setSQLStringValue(BookingUkeyID)} and EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} and UserUkeyID = ${setSQLStringValue(UserUkeyID)} and BookingCode = ${setSQLStringValue(BookingCode)}`)

        if(IsTicketBooked.recordset[0].IsVerify){
            return res.status(400).json({...errorMessage(`Ticket already verifed`), verify : false})
        }

        const result = await pool.request().query(`
            exec SP_VerifyTicket
            @BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}, @EventUkeyId = ${setSQLStringValue(EventUkeyId)}, @OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}, @UserUkeyID = ${setSQLStringValue(UserUkeyID)}, @IsWhatsapp = ${setSQLBooleanValue(IsWhatsapp )}, @IsVerify = ${setSQLBooleanValue(IsVerify)}, @BookingCode = ${setSQLStringValue(BookingCode)}
        `)
        
        return res.status(200).json({...successMessage('Ticket Verifed successfully.'), verify : true});
    }catch(error){
        console.log('verify user ticket :', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

module.exports = {
    fetchBookings,
    fetchBookingInfoById,
    BookingMaster,
    RemoveBookings,
    VerifyTicket
}