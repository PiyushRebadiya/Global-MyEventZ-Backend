const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLOrderId, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');
const { autoVerifyCarousel } = require("./autoRunQuery");

const fetchCarouselList = async (req, res) => {
    try {
        const { SortBy = 'CarouselId', SortOrder = 'DESC', CarouselId, CarouselUkeyId, LinkType, Staus, CarouselStatus } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (CarouselId) {
            whereConditions.push(`cc.CarouselId = '${CarouselId}'`);
        }
        if (CarouselUkeyId) {
            whereConditions.push(`cc.CarouselUkeyId = '${CarouselUkeyId}'`);
        }
        if (LinkType) {
            whereConditions.push(`cc.LinkType = '${LinkType}'`);
        }
        if (Staus) {
            whereConditions.push(`cc.Staus = ${setSQLBooleanValue(Staus)}`);
        }
        if (CarouselStatus) {
            whereConditions.push(`cc.CarouselStatus = '${CarouselStatus}'`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getCarouselList = {
            getQuery: `SELECT * FROM Carousel As cc ${whereString} ORDER BY ${SortBy} ${SortOrder}`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM Carousel As cc ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getCarouselList);
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

const CarouserMaster = async (req, res) => {
    const { SponsorUkeyId = generateUUID(), Status = true, OrderId = null, Link = '', StartEventDate = null, EndEventDate = null, AlwaysShow, Title = '', LinkType = 'Web', CarouselUkeyId, flag } = req.body;
    let {Img = ''} = req.body;

    Img = req?.files?.Img?.length ? `${req?.files?.Img[0]?.filename}` : Img;

    const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, Img: Img });
    if (missingKeys.length > 0) {
        if (req?.files?.Img?.length) {
            try {
                fs.unlinkSync(req?.files?.Img[0]?.path);
            } catch (error) {
                console.log('Error :>> ', error);
            }
        }    
        return res.status(400).send(`${missingKeys.join(', ')} parameters are required and must not be null or undefined`);
    }

    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys();

        const insertQuery = `INSERT INTO Carousel (CarouselUkeyId, Img, Title, Status, OrderId, Link, StartEventDate, EndEventDate, AlwaysShow, LinkType, flag, EntryDate, HostName, IPAddress) VALUES ( '${SponsorUkeyId}', '${Img}', N'${Title}', ${setSQLBooleanValue(Status)}, ${setSQLOrderId(OrderId)}, ${setSQLStringValue(Link)}, '${StartEventDate}', '${EndEventDate}', ${setSQLBooleanValue(AlwaysShow)}, '${LinkType}', N'${flag}', '${EntryTime}', '${ServerName}', '${IPAddress}')`;

        const deleteQuery = `
            DELETE FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';
        `;

        if (flag === 'A') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });

            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }

            const result = await pool.request().query(insertQuery);

            if (result?.rowsAffected?.[0] === 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json({ ...errorMessage('No Carousel Created.') });
            }
            autoVerifyCarousel();
            return res.status(200).json({ 
                ...successMessage('New Carousel Created Successfully.'), 
                ...req.body, CarouselUkeyId, Img 
            });
            
        } else if (flag === 'U') {
            const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, ...req?.files });
            
            if (missingKeys.length > 0) {
                if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
            }
            
            const oldImgResult = await pool.request().query(`
                SELECT Img FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';
                `);
                const oldImg = oldImgResult.recordset?.[0]?.Img;
                
                const deleteResult = await pool.request().query(deleteQuery);
                const insertResult = await pool.request().query(insertQuery);
                
                if (deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0) {
                    if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
                    return res.status(400).json({ ...errorMessage('No Carousel Master Updated.') });
                }
                
                if (oldImg && req.files && req.files.Img && req.files.Img.length > 0) deleteImage('./media/Carousel/' + oldImg); // Only delete old Img if it exists
                autoVerifyCarousel();
                return res.status(200).json({ 
                    ...successMessage('New Carousel Master Updated Successfully.'), 
                ...req.body, CarouselUkeyId, Img 
            });

        } else {
            if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).json({
                ...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsory to send flag.")
            });
        }
    } catch (error) {
        if (Img) deleteImage(req?.files?.Img?.[0]?.path); // Only delete if `Img` exists
        if (flag === 'A') {
            console.log('Add Carousel Master Error :', error);
        }
        if (flag === 'U') {
            console.log('Update Carousel Master Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
};

const RemoveCarousel = async (req, res) => {
    try {
        const { CarouselUkeyId } = req.query;

        // Check if required keys are missing
        const missingKeys = checkKeysAndRequireValues(['CarouselUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // Fetch the old Img path before deleting the record
        const oldImgResult = await pool.request().query(`
            SELECT Img FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';
        `);

        const oldImg = oldImgResult.recordset?.[0]?.Img; // Safely access the first record

        // Execute the DELETE query
        const deleteQuery = `
            DELETE FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';
        `;
        const deleteResult = await pool.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(400).json({ ...errorMessage('No Carousel Master Deleted.') });
        }

        // Delete the old Img if it exists
        if (oldImg) {
            deleteImage('./media/Carousel/' + oldImg);
        }

        // Return success response
        return res.status(200).json({ ...successMessage('Carousel Master Deleted Successfully.'), CarouselUkeyId });
    } catch (error) {
        console.log('Delete Carousel Master Error :', error);
        return res.status(500).json({ ...errorMessage(error.message) });
    }
};

module.exports = {
    fetchCarouselList,
    CarouserMaster,
    RemoveCarousel
}