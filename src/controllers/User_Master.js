const { errorMessage, getCommonAPIResponse, setSQLBooleanValue, checkKeysAndRequireValues, successMessage, getCommonKeys, generateUUID, getServerIpAddress, setSQLStringValue, deleteImage } = require("../common/main");
const { SECRET_KEY } = require("../common/variable");
const { pool } = require("../sql/connectToDatabase");
const jwt = require('jsonwebtoken');

const fetchUserMaster = async (req, res) => {
    try {
        const { UserUkeyId, Mobile1, Role, IsActive, IsLogin } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (UserUkeyId) {
            whereConditions.push(`UserUkeyId = '${UserUkeyId}'`);
        }
        if(Mobile1){
            whereConditions.push(`Mobile1 = '${Mobile1}'`);
        }
        if(Role){
            whereConditions.push(`Role = '${Role}'`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        if(IsLogin){
            whereConditions.push(`IsLogin = ${setSQLBooleanValue(IsLogin)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM UserMaster ${whereString} ORDER BY UserId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM UserMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

const addUserMaster = async (req, res) => {
    let {ProfiilePic = null} = req.body;
    try {
        const { Mobile1, Role = 'User', IsActive = true, flag = 'A', Email = '', BusinessCategory = '', CompanyName = '', MemberType = '', FirstName = null, NotificationToken = '', MemberCategory = '' } = req.body;

        ProfiilePic = req?.files?.ProfiilePic?.length ? `${req?.files?.ProfiilePic[0]?.filename}` : ProfiilePic;
        const fieldCheck = checkKeysAndRequireValues(['Mobile1'], req.body);
        if (fieldCheck.length !== 0) {
            if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const { IPAddress, ServerName, EntryTime  } = getCommonKeys(req);
        const UUID = generateUUID();
        const insertQuery = `INSERT INTO UserMaster (FirstName, UserUkeyId, Mobile1, Role, IsActive, flag, Email, BusinessCategory, CompanyName, MemberType, NotificationToken, ProfiilePic, MemberCategory, IpAddress, HostName, EntryDate) VALUES ( ${setSQLStringValue(FirstName)}, N'${UUID}', '${Mobile1}', N'${Role}', ${setSQLBooleanValue(IsActive)}, N'${flag}', N'${Email}', N'${BusinessCategory}', N'${CompanyName}', N'${MemberType}', N'${NotificationToken}', ${setSQLStringValue(ProfiilePic)}, ${setSQLStringValue(MemberCategory)}, '${IPAddress}', '${ServerName}', '${EntryTime}')`;
        // const insertQuery = `INSERT INTO UserMaster (UserUkeyId, Mobile1, Role, IsActive, flag, Email,  IpAddress, HostName, EntryDate, ) VALUES (N'${generateUUID()}', '${Mobile1}', N'${Role}', ${setSQLBooleanValue(IsActive)}, N'${flag}', N'${Email}', N'${getServerIpAddress()}', N'${getServerName()}', '${EntryTime}')`;
        const result = await pool.query(insertQuery);
        
        if (result?.rowsAffected[0] === 0) {
            if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).send({...errorMessage('No rows inserted of User Master'), verify: false});
        }
        const options = { expiresIn: '365d' }; // Token expiration time

        const token = jwt.sign({ UserUkeyId: UUID, Mobile1, Role }, SECRET_KEY, options);
        return res.status(200).send({...successMessage('Data inserted Successfully!'), verify: true, token, Mobile1, UserUkeyId: UUID, Role, NotificationToken});
    } catch (error) {
        if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
        console.log('Add user master Error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const updateUserMaster = async (req, res) => {
    let {ProfiilePic = null} = req.body;
    ProfiilePic = req?.files?.ProfiilePic?.length ? `${req?.files?.ProfiilePic[0]?.filename}` : ProfiilePic;
    try {
        const { Mobile1, Role = 'User', IsActive = true, flag = 'U', Email = '', UserUkeyId, BusinessCategory = '', CompanyName = '', MemberType = '', FirstName = null, NotificationToken = '', CityName = null, MemberCategory = '' } = req.body;

        const fieldCheck = checkKeysAndRequireValues(['Mobile1', 'UserUkeyId'], req.body);
        if (fieldCheck.length !== 0) {
            if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const oldImgResult = await pool.request().query(`
        SELECT ProfiilePic FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'
    `);
        const oldImg = oldImgResult.recordset?.[0]?.ProfiilePic;

        const { IPAddress, ServerName, EntryTime  } = getCommonKeys(req);
        const updateQuery = `UPDATE UserMaster SET Mobile1 = '${Mobile1}', Role = N'${Role}', IsActive = ${setSQLBooleanValue(IsActive)}, flag = N'${flag}', Email = N'${Email}', BusinessCategory = N'${BusinessCategory}', CompanyName = N'${CompanyName}', MemberType = N'${MemberType}', IpAddress = '${IPAddress}', HostName = '${ServerName}', EntryDate = '${EntryTime}', FirstName = ${setSQLStringValue(FirstName)}, NotificationToken = N'${NotificationToken}', ProfiilePic = ${setSQLStringValue(ProfiilePic)}, CityName = ${setSQLStringValue(CityName)}, MemberCategory = ${setSQLStringValue(MemberCategory)} WHERE UserUkeyId = '${UserUkeyId}'`;
        const result = await pool.query(updateQuery);
        if (result?.rowsAffected[0] === 0) {
            if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
            return res.status(400).send(errorMessage('No rows updated of User Master'));
        }
        if (oldImg && req.files && req.files.ProfiilePic && req.files.ProfiilePic.length > 0) deleteImage('./media/User/' + oldImg); // Only delete old image if it exists

        return res.status(200).send(successMessage('Data updated Successfully!'));
    } catch (error) {
        if (ProfiilePic) deleteImage(req?.files?.ProfiilePic?.[0]?.path); // Only delete if `Img` exists
        console.log('Update user master Error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const deleteUserMaster = async (req, res) => {
    try {
        const { UserUkeyId } = req.query;
        const fieldCheck = checkKeysAndRequireValues(['UserUkeyId'], req.query);
        if (fieldCheck.length !== 0) {
            return res.status(400).send(errorMessage(`${fieldCheck} is required`));
        }
        const oldImgResult = await pool.request().query(`
        SELECT ProfiilePic FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'
    `);
        const oldImg = oldImgResult.recordset?.[0]?.ProfiilePic;
        const deleteQuery = `DELETE FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'`;
        const result = await pool.query(deleteQuery);
        if (result?.rowsAffected[0] === 0) {
            return res.status(400).send(errorMessage('No rows deleted of User Master'));
        }
        if (oldImg) deleteImage('./media/User/' + oldImg); // Only delete old image if it exists

        return res.status(200).send(successMessage('Data deleted Successfully!'));
    } catch (error) {
        console.log('Delete user master Error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const verifyHandler = async (req, res) => {
    try {
        const { Mobile1 } = req.body;
        const missingKeys = checkKeysAndRequireValues(['Mobile1'], { ...req.body })
        if (missingKeys.length > 0) {
            return res.status(400).send({ ...errorMessage(`${missingKeys.join(', ')} parameters are required and must not be null or undefined`), verify: false });
        }

        const verifyUser = await pool.request().query(`SELECT * FROM UserMaster where Mobile1 = '${Mobile1}' AND IsActive = 1`);
        const fetchNoOfBookedTickets = await pool.request().query(`select COUNT(*) AS NoOfBookedTickets from TicketMaster where UserUkeyId = '${verifyUser?.recordset?.[0]?.UserUkeyId}'`);
        if(verifyUser?.recordset?.length === 0) {
            return res.send({...successMessage('User not found'), verify: false });
        }

        const { UserUkeyId, Role, UserId, MemberType, FirstName, NotificationToken } = verifyUser?.recordset[0];

        await pool.request().query(`UPDATE UserMaster SET IsLogin = 1 WHERE UserUkeyId = '${UserUkeyId}'`);

        const options = { expiresIn: '365d' }; // Token expiration time

        const token = jwt.sign({ UserUkeyId, Mobile1, Role, UserId }, SECRET_KEY, options);

        res.status(200).send({...successMessage('User verified'), NoOfBookedTickets : fetchNoOfBookedTickets?.recordset?.[0]?.NoOfBookedTickets, verify: true, ...verifyUser?.recordset[0], token});
    } catch (error) {
        console.error('Error:', error);
        res.status(400).send(errorMessage(error?.message));
    }
}


module.exports = { fetchUserMaster, addUserMaster, updateUserMaster, deleteUserMaster, verifyHandler }