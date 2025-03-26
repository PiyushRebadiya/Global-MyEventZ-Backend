const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue, getCommonAPIResponse } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const AdminDashboardList = async (req, res) => {
    try{
        const {EventUkeyId, OrganizerUkeyId} = req.query
        const totalEvents = await pool.request().query(`
            select COUNT(*) as TotalEvents from EventMaster where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const totalUsers = await pool.request().query(`
            select COUNT(*) as totalUsers from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const SumOfTotalBookingAmount = await pool.request().query(`
            select SUM(BookingAmt) as SumOfTotalBookingAmount from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const SumOfTotalConviencefee = await pool.request().query(`
            select SUM(TotalConviencefee) as SumOfTotalConviencefee from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const SumOfTotalDiscountAmt = await pool.request().query(`
            select SUM(DiscountAmt) as SumOfTotalDiscountAmt from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const SumOfTotalGST = await pool.request().query(`
            select SUM(TotalGST) as SumOfTotalGST from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        const SumOfTotalNetAmount = await pool.request().query(`
            select SUM(TotalNetAmount) as SumOfTotalNetAmount from Bookingmast where EventUkeyId = ${setSQLStringValue(EventUkeyId)} and OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}
        `)
        return res.status(200).json({
            TotalEvents : totalEvents?.recordset[0]?.TotalEvents,
            TotalUsers : totalUsers?.recordset[0]?.totalUsers,
            SumOfTotalBookingAmount : SumOfTotalBookingAmount.recordset?.[0]?.SumOfTotalBookingAmount,
            SumOfTotalNetAmount : SumOfTotalNetAmount.recordset?.[0].SumOfTotalNetAmount,
            SumOfTotalConviencefee : SumOfTotalConviencefee.recordset?.[0].SumOfTotalConviencefee,
            SumOfTotalDiscountAmt : SumOfTotalDiscountAmt.recordset?.[0]?.SumOfTotalDiscountAmt,
            SumOfTotalGST : SumOfTotalGST.recordset?.[0].SumOfTotalGST,
        })
    }catch(error){
        console.log('fetch super admin dashboard list error :' ,error);
    }
}

const AdminDashboadChartList = async (req, res)=> {
    try{
        const {EventUkeyId, OrganizerUkeyId, StartDate, EndDate} = req.query
        let whereConditions = [];

        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }

        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if(StartDate && EndDate){
            whereConditions.push(`EntryDate = ${setSQLStringValue(OrganizerUkeyId)}`);
        }

        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const daywisedata = await pool.request().query(`
            SELECT 
            COUNT(*) AS TotalTicketsBooked, 
            CONVERT(DATE, BM.BookingDate) AS BookingDate
            FROM 
            Bookingdetails BD
            LEFT JOIN  
            Bookingmast BM ON BD.BookingUkeyID = BM.BookingUkeyID
            WHERE 
            BM.OrganizerUkeyId = '20CC3-AA2025-b17e44ab-f3d6-49a4-b671-412564dbd6ce-W' 
            AND BM.EventUkeyId = '07827632-4706-4F0C-AF3E-B52CA78489ED'
            AND CONVERT(DATE, BM.BookingDate) >= '2025-03-24'
            ANd CONVERT(DATE, BM.BookingDate) <= '2025-03-25'
            GROUP BY 
            CONVERT(DATE, BM.BookingDate);
        `)

        const monthwisedata = await pool.request().query(`
            SELECT YEAR(BookingDate) AS Year,MONTH(BookingDate) AS MonthNumber, DATENAME(MONTH, BookingDate) AS MonthName,SUM(TotalNetAmount) AS TotalAmount , COUNT(BD.BookingdetailUkeyID) AS TotalTickets
            FROM Bookingmast BM
            left join Bookingdetails BD on BM.BookingUkeyID = BD.BookingUkeyID
            WHERE OrganizerUkeyId = '20CC3-AA2025-b17e44ab-f3d6-49a4-b671-412564dbd6ce-W' 
            AND EventUkeyId = '07827632-4706-4F0C-AF3E-B52CA78489ED'
            GROUP BY YEAR(BookingDate), MONTH(BookingDate),
            DATENAME(MONTH, BookingDate) ORDER BY Year, MonthNumber;
        `)

    }catch(error) {
        console.log('fetch super admin dashboard list error :' ,error);
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
                select BD.Name, BD.Mobile, BD.Amount, BD.DiscAmt, BD.TicketCateUkeyId, BD.EntryDate, BD.BookingUkeyID, TCM.Category, BM.UserUkeyID, UM.FullName from Bookingdetails BD
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

module.exports = {
    AdminDashboardList,
    AdminDashboadChartList,
    TicketRegisterReport,
}