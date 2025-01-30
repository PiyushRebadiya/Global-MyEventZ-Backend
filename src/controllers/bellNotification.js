const { getCommonAPIResponse } = require("../common/main");
const { pool } = require("../sql/connectToDatabase");

const fetchBellNotificationList = async (req, res) => {
    try {
        const { NotificationStatus, BellNotificationUkeyId } = req.query;
        let whereConditions = [];
        if(NotificationStatus){
            whereConditions.push(`NotificationStatus = '${NotificationStatus}'`); 
        }
        if(BellNotificationUkeyId){
            whereConditions.push(`BellNotificationUkeyId = '${BellNotificationUkeyId}'`); 
        }
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM BellNotification ${whereString} ORDER BY BellNotificationID DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM BellNotification ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const fetchUserNotificationView = async (req, res) => {
    const notification = await pool.request().query(`SELECT * FROM BellNotification WHERE NotificationStatus = 'Active' AND Status = 1 ORDER BY BellNotificationID DESC`);
    const userNotification = await pool.request().query(`SELECT * FROM BellNotificationUser WHERE UserUkeyId = '${req.user.UserUkeyId}'`);
    const updateNotification = notification.recordset.map(notification => {
        const user = userNotification.recordset.find(user => user.BellNotificationUkeyId === notification.BellNotificationUkeyId);
        if (!user) return {
            ...notification,
            read: false
        };
        return { ...notification, read: true };
    })
    res.json({
        Success: true,
        data: updateNotification
    });
}

module.exports = {
    fetchBellNotificationList,
    fetchUserNotificationView
}