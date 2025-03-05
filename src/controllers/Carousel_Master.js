const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, deleteImage, setSQLOrderId, setSQLStringValue, setSQLNumberNullValue } = require("../common/main");
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
            getQuery: `SELECT dm.FileName,cc.* FROM Carousel As cc LEFT JOIN DocumentUpload As dm ON cc.CarouselUkeyId = dm.UkeyId  ${whereString} ORDER BY ${SortBy} ${SortOrder}`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM Carousel As cc ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getCarouselList);
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
};

const CarouserMaster = async (req, res) => {
    const { Status = true, OrderId = null, Link = '', StartEventDate = null, EndEventDate = null, AlwaysShow, Title = '', LinkType = 'Web', CarouselUkeyId, flag, EventUkeyId = null, OrganizerUkeyId = null } = req.body;
    
    let { FileName = '' } = req.body;
    let Img = req?.files?.FileName?.length ? req.files.FileName[0].filename : FileName;

    if (Array.isArray(req?.files?.FileName) && req?.files?.FileName?.length > 1) {
        req?.files?.FileName?.forEach((file) => deleteImage(file.path));
        return res.status(400).json(errorMessage('Only one FileName is allowed.'));
    }

    const missingKeys = checkKeysAndRequireValues(['Img'], { ...req.body, Img });
    if (missingKeys.length > 0) {
        if (Array.isArray(req?.files?.FileName)) deleteImage(`${req?.files?.FileName[0]?.path}`);
        return res.status(400).send(`${missingKeys.join(', ')} parameters are required and must not be null or undefined`);
    }

    if (!['A', 'U'].includes(flag)) return res.status(400).send(errorMessage("Invalid flag value"));

    const UUID = flag === 'A' ? generateUUID() : CarouselUkeyId;
    if (flag === 'U' && !CarouselUkeyId) {
        if (Array.isArray(req?.files?.FileName)) deleteImage(`${req?.files?.FileName[0]?.path}`);
        return res.status(400).send(errorMessage("CarouselUkeyId is required"));
    }

    let transaction;
    try {
        const { IPAddress, ServerName, EntryTime } = getCommonKeys();
        
        transaction = pool.transaction(); // Create transaction instance
        await transaction.begin(); // ✅ Start transaction

        const insertQuery = `
            INSERT INTO Carousel (CarouselUkeyId, Title, Status, OrderId, Link, StartEventDate, EndEventDate, AlwaysShow, LinkType, flag, EntryDate, HostName, IPAddress) 
            VALUES ('${UUID}', N'${Title}', ${setSQLBooleanValue(Status)}, ${setSQLOrderId(OrderId)}, ${setSQLStringValue(Link)}, '${StartEventDate}', '${EndEventDate}', ${setSQLBooleanValue(AlwaysShow)}, '${LinkType}', N'${flag}', '${EntryTime}', '${ServerName}', '${IPAddress}')
        `;

        const documentInsertQuery = `
            INSERT INTO DocumentUpload (DocUkeyId, FileName, Category, EventUkeyId, OrganizerUkeyId, UkeyId, FileType, IsActive, UserId, UserName, IpAddress, HostName, EntryDate, flag) 
            VALUES ('${generateUUID()}', N'${Img}', 'Carousel', ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, '${UUID}', 'Image', ${setSQLBooleanValue(Status)}, ${setSQLNumberNullValue(req?.user?.UserId)}, ${setSQLStringValue(req?.user?.FirstName)}, '${IPAddress}', '${ServerName}', '${EntryTime}', N'${flag}')
        `;

        if (flag === 'A') {
            const result = await transaction.request().query(insertQuery);
            const documentResult = await transaction.request().query(documentInsertQuery);

            if (result?.rowsAffected?.[0] === 0 || documentResult?.rowsAffected?.[0] === 0) {
                if (Array.isArray(req?.files?.FileName)) deleteImage(`${req?.files?.FileName[0]?.path}`);
                throw new Error("No Carousel Created.");
            }

            await transaction.commit(); // ✅ Commit transaction
            autoVerifyCarousel();
            return res.status(200).json(successMessage('New Carousel Created Successfully.', { ...req.body, CarouselUkeyId: UUID, Img }));
        } 
        else if (flag === 'U') {
            const oldImgResult = await transaction.request().query(`SELECT CarouselUkeyId FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}'`);
            const documentOldImgResult = await transaction.request().query(`SELECT FileName FROM DocumentUpload WHERE UkeyId = '${CarouselUkeyId}' AND Category = 'Carousel'`);
            if (oldImgResult.recordset.length === 0) {
                if (Array.isArray(req?.files?.FileName)) deleteImage(`${req?.files?.FileName[0]?.path}`);
                throw new Error("No Carousel Master Found.");
            }

            await transaction.request().query(`DELETE FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';`);
            await transaction.request().query(`DELETE FROM DocumentUpload WHERE UkeyId = '${CarouselUkeyId}' AND Category = 'Carousel';`);
            await transaction.request().query(insertQuery);
            await transaction.request().query(documentInsertQuery);

            await transaction.commit(); // ✅ Commit transaction
            if(Array.isArray(req?.files?.FileName)) deleteImage(`./media/DocumentUpload/${documentOldImgResult.recordset[0]?.FileName}`);
            autoVerifyCarousel();
            return res.status(200).json(successMessage('Carousel Master Updated Successfully.', { ...req.body, CarouselUkeyId, Img }));
        }
    } catch (error) {
        if (transaction) {
            await transaction.rollback(); // ✅ Only rollback if transaction was started
        }
        if (Array.isArray(req?.files?.FileName)) deleteImage(`${req?.files?.FileName[0]?.path}`);
        console.error('Error:', error);
        return res.status(500).json(errorMessage(error.message));
    }
};

const RemoveCarousel = async (req, res) => {
    let transaction;
    try {
        const { CarouselUkeyId } = req.query;

        // Validate required keys
        const missingKeys = checkKeysAndRequireValues(['CarouselUkeyId'], req.query);
        if (missingKeys.length > 0) {
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        // Begin transaction
        transaction = pool.transaction();
        await transaction.begin();

        // Fetch the old image before deleting
        const documentOldImgResult = await transaction.request().query(`
            SELECT FileName FROM DocumentUpload WHERE UkeyId = '${CarouselUkeyId}' AND Category = 'Carousel';
        `);
        const oldDocumentImg = documentOldImgResult.recordset?.[0]?.FileName;

        // Delete records from both tables
        const deleteQuery = `
            DELETE FROM Carousel WHERE CarouselUkeyId = '${CarouselUkeyId}';
            DELETE FROM DocumentUpload WHERE UkeyId = '${CarouselUkeyId}' AND Category = 'Carousel';
        `;
        const deleteResult = await transaction.request().query(deleteQuery);

        if (deleteResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(400).json(errorMessage('No Carousel Master Deleted.'));
        }

        // Commit transaction
        await transaction.commit();

        // Delete the image only after successful deletion from the database
        if (oldDocumentImg) {
            deleteImage(`./media/DocumentUpload/${oldDocumentImg}`);
        }

        // Return success response
        return res.status(200).json(successMessage('Carousel Master Deleted Successfully.', { CarouselUkeyId }));
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Delete Carousel Master Error:', error);
        return res.status(500).json(errorMessage(error.message));
    }
};


module.exports = {
    fetchCarouselList,
    CarouserMaster,
    RemoveCarousel
}