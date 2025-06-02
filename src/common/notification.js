// const fs_extra = require('fs-extra');
// const moment = require('moment');
// const {sentNotificationOnSetTime} = require('../controller/sentNotification');
// const { getCommonKeys, setSQLBooleanValue } = require('./main');
// const { autoVerifyNotification } = require('../controller/autoRunQuery');

const { pool } = require("../sql/connectToDatabase");
const { sentNotificationOnSetTime } = require("../controllers/firebaseSentNotification");
const { getCommonKeys, setSQLBooleanValue, setSQLStringValue } = require("./main");

const sendNotificationOnSetTime = async () => {
    console.log("send notification on specific time", new Date());
    try {
        // Fetch pending notifications
        const Notifications = await pool.query(`
            select * from ReminderMaster WHERE IsActive = 1 AND SentTime < getdate()
        `);

        // Fetch users with active status
        const users = await pool.query(`SELECT DISTINCT NotificationToken
                                        FROM user_devices
                                        WHERE 
                                        Log_In = 1 
                                        AND Log_Out = 0 
                                        AND DeviceType = 'Android' 
                                        AND NotificationToken IS NOT NULL 
                                        AND NotificationToken <> ''`);
        // const users = await pool.query(`
        //     SELECT NotificationToken FROM UserMaster WHERE IsLogin = 1 AND IsActive = 1
        // `);

        // Iterate through notifications
        for (const notification of Notifications.recordset) {
            await sendNotificaton(notification, users.recordset);
            console.log('notification : ', notification);
            const updateQuery = `
            UPDATE ReminderMaster 
            SET IsActive = 0 
            WHERE ReminderUkeyId = ${setSQLStringValue(notification.ReminderUkeyId)}
            `
            await pool.request().query(updateQuery);
            if(notification?.BellNotification){
                await addInnerNotification(notification);
            }
        }
    } catch (error) {
        console.log('send notification on specific time error:', error);
    }
}

const sendNotificaton = async (notification, users) => {
    for (const user of users) {
        if (user.NotificationToken) {
            await sentNotificationOnSetTime({
                body: {
                    Title: notification.Title,
                    Description: notification.Description,
                    NotificationToken: user.NotificationToken,
                    Image: notification.Image,
                    Link: notification.Link
                }
            });
        }
    }
}

const addInnerNotification = async (notification) => {
    const { IPAddress, ServerName, EntryTime } = getCommonKeys();
    const LinkType = notification.LinkType === 'App' ? 1 : 2;

    // Format the date using moment.js
    const formattedDate = moment(notification.SentTime).format('YYYY-MM-DD');
    const EndDate = moment(notification.SentTime).add(2, 'days').format('YYYY-MM-DD');

    const insertQuery = `INSERT INTO tbl_notification (Title,Description,Image,StartDate,EndDate,Status,Link,LinkType,IPAddress,ServerName,EntryTime) VALUES (
        N'${notification.Title}',
        N'${notification.Description}',
        '${notification.Image}', 
        '${formattedDate}', 
        '${EndDate}', 
        ${setSQLBooleanValue(true)},
        '${notification.Link}',
        '${LinkType}',
        '${IPAddress}',
        '${ServerName}',
        '${EntryTime}'
    )`;

    const result = await pool.query(insertQuery);
    await autoVerifyNotification();
};

const autoSendEventReview = async () => {
    try {
        // let EventReviewArr = [];
        const eventReviewQuery = `SELECT
                                em.OrganizerUkeyId,
                                em.EventUkeyId,
                                    em.EndEventDate,
                                    em.EventName,
                                    du.FileName
                                FROM EventMaster em 
                                OUTER APPLY (
                                    SELECT TOP 1 du.FileName
                                    FROM DocumentUpload du
                                    WHERE du.UkeyId = em.EventUkeyId
                                ) du
                                WHERE CAST(em.EndEventDate AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)`;
        // WHERE CAST(em.EndEventDate AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)`;
        const eventReview = await pool.query(eventReviewQuery);
        if (eventReview.recordset.length > 0) {
            for (const event of eventReview.recordset) {
                const { OrganizerUkeyId, EventUkeyId, EventName, FileName } = event;
                let usersToken = [];
                const userTokenQuery = `SELECT DISTINCT NotificationToken 
                                        FROM user_devices 
                                        WHERE 
                                        UserUkeyId IN (
                                            SELECT um.UserUkeyId
                                            FROM Bookingmast bm
                                            JOIN UserMaster um ON um.UserUkeyId = bm.UserUkeyID
                                            WHERE 
                                            bm.EventUkeyId = '${setSQLStringValue(EventUkeyId)}'
                                            AND bm.OrganizerUkeyId = '${setSQLStringValue(OrganizerUkeyId)}'
                                            AND bm.IsVerify = 1
                                        )
                                        AND DeviceType = 'Android'
                                        AND Log_In = 1
                                        AND Log_Out = 0
                                        AND NotificationToken IS NOT NULL AND NotificationToken <> ''`;
                // const userTokenQuery = `select DISTINCT um.NotificationToken from Bookingmast as bm left join UserMaster um on um.UserUkeyId = bm.UserUkeyID where bm.EventUkeyId = ${setSQLStringValue(EventUkeyId)} AND bm.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)} AND bm.IsVerify = 1 AND um.NotificationToken != '' AND um.NotificationToken is not null`;
                const userToken = await pool.query(userTokenQuery);
                if (userToken.recordset.length > 0) {
                    usersToken = userToken.recordset;
                }
                if (usersToken.length > 0) {
                    for (const user of usersToken) {
                        await sentNotificationOnSetTime({
                            body: {
                                Title: EventName,
                                Description: `Please review the event and share your rating!`,
                                NotificationToken: user.NotificationToken,
                                Image: FileName,
                                LinkType: 'App',
                                Link: `/EventRatingScreen?EventUkeyId=${EventUkeyId}&OrganizerUkeyId=${OrganizerUkeyId}`,
                            }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.log('autoSendEventReview error', error);
    }
}
module.exports = {
    sendNotificationOnSetTime,
    autoSendEventReview
}