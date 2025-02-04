const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, setSQLStringValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchUser = async (req, res) =>{
    try{

    }catch(error){
        console.log('Fetch User Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

const AddUser = async (req, res) => {
    try{
        const {OrganizerName, OrganizerMobile, OrganizerEmail, EventName, EventAddress, EventCity, UserName, Password = '', IsActive = true, flag = 'A', TypeofAddress, Address1 = '', Address2 = '', Pincode = '', IsPrimaryAddress, ParentOrganizerUkeyId, Role} = req.body;

        const missingKeys = checkKeysAndRequireValues(['OrganizerName', 'OrganizerMobile', 'OrganizerEmail', 'EventName', 'EventAddress', 'EventCity', 'UserName', 'Password'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }
        if(!Role) {
            return res.status(400).json(errorMessage('Role Is required while creating new Organization.'));
        }else if(Role !== 'Admin' && Role !== 'SubAdmin'){
            return res.status(400).json(errorMessage("Role can only be 'Admin' or 'SubAdmin'."));
        }

        const OrganizerUKeyId = generateUUID();
        const EventUKeyId = generateUUID();
        const AddressUkeyID = generateUUID();
        const EventCode = generateCODE(EventName);
        
        const {IPAddress, ServerName, EntryTime} = getCommonKeys(); 

        let resultReg ,resultOrgMst ,resultEvent, resultAddress;
        if(flag === 'A'){
            const InsertReg = `
                INSERT INTO OrganizerRegistration ( 
                    OrganizerUkeyId, OrganizerName, OrganizerMobile, OrganizerEmail, EventCode, EventName, EventAddress, EventCity, UserName, Password, ServerName, IsActive, IpAddress, EntryDate, flag
                ) VALUES (
                    ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(OrganizerMobile)}, ${setSQLStringValue(OrganizerEmail)}, ${setSQLStringValue(EventCode)}, ${setSQLStringValue(EventName)}, ${setSQLStringValue(EventAddress)}, ${setSQLStringValue(EventCity)}, ${setSQLStringValue(UserName)}, ${setSQLStringValue(Password)}, ${setSQLStringValue(ServerName)}, ${setSQLBooleanValue(IsActive)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(EntryTime)}, 'A'
                );
            `

            resultReg = await pool.request().query(InsertReg);
            
            const InsertOrgMst = `
                INSERT INTO OrganizerMaster ( 
                    OrganizerUkeyId, ParentOrganizerUkeyId, OrganizerName, Mobile1, Email, EntryDate, flag, UserName, Password, IsActive, Role
                ) VALUES (
                    ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(ParentOrganizerUkeyId)}, ${setSQLStringValue(OrganizerName)}, ${setSQLStringValue(OrganizerMobile)}, ${setSQLStringValue(OrganizerEmail)}, ${setSQLStringValue(EntryTime)}, 'A', ${setSQLStringValue(UserName)}, ${setSQLStringValue(Password)}, 1, ${setSQLStringValue(Role)}
                );    
            `

            resultOrgMst = await pool.request().query(InsertOrgMst);
            
            const InsertEvent = `
                INSERT INTO EventMaster ( 
                    EventUKeyId, OrganizerUkeyId, EventName, EventCode, AddressUkeyID, EntryDate, IsActive
                ) VALUES (
                    ${setSQLStringValue(EventUKeyId)}, ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(EventName)}, ${setSQLStringValue(EventCode)}, ${setSQLStringValue(AddressUkeyID)}, ${setSQLStringValue(EntryTime)}, 1
                );    
            `

            resultEvent = await pool.request().query(InsertEvent);

            const InsertAddress = `
                INSERT INTO AddressMaster ( 
                    AddressUkeyID, EventUKeyId, OrganizerUkeyId, TypeofAddress, Address1, Pincode, CityName, IsPrimaryAddress, IsActive, EntryDate
                ) VALUES (
                    ${setSQLStringValue(AddressUkeyID)}, ${setSQLStringValue(EventUKeyId)}, ${setSQLStringValue(OrganizerUKeyId)}, ${setSQLStringValue(TypeofAddress)}, ${setSQLStringValue(EventAddress)}, '${Pincode}', ${setSQLStringValue(EventCity)}, ${setSQLBooleanValue(IsPrimaryAddress)}, 1, ${setSQLStringValue(EntryTime)}
                ); 
            `

            resultAddress = await pool.request().query(InsertAddress);
        } else {
            return res.status(400).json({...errorMessage('User Not Registerd Successfully.')})
        }        

        if(resultReg.rowsAffected[0] === 0 && resultOrgMst.rowsAffected[0] === 0 && resultEvent.rowsAffected[0] === 0 && resultAddress.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('User Not Registerd Successfully.')})
        }

        return res.status(200).json({
            ...successMessage('User Registerd Successfully.'), 
            token : generateJWTT({
                OrganizerName
                , OrganizerMobile
                , UserName
                , OrganizerUKeyId
                , ParentOrganizerUkeyId
            }),
            OrganizerUKeyId,
            ...req.body
        })
    }catch(error){
        console.log('Add User Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

const DeleteUser = async (req, res) => {
    try{

    }catch(error){
        console.log('Delete User Error :', error);
        return res.status(500).json({...successMessage()})
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
    FetchUser,
    AddUser,
    DeleteUser,
    LoginUser,
}