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
        res.status(200).json({
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

module.exports = {
    AdminDashboardList
}