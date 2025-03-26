const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue, getCommonAPIResponse, setSQLDateTime } = require("../common/main");
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
        const { FetchType = 'DAY', EventUkeyId, OrganizerUkeyId, StartDate = null, EndDate = null} = req.query

        const query = `
            exec SP_TicketChartReport 
            @FetchType = ${setSQLStringValue(FetchType)},
            @OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)},
            @EventUkeyId= ${setSQLStringValue(EventUkeyId)},
            @StartDate = ${StartDate && EndDate ? `'${StartDate}'` : null},
            @EndDate = ${EndDate && StartDate ? `'${EndDate}'` : null}
        `
        console.log(query);
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