const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue, getCommonAPIResponse, setSQLDateTime } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const AdminDashboardList = async (req, res) => {
    try {
        const { EventUkeyId, OrganizerUkeyId, StartDate = '', EndDate = '' } = req.query;
        const missingKey = checkKeysAndRequireValues(['EventUkeyId', 'OrganizerUkeyId'], req.query);
        
        if (missingKey.length > 0) {
            return res.status(400).send(errorMessage(`${missingKey} is required`));
        }

        const totalEvents = await pool.request().query(`
            SELECT COUNT(*) AS TotalEvents 
            FROM EventMaster WITH (NOLOCK) 
            WHERE OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `);

        const totalUsers = await pool.request().query(`
            SELECT COUNT(*) AS totalUsers 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const SumOfTotalBookingAmount = await pool.request().query(`
            SELECT SUM(BookingAmt) AS SumOfTotalBookingAmount 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const SumOfTotalConviencefee = await pool.request().query(`
            SELECT SUM(TotalConviencefee) AS SumOfTotalConviencefee 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const SumOfTotalDiscountAmt = await pool.request().query(`
            SELECT SUM(DiscountAmt) AS SumOfTotalDiscountAmt 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const SumOfTotalGST = await pool.request().query(`
            SELECT SUM(TotalGST) AS SumOfTotalGST 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const SumOfTotalNetAmount = await pool.request().query(`
            SELECT SUM(TotalNetAmount) AS SumOfTotalNetAmount 
            FROM Bookingmast WITH (NOLOCK) 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
            AND OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            ${StartDate && EndDate ? `AND CONVERT(DATE, EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
        `);

        const TotalTicketsBooked = await pool.request().query(`
            SELECT 
                COUNT(BD.BookingUkeyID) AS TotalTicketsBooked, 
                TCM.Category, TCM.TicketLimits
            FROM 
                TicketCategoryMaster TCM WITH (NOLOCK)
            LEFT JOIN 
                Bookingdetails BD WITH (NOLOCK) ON BD.TicketCateUkeyId = TCM.TicketCateUkeyId
            LEFT JOIN 
                Bookingmast BM WITH (NOLOCK) ON BD.BookingUkeyID = BM.BookingUkeyID
            WHERE 
                BM.EventUkeyId = ${setSQLStringValue(EventUkeyId)} 
                AND BM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                ${StartDate && EndDate ? `AND CONVERT(DATE, BD.EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
            GROUP BY 
                TCM.Category, TCM.TicketLimits
        
            UNION ALL
        
            SELECT 
                0 AS TotalTicketsBooked, 
                TCM.Category, TCM.TicketLimits
            FROM 
                TicketCategoryMaster TCM WITH (NOLOCK)
            WHERE 
                TCM.TicketCateUkeyId IN (
                    SELECT DISTINCT BD.TicketCateUkeyId 
                    FROM Bookingdetails BD WITH (NOLOCK)
                    LEFT JOIN Bookingmast BM WITH (NOLOCK) ON BD.BookingUkeyID = BM.BookingUkeyID
                    WHERE BM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
                    AND BM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                )
                AND NOT EXISTS (
                    SELECT 1 
                    FROM Bookingdetails BD WITH (NOLOCK)
                    LEFT JOIN Bookingmast BM WITH (NOLOCK) ON BD.BookingUkeyID = BM.BookingUkeyID
                    WHERE BM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
                    AND BM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
                    AND BD.TicketCateUkeyId = TCM.TicketCateUkeyId
                    ${StartDate && EndDate ? `AND CONVERT(DATE, BD.EntryDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}
                )
        `);

        return res.status(200).json({
            TotalEvents: totalEvents?.recordset[0]?.TotalEvents,
            TotalUsers: totalUsers?.recordset[0]?.totalUsers,
            SumOfTotalBookingAmount: SumOfTotalBookingAmount.recordset?.[0]?.SumOfTotalBookingAmount,
            SumOfTotalNetAmount: SumOfTotalNetAmount.recordset?.[0]?.SumOfTotalNetAmount,
            SumOfTotalConviencefee: SumOfTotalConviencefee.recordset?.[0]?.SumOfTotalConviencefee,
            SumOfTotalDiscountAmt: SumOfTotalDiscountAmt.recordset?.[0]?.SumOfTotalDiscountAmt,
            SumOfTotalGST: SumOfTotalGST.recordset?.[0]?.SumOfTotalGST,
            TotalTicketsBooked: TotalTicketsBooked.recordset,
        });

    } catch (error) {
        console.log('fetch super admin dashboard list error:', error);
        return res.status(500).json(errorMessage(error.message));
    }
};

const AdminDashboadChartList = async (req, res)=> {
    try{
        const { FetchType = 'DAY', EventUkeyId, OrganizerUkeyId, StartDate = null, EndDate = null, Month = null, Year = null} = req.query

        const query = `
            exec SP_TicketChartReport 
            @FetchType = ${setSQLStringValue(FetchType)},
            @OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)},
            @EventUkeyId= ${setSQLStringValue(EventUkeyId)},
            @StartDate = ${StartDate && EndDate ? `'${StartDate}'` : null},
            @EndDate = ${EndDate && StartDate ? `'${EndDate}'` : null},
            @Month = ${Month},
            @Year = ${Year}
        `
        const result = await pool.request().query(query)

        return res.status(200).json({Data : result.recordset})

    }catch(error) {
        console.log('fetch super admin dashboard list error :' ,error);
        return res.status(500).json(errorMessage(error.message))
    }
}

const TicketRegisterReport = async (req, res) => {
    try{
        const { 
            TicketCateUkeyId,
            UserUkeyID,
            OrganizerUkeyId,
            EventUkeyId,
            BookingUkeyID
        } = req.query;

        let whereConditions = [];

        if (TicketCateUkeyId) {
            whereConditions.push(`BD.TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)}`);
        }
        if (UserUkeyID) {
            whereConditions.push(`BM.UserUkeyID = ${setSQLStringValue(UserUkeyID)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`BM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`BM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (BookingUkeyID) {
            whereConditions.push(`BD.BookingUkeyID = ${setSQLStringValue(BookingUkeyID)}`);
        }

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getAutoSentNotificationList = {
            getQuery: `
                select BD.Name, BD.Mobile, BD.Amount, BD.DiscAmt, BD.TicketCateUkeyId, BD.EntryDate, BD.BookingUkeyID, TCM.Category, BM.UserUkeyID, UM.FullName, BM.TotalNetAmount from Bookingdetails BD
                left join TicketCategoryMaster TCM on BD.TicketCateUkeyId = TCM.TicketCateUkeyId
                left join Bookingmast BM on BD.BookingUkeyID = BM.BookingUkeyID 
                left join UserMaster UM on BM.UserUkeyID = UM.UserUkeyId
                ${whereString} order by EntryDate desc
            `,
            countQuery: `
                select COUNT(*) AS totalCount  from Bookingdetails BD
                left join TicketCategoryMaster TCM on BD.TicketCateUkeyId = TCM.TicketCateUkeyId
                left join Bookingmast BM on BD.BookingUkeyID = BM.BookingUkeyID 
                left join UserMaster UM on BM.UserUkeyID = UM.UserUkeyId
                ${whereString}
            `,
        };

        // Execute the query and return results
        const result = await getCommonAPIResponse(req, res, getAutoSentNotificationList);
        return res.json(result);
    }catch(error){
        console.log('ticket register report error : ', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

const TransactionReport = async (req, res)=> {
    try{
        const {OrganizerUkeyId, EventUkeyId, StartDate, EndDate} = req.query;
        let whereConditions = [];

        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if(StartDate && EndDate){
            whereConditions.push(`${StartDate && EndDate ? ` CONVERT(DATE, BookingDate) BETWEEN '${StartDate}' AND '${EndDate}'` : ''}`);
        }
        whereConditions.push(`IsPayment = 1`);

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const TransactionReport = {
            getQuery: `
                select * from TransactionReport
                ${whereString} order by BookingDate desc
            `,
            countQuery: `
                select COUNT(*) AS totalCount  from TransactionReport
                ${whereString}
            `,
        };
        // Execute the query and return results
        const result = await getCommonAPIResponse(req, res, TransactionReport);
        return res.json(result);
    }catch(error) {
        console.log('transaction report error : ', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

const TicketVerifyReport = async (req, res) => {
    try{
        const {EventUkeyId, OrganizerUkeyId, VerifiedByUkeyId} = req.query;
        let whereConditions = [];

        if (OrganizerUkeyId) {
            whereConditions.push(`bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (VerifiedByUkeyId) {
            whereConditions.push(`bd.VerifiedByUkeyId = ${setSQLStringValue(VerifiedByUkeyId)}`);
        }
        
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const VerifyReport = await pool.request().query(`
            SELECT 
                COUNT(*) AS TotalTickets,
                COUNT(CASE WHEN bd.IsVerify = 1 THEN 1 END) AS TotalTicketVerified,
                tcm.Category AS EventCategoryName,
                em.EventName,
                bm.EventUkeyId,
                bm.OrganizerUkeyId
            FROM Bookingdetails bd
            LEFT JOIN Bookingmast bm ON bm.BookingUkeyID = bd.BookingUkeyID
            LEFT JOIN TicketCategoryMaster tcm ON tcm.TicketCateUkeyId = bd.TicketCateUkeyId
            LEFT JOIN OrgUserMaster oum ON oum.UserUkeyId = bd.VerifiedByUkeyId
            LEFT JOIN EventMaster em ON em.EventUkeyId = bm.EventUkeyId
            WHERE bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
            AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} 
            GROUP BY tcm.Category, em.EventName, bm.EventUkeyId, bm.OrganizerUkeyId;
        `);

        const UserVerifiedTicketquery = `
        SELECT
            COUNT(*) AS TotalTickets,
            COUNT(CASE WHEN bd.IsVerify = 1 THEN 1 END) AS TotalTicketVerified,
            tcm.Category AS EventCategoryName,
            tcm.TicketCateUkeyId,
            bd.VerifiedByUkeyId,
            oum.FirstName AS verifierName,
            em.EventName,
            bm.EventUkeyId,
            bm.OrganizerUkeyId
        FROM Bookingdetails bd
        LEFT JOIN Bookingmast bm ON bm.BookingUkeyID = bd.BookingUkeyID
        LEFT JOIN TicketCategoryMaster tcm ON tcm.TicketCateUkeyId = bd.TicketCateUkeyId
        LEFT JOIN OrgUserMaster oum ON oum.UserUkeyId = bd.VerifiedByUkeyId
        LEFT JOIN EventMaster em ON em.EventUkeyId = bm.EventUkeyId
        WHERE bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        and bd.IsVerify=1
        AND (
            bd.VerifiedByUkeyId = ${VerifiedByUkeyId ? `'${VerifiedByUkeyId}'` : null}
            OR ${VerifiedByUkeyId ? `'${VerifiedByUkeyId}'` : null} IS NULL
        )
        GROUP BY
            tcm.Category,
            bd.VerifiedByUkeyId,
            oum.FirstName,
            em.EventName,
            bm.EventUkeyId,
            bm.OrganizerUkeyId,
            tcm.TicketCateUkeyId;
        `
        const UserVerifiedTicket = await pool.request().query(UserVerifiedTicketquery)
        // const UserVerifiedTicket = await pool.request().query(`
        //     select COUNT(*) AS TotalTickets,
        //     COUNT(CASE WHEN bd.IsVerify = 1 THEN 1 END) AS TotalTicketVerified
        //     , tcm.Category AS EventCategoryName, bd.VerifiedByUkeyId, oum.FirstName AS verifierName, em.EventName, bm.EventUkeyId, bm.OrganizerUkeyId from Bookingdetails bd
        //     left join Bookingmast bm on bm.BookingUkeyID = bd.BookingUkeyID
        //     left join TicketCategoryMaster tcm on tcm.TicketCateUkeyId = bd.TicketCateUkeyId
        //     left join OrgUserMaster oum on oum.UserUkeyId = bd.VerifiedByUkeyId
        //     left join EventMaster em on em.EventUkeyId = bm.EventUkeyId
        //     WHERE bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        //     AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} AND bd.VerifiedByUkeyId = ${setSQLStringValue(VerifiedByUkeyId)}
        //     group by tcm.Category, bd.VerifiedByUkeyId, oum.FirstName, em.EventName, bm.EventUkeyId, bm.OrganizerUkeyId
        // `)

        return res.status(200).json({
            TicketVerifyReport : VerifyReport.recordset,
            TicketVerifyReportOfUser : UserVerifiedTicket.recordset
        })
    }catch(error){
        console.log('transaction report error : ', error);
        return res.status(500).json(errorMessage(error.message));
    }
}

const TicketVerifyReportByTicketCategory = async (req, res) => {
    try{
        const {EventUkeyId, OrganizerUkeyId, VerifiedByUkeyId, TicketCateUkeyId} = req.query;
        let whereConditions = [];

        if (OrganizerUkeyId) {
            whereConditions.push(`bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (VerifiedByUkeyId) {
            whereConditions.push(`bd.VerifiedByUkeyId = ${setSQLStringValue(VerifiedByUkeyId)}`);
        }
        if (TicketCateUkeyId) {
            whereConditions.push(`tcm.TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)}`);
        }
        whereConditions.push(`bd.IsVerify = 1`);

        
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const TransactionReport = {
            getQuery: `
            select bd.*
            , tcm.Category AS EventCategoryName, oum.FirstName AS verifierName, em.EventName, bm.EventUkeyId, bm.OrganizerUkeyId, bm.TotalNetAmount from Bookingdetails bd
            left join Bookingmast bm on bm.BookingUkeyID = bd.BookingUkeyID
            left join TicketCategoryMaster tcm on tcm.TicketCateUkeyId = bd.TicketCateUkeyId
            left join OrgUserMaster oum on oum.UserUkeyId = bd.VerifiedByUkeyId
            left join EventMaster em on em.EventUkeyId = bm.EventUkeyId
                            ${whereString} order by BookingDate desc
            `,
            countQuery: `
                select count(*) AS totalCount from Bookingdetails bd
                left join Bookingmast bm on bm.BookingUkeyID = bd.BookingUkeyID
                left join TicketCategoryMaster tcm on tcm.TicketCateUkeyId = bd.TicketCateUkeyId
                left join OrgUserMaster oum on oum.UserUkeyId = bd.VerifiedByUkeyId
                left join EventMaster em on em.EventUkeyId = bm.EventUkeyId
                ${whereString}
            `,
        };
        const result = await getCommonAPIResponse(req, res, TransactionReport);
        return res.json(result);
    }catch(error){
        console.log('transaction report error : ', error);
        return res.status(500).json(errorMessage(error.message));
    }
}

const dashboardVolunteerCount = async (req, res) => {
    try{
        const {EventUkeyId, OrganizerUkeyId, } = req.query;
        let whereConditions = [];

        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        
        whereConditions.push(`Role = 'Volunteer'`);
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const TransactionReport = {
            getQuery: `
                select * from OrgUserMaster ${whereString} order by EntryDate desc
            `,
            countQuery: `
                select COUNT(*) AS totalCount from OrgUserMaster
                ${whereString}
            `,
        };
        const result = await getCommonAPIResponse(req, res, TransactionReport);
        return res.json(result);
    }catch(error){
        console.log('transaction report error : ', error);
        return res.status(500).json(errorMessage(error.message));
    }
}

module.exports = {
    AdminDashboardList,
    AdminDashboadChartList,
    TicketRegisterReport,
    TransactionReport,
    TicketVerifyReport,
    TicketVerifyReportByTicketCategory,
    dashboardVolunteerCount,
}