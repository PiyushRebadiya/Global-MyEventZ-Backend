const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue, setSQLDateTime, deleteImage, getCommonAPIResponse, CommonLogFun } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

//#region fetch Orginizer
const fetchOrganizer = async (req, res) => {
    try{
        const { UserUkeyId, EventUkeyId, OrganizerUkeyId } = req.query;
        const whereConditions = [];

        if (UserUkeyId) {
            whereConditions.push(`OM.UserUkeyId = ${setSQLStringValue(UserUkeyId)}`);
        }
        if(EventUkeyId){
            whereConditions.push(`OM.EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if(OrganizerUkeyId){
            whereConditions.push(`OM.OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM OrgUserMaster AS OM ${whereString} ORDER BY UserId DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM OrgUserMaster OM ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);
    }catch(error){
        return res.status(500).json({ ...errorMessage(error.message)});
    }
}
//#endregion
//#region verify mobile 
const VerifyOrganizerMobileNumber = async (req, res) => {
    try{
        const {Mobile1} = req.query

        if(!Mobile1){
            return res.status(200).json(errorMessage('Mobile1 is required'))
        }

        const result = await pool.request().query(`select om.*,em.EventName from OrgUserMaster om left join EventMaster em on em.EventUkeyId = om.EventUkeyId
        where om.Mobile1 = ${setSQLStringValue(Mobile1)} and om.IsActive = 1`)

        if(!result.recordset[0]){
            return res.status(200).json({...successMessage("there is no user register found with the given mobile number."), verify : false })
        }
        return res.status(200).json({...successMessage("given mobile number is valid"), verify : true, token : generateJWTT({
            Role: result?.recordset[0]?.Role
            , OrganizerUKeyId : result?.recordset[0]?.OrganizerUkeyId
            , EventUkeyId : result?.recordset[0]?.EventUkeyId
            , UserId : result?.recordset[0]?.UserId
            , FirstName : result?.recordset[0]?.FirstName
        }),
        UserId: result?.recordset[0]?.UserId,
        UserUkeyId: result?.recordset[0]?.UserUkeyId,
        EventUkeyId: result?.recordset[0]?.EventUkeyId,
        OrganizerUkeyId: result?.recordset[0]?.OrganizerUkeyId,
        OrganizerName: result?.recordset[0]?.FirstName,
        Mobile1: result?.recordset[0]?.Mobile1,
        Role: result?.recordset[0]?.Role,
        IsActive: result?.recordset[0]?.IsActive,
        EventName : result?.recordset?.[0]?.EventName
})
    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}
//#endregion
//#region Signup API

const AddOrginizer = async (req, res) => {
    try{
        const { OrganizerUkeyId, OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, City, StateCode, StateName, Password  } = req.body;

        const missingKeys = checkKeysAndRequireValues(['OrganizerName', 'Mobile1', 'Add1', 'Password', 'Email', 'OrganizerUkeyId'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const EventUkeyId = generateUUID()
        const UserUkeyId = generateUUID()
        const AddressUkeyID = generateUUID()

        const checkMobile = await pool.request().query(`select * from OrguserMaster where Mobile1 = ${setSQLStringValue(Mobile1)} or Email = ${setSQLStringValue(Email)}`)

        if(checkMobile.recordset.length > 0){
            return res.status(400).json({...errorMessage('An account with this mobile Or Email Id number already registered.'), ErrorCode  : 2627})
        }

        const EventCode = generateCODE(OrganizerName);
        
        const {IPAddress, ServerName, EntryTime} = getCommonKeys(req); 

        const InsertOrgUsrMst = `  
            INSERT INTO OrganizerMaster ( 
                OrganizerUkeyId, OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, City, StateCode, StateName, IsActive, IpAddress, HostName, EntryDate, flag
            ) OUTPUT INSERTED.*  VALUES (
                ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Mobile2)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(AliasName)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Add1)}, ${setSQLStringValue(City)}, ${setSQLStringValue(StateCode)}, ${setSQLStringValue(StateName)}, 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, 'A'
            );    
        `;
    
        const resultOrgUsrMst = await pool.request().query(InsertOrgUsrMst)

        const InsertOrgUserMst = `
            INSERT INTO OrguserMaster ( 
                UserUkeyId, EventUKeyId, OrganizerUkeyId, Password, IsActive, IpAddress, HostName, EntryDate, FirstName, Mobile1, Mobile2, StateCode, StateName, CityName, Role, flag, Add1, Email
            ) OUTPUT INSERTED.* VALUES (
                ${setSQLStringValue(UserUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(Password)}  , 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Mobile2)}, ${setSQLNumberValue(StateCode)}, ${setSQLStringValue(StateName)}, ${setSQLStringValue(City)}, 'Admin', 'A', ${setSQLStringValue(Add1)}, ${setSQLStringValue(Email)}
            );
        `;

        const resultOrgUserMst = await pool.request().query(InsertOrgUserMst);

        const InsertAddress = `  
            INSERT INTO AddressMaster ( 
                AddressUkeyID, OrganizerUkeyId, EventUkeyId, Alias, Address1, CityName, StateCode, StateName, IsActive, IpAddress, HostName, EntryDate, flag, CountryName, IsPrimaryAddress, UsreID
            ) OUTPUT INSERTED.*  VALUES (
                ${setSQLStringValue(AddressUkeyID)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(AliasName)}, ${setSQLStringValue(Add1)}, ${setSQLStringValue(City)}, ${setSQLStringValue(StateCode)}, ${setSQLStringValue(StateName)}, 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, 'A', 'INDIA', 1, ${setSQLNumberValue(resultOrgUserMst.recordset[0].UserId)}
            );    
        `;
    
        const resulAddress = await pool.request().query(InsertAddress)
                
        const InsertEvent = `
        INSERT INTO EventMaster ( 
            EventUKeyId, OrganizerUkeyId, EventName, EventCode, IsActive, IpAddress, HostName, EntryDate, StartEventDate, EndEventDate, UserID, AddressUkeyID, flag, TicketLimit, EventCategoryUkeyId
        ) OUTPUT INSERTED.* VALUES (
            ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(EventCode)}, 0, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, GETDATE(), GETDATE(), ${resultOrgUserMst.recordset[0].UserId}, ${setSQLStringValue(AddressUkeyID)}, 'A', 0, 'fwroturhtreugherg'
            );
        `;
    
        const resultEvent = await pool.request().query(InsertEvent);

        // const InsertPaymentGategory = await pool.request().query(`insert into PaymentGatewayMaster (
        //     GatewayUkeyId, EventUkeyId, OrganizerUkeyId, ShortName, GatewayName, KeyId, SecretKey, ConvenienceFee, GST, IsActive, UserId, UserName, IpAddress, HostName, EntryDate, flag
        // ) values (
        //     ${setSQLStringValue(generateUUID())}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(OrganizerUkeyId)}, 'RZP', 'TAXFILE', 'rzp_live_MN8CGpfzWT6Iqu', 'nujhlHiMeB8jb5CiuE2Wyr6t', 3, 18, 1, ${setSQLNumberValue(resultOrgUserMst.recordset[0].UserId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, 'A'
        // )`)

        if(resultOrgUsrMst.rowsAffected[0] === 0 && resultEvent.rowsAffected[0] === 0 && resultOrgUserMst.rowsAffected[0] === 0 && resulAddress.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('User Not Registerd Successfully.')})
        }

        CommonLogFun({
            OrganizerUkeyId : OrganizerUkeyId, 
            ReferenceUkeyId : OrganizerUkeyId, 
            MasterName : OrganizerName,  
            TableName : "OrganizerMaster", 
            UserId : resultOrgUserMst.recordset?.[0]?.UserId, 
            UserName :OrganizerName, 
            IsActive : true,
            flag : 'A', 
            IPAddress : IPAddress, 
            ServerName : ServerName, 
            EntryTime : EntryTime
        })
        CommonLogFun({
            OrganizerUkeyId : OrganizerUkeyId, 
            ReferenceUkeyId : OrganizerUkeyId, 
            MasterName : OrganizerName,  
            TableName : "OrguUerMaster", 
            MasterName : OrganizerName,
            UserId : resultOrgUserMst.recordset?.[0]?.UserId, 
            UserName :OrganizerName, 
            IsActive : true,
            flag : 'A', 
            IPAddress : IPAddress, 
            ServerName : ServerName, 
            EntryTime : EntryTime
        })
        CommonLogFun({
            OrganizerUkeyId : OrganizerUkeyId, 
            ReferenceUkeyId : OrganizerUkeyId, 
            MasterName : OrganizerName,  
            TableName : "EventMaster", 
            MasterName : 'Default Event',
            UserId : resultOrgUserMst.recordset?.[0]?.UserId, 
            UserName :OrganizerName, 
            IsActive : true,
            flag : 'A', 
            IPAddress : IPAddress, 
            ServerName : ServerName, 
            EntryTime : EntryTime
        })
        // CommonLogFun({
        //     OrganizerUkeyId : OrganizerUkeyId, 
        //     ReferenceUkeyId : OrganizerUkeyId, 
        //     MasterName : OrganizerName,  
        //     TableName : "PaymentGatewayMaster", 
        //     UserId : resultOrgUserMst.recordset?.[0]?.UserId, 
        //     UserName :OrganizerName, 
        //     IsActive : true,
        //     flag : 'A', 
        //     IPAddress : IPAddress, 
        //     ServerName : ServerName, 
        //     EntryTime : EntryTime
        // })
        return res.status(200).json({
            ...successMessage('User Registerd Successfully.'), 
            token : generateJWTT({
                OrganizerUkeyId
                , EventUkeyId
                , Role : 'Admin'
                , UserId : resultOrgUserMst.recordset[0].UserId
                , FirstName : OrganizerName
            }),
            ...req.body,
            EventUkeyId,
            UserUkeyId,
            EventName : OrganizerName
        })
    }catch(error){
        console.log('Add User Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

//#endregion

//#region login API

const Loginorganizer = async (req, res) => {
    try{
        const {Mobile1, Password} = req.body;

        const missingKeys = checkKeysAndRequireValues(['Mobile1', 'Password'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`))
        }

        const {IPAddress, ServerName, EntryTime} = getCommonKeys(req); 

        const result = await pool.request().query(`

        select om.*,em.EventName from OrgUserMaster om left join EventMaster em on em.EventUkeyId=om.EventUkeyId
where om.Mobile1 = ${setSQLStringValue(Mobile1)} AND om.Password = ${setSQLStringValue(Password)} AND om.IsActive = 1
        `);

        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('Invelit Mobile Number Or Password'), IsVerified : false});
        }
        return res.status(200).json({
            ...successMessage('User Verified Successfully.'), IsVerified : true, token : generateJWTT({
                Role: result?.recordset[0]?.Role
                , OrganizerUKeyId : result?.recordset[0]?.OrganizerUkeyId
                , EventUkeyId : result?.recordset[0]?.EventUkeyId
                , UserId : result?.recordset[0]?.UserId
                , FirstName : result?.recordset[0]?.FirstName
            }),
            UserId: result?.recordset[0]?.UserId,
            UserUkeyId: result?.recordset[0]?.UserUkeyId,
            EventUkeyId: result?.recordset[0]?.EventUkeyId,
            OrganizerUkeyId: result?.recordset[0]?.OrganizerUkeyId,
            OrganizerName: result?.recordset[0]?.FirstName,
            Mobile1: result?.recordset[0]?.Mobile1,
            Role: result?.recordset[0]?.Role,
            IsActive: result?.recordset[0]?.IsActive,
            Image: result?.recordset[0]?.Image,
            EventName : result?.recordset?.[0]?.EventName
    });
    }catch(error){
        console.log('Login User Error :', error);
        return res.status(500).json({...errorMessage(error)})
    }
}

//#endregion

//#region Login with Email Id
const Loginorganizerwithemail = async (req, res) => {
    try{
        const {Email} = req.body;

        const missingKeys = checkKeysAndRequireValues(['Email'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`))
        }


        const result = await pool.request().query(`

        select om.*,em.EventName from OrgUserMaster om left join EventMaster em on em.EventUkeyId=om.EventUkeyId
        where om.Email = ${setSQLStringValue(Email)} AND om.IsActive = 1
        `);

        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('Invelit credentials'), IsVerified : false});
        }
        return res.status(200).json({
            ...successMessage('User Verified Successfully.'), IsVerified : true, token : generateJWTT({
                Role: result?.recordset[0]?.Role
                , OrganizerUKeyId : result?.recordset[0]?.OrganizerUkeyId
                , EventUkeyId : result?.recordset[0]?.EventUkeyId
                , UserId : result?.recordset[0]?.UserId
                , FirstName : result?.recordset[0]?.FirstName
            }),
            UserId: result?.recordset[0]?.UserId,
            UserUkeyId: result?.recordset[0]?.UserUkeyId,
            EventUkeyId: result?.recordset[0]?.EventUkeyId,
            OrganizerUkeyId: result?.recordset[0]?.OrganizerUkeyId,
            OrganizerName: result?.recordset[0]?.FirstName,
            Mobile1: result?.recordset[0]?.Mobile1,
            Role: result?.recordset[0]?.Role,
            IsActive: result?.recordset[0]?.IsActive,
            Image: result?.recordset[0]?.Image,
            EventName : result?.recordset?.[0]?.EventName
    });
    }catch(error){
        console.log('Login User Error :', error);
        return res.status(500).json({...errorMessage(error)})
    }
}
//#endregion
//#region update orginizer
const updateOrginizer = async (req, res) => {
    try {
        const { UserUkeyId, EventUkeyId, OrganizerUkeyId, FirstName, Mobile1, Mobile2, Add1, Add2, StateCode, StateName, CityName, Pincode, DOB, Email, Gender, Role, IsActive, Password } = req.body;

        let Image = req?.files?.Image?.length ? req.files.Image[0].filename : '';

        const missingKeys = checkKeysAndRequireValues(
            ['UserUkeyId', 'EventUkeyId', 'OrganizerUkeyId', 'FirstName', 'Image', 'Mobile1', 'Mobile2', 'Add1', 'StateCode', 'StateName', 'CityName', 'Pincode', 'DOB', 'Email', 'Gender', 'Role', 'IsActive'], 
            {...req.body, ...req.files}
        );

        if (missingKeys.length > 0) {
            if (req.files?.Image?.length) {
                deleteImage(req.files.Image[0].path);
            }
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const oldImgResult = await pool.request().query(`
            SELECT Image FROM OrgUserMaster WHERE UserUkeyId = '${UserUkeyId}'
        `);
        const oldImg = oldImgResult.recordset?.[0]?.Image;

        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const updateQuery = `
        UPDATE OrgUserMaster 
        SET 
            EventUkeyId = ${setSQLStringValue(EventUkeyId)},
            OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)},
            Password = ${setSQLStringValue(Password)},
            FirstName = ${setSQLStringValue(FirstName)},
            Image = ${setSQLStringValue(Image)},
            Mobile1 = ${setSQLStringValue(Mobile1)},
            Mobile2 = ${setSQLStringValue(Mobile2)},
            Add1 = ${setSQLStringValue(Add1)},
            Add2 = ${setSQLStringValue(Add2)},
            StateCode = ${setSQLStringValue(StateCode)},
            StateName = ${setSQLStringValue(StateName)},
            CityName = ${setSQLStringValue(CityName)},
            Pincode = ${setSQLStringValue(Pincode)},
            DOB = ${setSQLDateTime(DOB)},
            Email = ${setSQLStringValue(Email)},
            Gender = ${setSQLStringValue(Gender)},
            Role = ${setSQLStringValue(Role)},
            IsActive = ${setSQLBooleanValue(IsActive)},
            IpAddress = ${setSQLStringValue(IPAddress)},
            HostName = ${setSQLStringValue(ServerName)},
            EntryDate = ${setSQLStringValue(EntryTime)},
            flag = 'U'
        WHERE UserUkeyId = ${setSQLStringValue(UserUkeyId)};
        `;

        const result = await pool.request().query(updateQuery);

        if (result.rowsAffected[0] === 0) {
            if (req.files?.Image?.length) {
                deleteImage(req.files.Image[0].path);
            }
            return res.status(400).json({ ...errorMessage('Invalid Mobile Number Or Password'), IsVerified: false });
        }


        if (oldImg && req.files?.Image?.length) {
            deleteImage('./media/Organizer/' + oldImg);
        }

        return res.status(200).json({ ...successMessage('User updated successfully') });
    } catch (error) {
        if (req.files?.Image?.length) {
            deleteImage(req.files.Image[0].path);
        }
        return res.status(500).json({ ...errorMessage(error.message) });
    }
};
//#endregion

//#region forgent password
const ForgetPasswordForOrganizer = async (req, res) => {
    try{
        const {Mobile1, Password} = req.body
        
        const missingKeys = checkKeysAndRequireValues(['Mobile1', 'Password'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`))
        }

        const result = await pool.request().query(`update OrgUserMaster set Password = ${setSQLStringValue(Password)} where Mobile1 = ${setSQLStringValue(Mobile1)}`)

        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('Account not found for this mobile number')});
        }

        return res.status(200).json({...successMessage(`password updated successfully`)})
    }catch(error){
        console.log('Forget Password for organizer error :', error);
        return res.status(500).json(errorMessage(error.message))
    }
}
//#endregion

//#region verify email

const verifyOrganizerEmail = async (req, res) => {
    try{
        const {Email} = req.query;

        const missingKeys = checkKeysAndRequireValues(['Email'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`))
        }

        const result = await pool.request().query(`select * from OrgUserMaster where Email = ${setSQLStringValue(Email)}`)

        if(result.recordset?.length > 0){
            return res.status(200).json({...errorMessage('already account exist of given Email Id')});
        }

        return res.status(200).json({...successMessage(`No account exist of given Email Id`)});
    }catch(error){
        console.log('verify Email of organizer error :', error);
        return res.status(500).json(errorMessage(error.message))
    }
}

//#endregion

module.exports = {
    AddOrginizer,
    Loginorganizer,
    updateOrginizer,
    fetchOrganizer,
    VerifyOrganizerMobileNumber,
    ForgetPasswordForOrganizer,
    Loginorganizerwithemail,
    verifyOrganizerEmail
}