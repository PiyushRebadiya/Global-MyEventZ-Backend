const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue, setSQLNumberValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const AddOrginizer = async (req, res) => {
    try{
        const { OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, Add2, City, StateCode, StateName, Password = '', Pincode = 0 } = req.body;

        const missingKeys = checkKeysAndRequireValues(['OrganizerName', 'Mobile1', 'Add1', 'City', 'UserName', 'Password', 'Email'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const OrganizerUKeyId = generateUUID();
        const EventUKeyId = generateUUID();
        const UserUkeyId = generateUUID();
        const AddressUkeyID = generateUUID();
        const EventCode = generateCODE(OrganizerName);
        
        const {IPAddress, ServerName, EntryTime} = getCommonKeys(req); 

        const InsertOrgUsrMst = `  
            INSERT INTO OrganizerMaster ( 
                OrganizerUkeyId, OrganizerName, Mobile1, Mobile2, Email, AliasName, Description, Add1, Add2, City, StateCode, StateName, IsActive, IpAddress, HostName, EntryDate, flag
            ) OUTPUT INSERTED.*  VALUES (
                ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Mobile2)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(AliasName)}, ${setSQLStringValue(Description)}, ${setSQLStringValue(Add1)}, ${setSQLStringValue(Add2)}, ${setSQLStringValue(City)}, ${setSQLStringValue(StateCode)}, ${setSQLStringValue(StateName)}, 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, 'A'
            );    
        `;
    
        const resultOrgUsrMst = await pool.request().query(InsertOrgUsrMst)

        const InsertOrgUserMst = `
            INSERT INTO OrguserMaster ( 
                UserUkeyId, EventUKeyId, OrganizerUkeyId, Password, IsActive, IpAddress, HostName, EntryDate, FirstName, Mobile1, Mobile2, StateCode, StateName, CityName, Role, flag
            ) OUTPUT INSERTED.* VALUES (
                ${setSQLStringValue(UserUkeyId)}, ${setSQLStringValue(EventUKeyId)}, ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(Password)}  , 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Mobile2)}, ${setSQLNumberValue(StateCode)}, ${setSQLStringValue(StateName)}, ${setSQLStringValue(City)}, 'Admin', 'A'
            );
        `;

        const resultOrgUserMst = await pool.request().query(InsertOrgUserMst);

        const InsertAddress = `  
            INSERT INTO AddressMaster ( 
                AddressUkeyID, OrganizerUkeyId, EventUkeyId, MobileNumber, Email, Alias, Address1, Address2, CityName, StateCode, StateName, IsActive, IpAddress, HostName, EntryDate, flag, Pincode, CountryName, IsPrimaryAddress, UsreID
            ) OUTPUT INSERTED.*  VALUES (
                ${setSQLStringValue(AddressUkeyID)}, ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(EventUKeyId)}, ${setSQLStringValue(Mobile1)}, ${setSQLStringValue(Email)}, ${setSQLStringValue(AliasName)}, ${setSQLStringValue(Add1)}, ${setSQLStringValue(Add2)}, ${setSQLStringValue(City)}, ${setSQLStringValue(StateCode)}, ${setSQLStringValue(StateName)}, 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, 'A', ${setSQLNumberValue(Pincode)}, 'INDIA', 1, ${setSQLNumberValue(resultOrgUserMst.recordset[0].UserId)}
            );    
        `;
    
        const resulAddress = await pool.request().query(InsertAddress)

        const InsertEvent = `
        INSERT INTO EventMaster ( 
            EventUKeyId, OrganizerUkeyId, EventName, EventCode, IsActive, IpAddress, HostName, EntryDate, EventDate, UsreID, AddressUkeyID
        ) OUTPUT INSERTED.* VALUES (
            ${setSQLStringValue(EventUKeyId)}, ${setSQLStringValue(OrganizerUKeyId)}, 'Default Event', ${setSQLStringValue(EventCode)}, 1, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, GETDATE(), ${resultOrgUserMst.recordset[0].UserId}, ${setSQLStringValue(AddressUkeyID)}
            );
        `;
    
        const resultEvent = await pool.request().query(InsertEvent);

        if(resultOrgUsrMst.rowsAffected[0] === 0 && resultEvent.rowsAffected[0] === 0 && resultOrgUserMst.rowsAffected[0] === 0 && resulAddress.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('User Not Registerd Successfully.')})
        }

        return res.status(200).json({
            ...successMessage('User Registerd Successfully.'), 
            token : generateJWTT({
                OrganizerUKeyId
                , EventUKeyId
                , Role : 'Admin'
                , UserId : resultOrgUserMst.recordset[0].UserId
            }),
            OrganizerUKeyId,
            ...req.body
        })
    }catch(error){
        console.log('Add User Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}



const LoginUser = async (req, res) => {
    try{
        const {OrganizerMobile, Password} = req.query;

        const missingKeys = checkKeysAndRequireValues(['OrganizerMobile', 'Password'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is required`))
        }

        const result = await pool.request().query(`
            SELECT * FROM OrganizerMaster 
            WHERE Mobile1 = '${OrganizerMobile}' AND Password = '${Password}' AND IsActive = 1
        `);

        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('Invelit Mobile Number Or Password'), IsVerified : false});
        }
        return res.status(200).json({
            ...successMessage('User Verified Successfully.'), IsVerified : true, token : generateJWTT({
                OrganizerName : result?.recordset[0]?.OrganizerName
                , OrganizerMobile : result?.recordset[0]?.Mobile1
                , UserName : result?.recordset[0]?.UserName
                , OrganizerUkeyId : result?.recordset[0]?.OrganizerUkeyId
                , ParentOrganizerUkeyId: result?.recordset[0]?.ParentOrganizerUkeyId
                , Role: result?.recordset[0]?.Role
                , OrganizerId : result?.recordset[0]?.OrganizerId
            }),
            ...result?.recordset[0]
    });
    }catch(error){
        console.log('Login User Error :', error);
        return res.status(500).json({...successMessage()})
    }
}

module.exports = {
    AddOrginizer,
    LoginUser,
}