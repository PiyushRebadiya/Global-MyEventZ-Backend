const { pool } = require("../sql/connectToDatabase");

async function autoVerifyCarousel() {
    try {
        await pool.request().query(
            ` UPDATE Carousel
SET CarouselStatus = 
    CASE
        WHEN CAST(EndEventDate AS DATE) < CAST(GETDATE() AS DATE) THEN 'Expired'
        WHEN CAST(StartEventDate AS DATE) > CAST(GETDATE() AS DATE) THEN 'Pending'
        ELSE 'Active'
    END WHERE AlwaysShow = 0`,
        );

        await pool.request().query(
            `UPDATE Carousel SET CarouselStatus = 'Active' WHERE AlwaysShow = 1`,
        )
        console.log("Carousel statuses updated successfully");
    } catch (error) {
        console.log("Auto Verify Carousel", error);
    }
}

async function autoVerifyBellNotification() {
    try {
        await pool.request().query(
            ` UPDATE BellNotification
SET NotificationStatus = 
    CASE
        WHEN CAST(EndDate AS DATE) < CAST(GETDATE() AS DATE) THEN 'Expired'
        WHEN CAST(StartDate AS DATE) > CAST(GETDATE() AS DATE) THEN 'Pending'
        ELSE 'Active'
    END`,
        );
        console.log("Notification statuses updated successfully");
    } catch (error) {
        console.log("Auto Verify Notification", error);
    }
}

module.exports = { autoVerifyCarousel, autoVerifyBellNotification };