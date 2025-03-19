const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue, getCommonAPIResponse } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const SuperAdminDashoardList = async (req, res) => {
    try{
        const totalOrganizer = await pool.request().query(`
            select COUNT(*) as TotalOrganizers from OrganizerMaster
        `) 
        const totalEvents = await pool.request().query(`
            select COUNT(*) as TotalEvents from EventMaster
        `)
        const totalUsers = await pool.request().query(`
            select COUNT(*) as totalUsers from UserMaster
        `)
        
        res.status(200).json({
            TotalOrganizers : totalOrganizer?.recordset[0]?.TotalOrganizers,
            TotalEvents : totalEvents?.recordset[0]?.TotalEvents,
            TotalUsers : totalUsers?.recordset[0]?.totalUsers,
        })
    }catch(error){
        console.log('fetch super admin dashboard list error :' ,error);
    }
}

module.exports = {
    SuperAdminDashoardList
}