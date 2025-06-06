const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLOrderId, setSQLStringValue, setSQLNumberValue, setSQLDecimalValue, setSQLDateTime, generateBookingCode } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');
const { sendEmailUserTickets, sendEmailUserTicketsHindi } = require("./sendEmail");
const moment = require("moment");

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

        result.data?.forEach(contact => {
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
            BookingUkeyID, BookingCode, EventUkeyId
        } = req.query;


        let whereConditions = [];
        let whereConditions2 = [];

        if (BookingUkeyID) {
            whereConditions.push(`BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`);
            whereConditions2.push(`BM.BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`);
        }

        if (BookingCode) {
            whereConditions.push(`BookingCode = ${setSQLStringValue(BookingCode)}`);
            whereConditions2.push(`BM.BookingCode = ${setSQLStringValue(BookingCode)}`);
        }

        if (EventUkeyId) {
            whereConditions2.push(`BM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const whereString2 = whereConditions2.length > 0 ? `WHERE ${whereConditions2.join(' AND ')}` : '';
        const getAutoSentNotificationList = {
            getQuery: `
            select * from bookinglistview ${whereString}
            `,
            countQuery: `
            select COUNT(*) AS totalCount from bookinglistview ${whereString}
            `,
        };
        const childQuery = `select BD.*, TCM.Category from Bookingdetails BD  left join TicketCategoryMaster TCM on BD.TicketCateUkeyId = TCM.TicketCateUkeyId left join Bookingmast BM on BD.BookingUkeyID =  BM.BookingUkeyID ${whereString2}`
        const bookingDetails = await pool.request().query(childQuery)

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
        BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId, RazorpayPaymentId, RazorpayOrderId, RazorpaySignatureId, IsWhatsapp, IsVerify, IsPayment, BookingCode = generateBookingCode(), IsDonationAmt
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

        // Fetch ticket category limits and already booked tickets
        const ticketCategoryData = await pool.request().query(`
            SELECT 
            COUNT(bd.BookingdetailID) AS TotalBookedTickets,
            tm.TicketCateUkeyId,
            tm.TicketLimits,
            tm.Category
            FROM TicketCategoryMaster tm
            LEFT JOIN Bookingdetails bd ON tm.TicketCateUkeyId = bd.TicketCateUkeyId
            LEFT JOIN Bookingmast bm ON bd.BookingUkeyID = bm.BookingUkeyID
                AND bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
                AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
            WHERE tm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
            GROUP BY tm.TicketCateUkeyId, tm.TicketLimits, tm.Category
        `);

        const categoryLimitExceeded = [];
        const categoryTicketCount = {};

        // Count new ticket requests per category
        bookingdetails?.forEach(ticket => {
            const categoryId = ticket.TicketCateUkeyId;
            categoryTicketCount[categoryId] = (categoryTicketCount[categoryId] || 0) + 1;
        });

        //  Check if any category exceeds its limit
        for (const category of ticketCategoryData.recordset) {
            const requestedCount = categoryTicketCount[category.TicketCateUkeyId] || 0;
            let availableTickets = category.TicketLimits - category.TotalBookedTickets;
            if (flag === 'U') {
                //  If updating, add back the user's current booking count before checking
                const userPreviousBooking = await pool.request().query(`
                    SELECT COUNT(*) AS PreviousBookedTickets
                    FROM Bookingdetails 
                    WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}
                    AND TicketCateUkeyId = ${setSQLStringValue(category.TicketCateUkeyId)}
                `);
                const previousBookingCount = userPreviousBooking.recordset?.[0]?.PreviousBookedTickets || 0;
        
                availableTickets += previousBookingCount;
            }
        
            if (requestedCount > availableTickets) {
                categoryLimitExceeded.push({
                    CategoryName: category.Category,
                    AvailableTickets: availableTickets
                });
            }
        };
        
        if (categoryLimitExceeded.length > 0) {
            const errorMsg = `Ticket limit exceeded for: ${categoryLimitExceeded.map(c => `${c.CategoryName} ${c.AvailableTickets} left`).join(', ')}`;
            return res.status(400).json({ ...errorMessage(errorMsg), categoryLimitExceeded });
        }
                        
        //  Handle Update Scenario (flag === 'U')
        if (flag === 'U') {
            sqlQuery += `
                DELETE FROM Bookingmast WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)} AND EventUkeyId = ${setSQLStringValue(EventUkeyId)};
                DELETE FROM bookingdetails WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyID)};
            `;
        }

        sqlQuery += `
        INSERT INTO Bookingmast (
            BookingUkeyID, UserUkeyID, BookingDate, BookingAmt, TotalGST, TotalConviencefee, DiscountPer, DiscountAmt, flag, IpAddress, HostName, EntryDate, EventUkeyId, OrganizerUkeyId, TotalNetAmount, CouponUkeyId, RazorpayPaymentId, RazorpayOrderId, RazorpaySignatureId, IsWhatsapp, IsVerify, IsPayment, BookingCode, IsDonationAmt
        ) VALUES ( 
            ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(UserUkeyID)}, ${setSQLDateTime(BookingDate)}, ${setSQLDecimalValue(BookingAmt)}, ${setSQLDecimalValue(TotalGST)}, ${setSQLDecimalValue(TotalConviencefee)}, ${setSQLDecimalValue(DiscountPer)}, ${setSQLDecimalValue(DiscountAmt)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLDecimalValue(TotalNetAmount)}, ${setSQLStringValue(CouponUkeyId)}, ${setSQLStringValue(RazorpayPaymentId)}, ${setSQLStringValue(RazorpayOrderId)}, ${setSQLStringValue(RazorpaySignatureId)}, ${setSQLBooleanValue(IsWhatsapp)}, ${setSQLBooleanValue(IsVerify)}, ${setSQLBooleanValue(IsPayment)}, ${setSQLStringValue(BookingCode)}, ${setSQLBooleanValue(IsDonationAmt)}
        );
        `;
        if(typeof bookingdetails === 'object' && bookingdetails.length > 0){
            for (const Detail of bookingdetails) {
                const {BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, Amount, DiscAmt, IsVerify, BookingMode, VerifyMode} = Detail
                sqlQuery +=`insert into bookingdetails (
                    BookingdetailUkeyID, BookingUkeyID, Name, Mobile, GST, Conviencefee, TicketCateUkeyId, flag, IpAddress, HostName, EntryDate, Amount, DiscAmt, IsVerify, BookingMode, VerifyMode
                ) values (
                    ${setSQLStringValue(BookingdetailUkeyID)}, ${setSQLStringValue(BookingUkeyID)}, ${setSQLStringValue(Name)}, ${setSQLStringValue(Mobile)}, ${setSQLDecimalValue(GST)}, ${setSQLDecimalValue(Conviencefee)}, ${setSQLStringValue(TicketCateUkeyId)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLDecimalValue(Amount)}, ${setSQLDecimalValue(DiscAmt)}, ${setSQLStringValue(IsVerify)}, ${setSQLStringValue(BookingMode)}, ${setSQLStringValue(VerifyMode)}
                );`
            }
        }

        //  Execute Query
        const result = await pool.request().query(sqlQuery);

        if (result?.rowsAffected?.[0] === 0) {
            return res.status(400).json(errorMessage('No booking entry created.'));
        }

        setImmediate(async () => {
            try {
                const userDetailsQuery = `SELECT * FROM UserMaster WHERE UserUkeyID = ${setSQLStringValue(UserUkeyID)}`;
                const userDetails = await pool.request().query(userDetailsQuery);
                if (userDetails?.recordset?.length > 0) {
                    const { Email, Mobile1, FullName = 'User' } = userDetails.recordset[0];
                    if (Email) {
                        const EventDetailsQuery = `SELECT am.Address1, am.Address2, am.StateName, am.CityName, am.Pincode, em.EventName, em.StartEventDate, em.OrganizerUkeyId, om.OrganizerName, om.Mobile1, om.Mobile2 
                    FROM EventMaster em
                    LEFT JOIN AddressMaster am ON am.AddressUkeyID = em.AddressUkeyID
                    LEFT JOIN OrganizerMaster om ON om.OrganizerUkeyId = em.OrganizerUkeyId
                    WHERE em.EventUkeyId = ${setSQLStringValue(EventUkeyId)} AND am.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`;

                        const EventDetails = await pool.request().query(EventDetailsQuery);
                        if (EventDetails?.recordset?.length > 0) {
                            const { EventName, StartEventDate, Address1, Address2, StateName, CityName, Pincode, OrganizerName, Mobile1, Mobile2 } = EventDetails.recordset[0];
                            const address = [Address1, Address2, CityName, StateName, Pincode].filter(Boolean).join(', ');
                            const ticketReport = `https://report.taxfile.co.in/report/TicketPrint?BookingUkeyID=${BookingUkeyID}&ExportMode=PDF`;

                            const responseTicketBookingEnglish = await sendEmailUserTickets(
                                Email, FullName, EventName,
                                moment.utc(StartEventDate).format("dddd, MMMM Do YYYY"),
                                address, ticketReport, Mobile1, Mobile2, OrganizerName
                            );

                            try {
                                const insertQueryEN = `INSERT INTO [EmailLogs] ([OrganizerUkeyId],[EventUkeyId],[UkeyId],[Category],[Language],[Email],[IsSent],[UserUkeyId],[IpAddress],[HostName],[EntryTime],[flag]) VALUES (${setSQLStringValue(OrganizerUkeyId)},${setSQLStringValue(EventUkeyId)},${setSQLStringValue(generateUUID())},'TICKET_BOOKING','ENGLISH',${setSQLStringValue(Email)},${setSQLBooleanValue(responseTicketBookingEnglish)},${setSQLStringValue(UserUkeyID)},${setSQLStringValue(IPAddress)},${setSQLStringValue(ServerName)},GETDATE(),'A')`;
                                await pool.request().query(insertQueryEN);
                                console.log('English email log inserted');
                            } catch (error) {
                                console.error('Error inserting English email log:', error);
                            }

                            const responseTicketBookingHindi = await sendEmailUserTicketsHindi(
                                Email, FullName, EventName,
                                moment.utc(StartEventDate).format("dddd, MMMM Do YYYY"),
                                address, ticketReport, Mobile1, Mobile2, OrganizerName
                            );

                            try {
                                const insertQueryHI = `INSERT INTO [EmailLogs] ([OrganizerUkeyId],[EventUkeyId],[UkeyId],[Category],[Language],[Email],[IsSent],[UserUkeyId],[IpAddress],[HostName],[EntryTime],[flag]) VALUES (${setSQLStringValue(OrganizerUkeyId)},${setSQLStringValue(EventUkeyId)},${setSQLStringValue(generateUUID())},'TICKET_BOOKING','HINDI',${setSQLStringValue(Email)},${setSQLBooleanValue(responseTicketBookingHindi)},${setSQLStringValue(UserUkeyID)},${setSQLStringValue(IPAddress)},${setSQLStringValue(ServerName)},GETDATE(),'A')`;
                                await pool.request().query(insertQueryHI);
                                console.log('Hindi email log inserted');
                            } catch (error) {
                                console.error('Error inserting Hindi email log:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error in background email job:', error);
            }
        });
        
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
        const {BookingUkeyID, EventUkeyId, OrganizerUkeyId, UserUkeyID, IsWhatsapp = null, IsVerify = true, BookingCode = '', VerifiedByUkeyId = '', VerifyMode = ''} = req.query;
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
            @BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}, @EventUkeyId = ${setSQLStringValue(EventUkeyId)}, @OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}, @UserUkeyID = ${setSQLStringValue(UserUkeyID)}, @IsWhatsapp = ${setSQLBooleanValue(IsWhatsapp )}, @IsVerify = ${setSQLBooleanValue(IsVerify)}, @BookingCode = ${setSQLStringValue(BookingCode)}, @VerifiedByUkeyId = ${setSQLStringValue(VerifiedByUkeyId)}, @VerifyMode = ${setSQLStringValue(VerifyMode)}
        `)
        
        return res.status(200).json({...successMessage('Ticket Verifed successfully.'), verify : true});
    }catch(error){
        console.log('verify user ticket :', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

const verifyTicketOnBookingDetailsUKkeyId = async (req, res) => {
    try{
        const {BookingdetailUkeyIDs, VerifiedByUkeyId, VerifyMode} = req.body;

        const missingKeys = checkKeysAndRequireValues(['BookingdetailUkeyIDs', 'VerifiedByUkeyId'], req.body);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const BookingdetailUkeyIDsArray = BookingdetailUkeyIDs?.split(',')

        for (const BookingdetailUkeyID of BookingdetailUkeyIDsArray) {
            await pool.request().query(`update Bookingdetails set IsVerify = 1, VerifiedByUkeyId = ${setSQLStringValue(VerifiedByUkeyId)}, VerifyMode = ${setSQLStringValue(VerifyMode)} where BookingdetailUkeyID = ${setSQLStringValue(BookingdetailUkeyID)}`)
        }

        return res.status(200).json({...successMessage('Ticket Verifed successfully.')});
    }catch(error){
        console.log('verify user ticket by booking detial UkeyId error :', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

const TicketLimit = async( req, res)=> {
    try{
        const {
            EventUkeyid, UserUkeyid, TicketRequest
        } = req.query;
        // Get booking limit for the event
        const EventBookingUserLimit = await pool.request().query(`
            SELECT UserBookingLimit
            FROM EventMaster
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyid)}
        `);
        // Get user's mobile
        const BookingUkeyuid = await pool.request().query(`
            SELECT BookingUkeyID
            FROM Bookingmast
            WHERE UserUkeyId = ${setSQLStringValue(UserUkeyid)}
            and EventUkeyId = ${setSQLStringValue(EventUkeyid)}
        `);
        // Total booked tickets by this mobile number (excluding current booking in update)
        const BookedTicketCount = await pool.request().query( `
            SELECT COUNT(*) AS BookiedTicketCount
            FROM BookingDetails
            WHERE BookingUkeyID = ${setSQLStringValue(BookingUkeyuid?.recordset?.[0]?.BookingUkeyID)}
        `);
        const totalBookedByUser = BookedTicketCount?.recordset?.[0]?.BookiedTicketCount || 0;
        const maxAllowed = EventBookingUserLimit?.recordset?.[0]?.UserBookingLimit || 0;
        // New ticket count in current request
        const totalAfterThisBooking = Number(totalBookedByUser) + Number(TicketRequest);
        console.log(totalAfterThisBooking, totalBookedByUser, TicketRequest);
        if (totalAfterThisBooking > maxAllowed) {
            return res.status(400).json({...errorMessage(
                `On this Mobile Number Booking limit exceeded. You can book only ${maxAllowed} ticket${maxAllowed > 1 ? 's' : ''} for this event on this Mobile Number.`
            ),verify : false});
        }
        return res.json({...successMessage('You can Go for Booking Now'),verify : true});
    }catch(error){
        console.error('Error fetching bookings:', error);
        return res.status(500).send(errorMessage(error?.message));
    }
}

module.exports = {
    fetchBookings,
    fetchBookingInfoById,
    BookingMaster,
    RemoveBookings,
    VerifyTicket,
    verifyTicketOnBookingDetailsUKkeyId,
    TicketLimit,
}