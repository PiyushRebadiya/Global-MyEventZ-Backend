const { errorMessage, getCommonAPIResponse, setSQLBooleanValue, checkKeysAndRequireValues, successMessage, getCommonKeys, generateUUID, getServerIpAddress, setSQLStringValue, deleteImage, setSQLNumberValue, setSQLDateTime, setSQLOrderId, setSQLNumberNullValue } = require("../common/main");
const { SECRET_KEY } = require("../common/variable");
const { pool } = require("../sql/connectToDatabase");
const jwt = require('jsonwebtoken');

const fetchUserMaster = async (req, res) => {
    try {
        const { UserUkeyId, Mobile1, Role, IsActive, IsLogin , StartDate, EndDate} = req.query;
        let whereConditions = [];

        if (UserUkeyId) {
            whereConditions.push(`UM.UserUkeyId = '${UserUkeyId}'`);
        }
        if(Mobile1){
            whereConditions.push(`UM.Mobile1 = '${Mobile1}'`);
        }
        if(Role){
            whereConditions.push(`UM.Role = '${Role}'`);
        }
        if(IsActive){
            whereConditions.push(`UM.IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        if(IsLogin){
            whereConditions.push(`UM.IsLogin = ${setSQLBooleanValue(IsLogin)}`);
        }
        if(StartDate && EndDate){
            whereConditions.push(`UM.EntryDate >= ${setSQLDateTime(StartDate)} and UM.EntryDate <= ${setSQLDateTime(EndDate)}`);
        }
        
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT UM.* FROM UserMaster UM ${whereString} ORDER BY UserId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM UserMaster UM ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);
    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

const VerifyUserMobileNumber = async (req, res) => {
    try{
        const {Mobile1} = req.query

        if(!Mobile1){
            return res.status(200).json(errorMessage('Mobile1 is required'))
        }

        const result = await pool.request().query(`select * from UserMaster where Mobile1 = ${setSQLStringValue(Mobile1)} and IsActive = 1`)

        if(!result.recordset[0]){
            return res.status(200).json({...successMessage("there is no user register found with the given mobile number."), verify : false})
        }

        return res.status(200).json({...successMessage("given mobile number is valid"), verify : true, FullName : result.recordset[0].FullName, UserUkeyId : result?.recordset?.[0]?.UserUkeyId})
    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const addOrUpdateUserMaster = async (req, res) => {
    let { ProfiilePic = null } = req.body;

    const UserName = req?.user?.firstName;
    try {
        const { UserUkeyId, FullName, Mobile1, Mobile2, DOB = null, Email, Gender, Role, IsActive, flag, Password, NotificationToken } = req.body;
        
        ProfiilePic = req?.files?.ProfiilePic?.length ? `${req?.files?.ProfiilePic[0]?.filename}` : ProfiilePic;
        const fieldCheck = checkKeysAndRequireValues(['Mobile1', 'FullName', 'UserUkeyId'], req.body);
        if (fieldCheck.length !== 0) {
            if (ProfiilePic) deleteImage("./media/User/" + req?.files?.ProfiilePic?.[0]?.filename);
            return res.status(200).send(errorMessage(`${fieldCheck} is required`));
        }
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        if(['A', 'U'].indexOf(flag) === -1) return res.status(200).send(errorMessage("Invalid flag value"));
        
        if (flag === 'A') {
            const userMobile = await pool.query(`SELECT * FROM UserMaster WHERE Mobile1 = '${Mobile1}'`);

            if(userMobile?.recordset?.[0]?.IsActive){
                return res.status(400).json(errorMessage('Account already exists with this mobile number. To activate, contact customer care: 919904016789.'));
            }

            if (userMobile?.recordset?.length) return res.status(200).send(errorMessage("Mobile number already exists"));
            const insertQuery = `INSERT INTO UserMaster (UserUkeyId, FullName, ProfiilePic, Mobile1, Mobile2, DOB, Email, Gender, Role, IsActive, IsLogin, flag, UserName, Password, IpAddress, HostName, EntryDate, NotificationToken) VALUES (${setSQLStringValue(UserUkeyId)}, ${setSQLStringValue(FullName)}, ${setSQLStringValue(ProfiilePic)}, ${setSQLNumberValue(Mobile1)}, ${setSQLNumberNullValue(Mobile2)}, ${setSQLDateTime(DOB)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(Gender)}, ${setSQLStringValue(Role)}, ${setSQLBooleanValue(IsActive)}, 1, 'A', ${setSQLStringValue(UserName)}, ${setSQLStringValue(Password)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLDateTime(EntryTime)}, ${setSQLStringValue(NotificationToken)})`;
            const result = await pool.query(insertQuery);

            if (result?.rowsAffected[0] === 0) {
                if (ProfiilePic) deleteImage("./media/User/" + req?.files?.ProfiilePic?.[0]?.filename);
                return res.status(200).send({...errorMessage('No rows inserted of User Master'), verify: false});
            }
            const options = { expiresIn: '365d' };
            const token = jwt.sign({ UserUkeyId: UserUkeyId, Mobile1, FullName, Role }, SECRET_KEY, options);
            return res.status(200).send({...successMessage('Data inserted Successfully!'), verify: true, token, ...req.body});
        } else if (flag === 'U') {
            if (!UserUkeyId) return res.status(200).send(errorMessage("UserUkeyId is required"));
            const userMaster = await pool.query(`SELECT * FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'`);
            if (!userMaster?.recordset?.length) return res.status(200).send(errorMessage("User not found"));
            if(userMaster?.recordset?.[0]?.Mobile1 !== Mobile1){
                const userMobile = await pool.query(`SELECT * FROM UserMaster WHERE Mobile1 = '${Mobile1}'`);
                if (userMobile?.recordset?.length) return res.status(200).send(errorMessage("Mobile number already exists"));
            }
            const updateQuery = `UPDATE UserMaster SET FullName = ${setSQLStringValue(FullName)}, ProfiilePic = ${setSQLStringValue(ProfiilePic)}, Mobile1 = ${setSQLNumberValue(Mobile1)}, Mobile2 = ${setSQLNumberNullValue(Mobile2)}, DOB = ${setSQLDateTime(DOB)}, Email = ${setSQLStringValue(Email)}, Gender = ${setSQLStringValue(Gender)}, Role = ${setSQLStringValue(Role)}, IsActive = ${setSQLBooleanValue(IsActive)}, IsLogin = 1, Password = ${setSQLStringValue(Password)}, UserName = ${setSQLStringValue(req?.user?.FullName)}, IpAddress = ${setSQLStringValue(IPAddress)}, HostName = ${setSQLStringValue(ServerName)}, EntryDate = ${setSQLDateTime(EntryTime)},  flag = 'U', NotificationToken = ${setSQLStringValue(NotificationToken)} WHERE UserUkeyId = '${UserUkeyId}'`;
            
            await pool.query(updateQuery);

            try {
                const oldImg = userMaster?.recordset?.[0]?.ProfiilePic;
                if(oldImg && ProfiilePic && oldImg !== ProfiilePic) await deleteImage('./media/User/' + oldImg);
            } catch (error) {
                console.log('error :>> ', error);
            }
            return res.status(200).send({...successMessage('Data updated Successfully!'), verify: true, ...req.body});
        }
    } catch (error) {
        if (ProfiilePic) deleteImage("./media/User/" + req?.files?.ProfiilePic?.[0]?.filename);
        console.log('Add or Update user master Error :', error);
        return res.status(400).send(errorMessage(error?.message));
    }
}

const deleteUserMaster = async (req, res) => {
    try {
        const { UserUkeyId } = req.query;
        if (!UserUkeyId) return res.status(200).send(errorMessage("UserUkeyId is required"));
        const userMaster = await pool.query(`SELECT * FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'`);
        if (!userMaster?.recordset?.length) return res.status(200).send(errorMessage("User not found"));
        const deleteQuery = `DELETE FROM UserMaster WHERE UserUkeyId = '${UserUkeyId}'`;
        try {
            const oldImg = userMaster?.recordset?.[0]?.ProfiilePic;
            if(oldImg) await deleteImage('./media/User/' + oldImg);
        } catch (error) {
            console.log('error :>> ', error);
        }
        await pool.query(deleteQuery);
        return res.status(200).send(successMessage("User deleted successfully"));
    } catch (error) {
        return res.status(400).send(errorMessage(error?.message));
    }
}

const verifyHandler = async (req, res) => {
    try {
        const { Mobile1, Password } = req.body;
        if (!Mobile1) return res.status(200).send(errorMessage("Mobile1 is required"));

        // user mobile check if OTP implemented
        const userMaster = await pool.query(`SELECT * FROM UserMaster WHERE Mobile1 = '${Mobile1}'`);
        if (!userMaster?.recordset?.length) return res.status(200).send(errorMessage("there is no user register found with the given mobile number"));
        
        if (!userMaster?.recordset?.[0]?.IsActive) return res.status(200).send(errorMessage("This account is inactive. To activate it, please contact customer support at +91-9040016789."));

        // user mobile and password check if manual login
        const userMaterPassword = userMaster?.recordset?.[0]?.Password;
        if (Password && userMaterPassword !== Password) return res.status(200).send(errorMessage("Invalid Password"));

        const options = { expiresIn: '365d' };
        const token = jwt.sign({ UserUkeyId: userMaster?.recordset?.[0]?.UserUkeyId, Mobile1, Role: userMaster?.recordset?.[0]?.Role }, SECRET_KEY, options);
        const decoded = jwt.verify(token, SECRET_KEY);
        return res.status(200).send({...successMessage('Data inserted Successfully!'), verify: true, token, ...userMaster?.recordset?.[0]});
    } catch (error) {
        return res.status(400).send(errorMessage("Invalid or expired token"));
    }
}

module.exports = { fetchUserMaster, VerifyUserMobileNumber, addOrUpdateUserMaster, deleteUserMaster, verifyHandler };