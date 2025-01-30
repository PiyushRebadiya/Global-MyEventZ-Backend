const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID } = require("../common/main");
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
        const {OrganizerName, OrganizerMobile, OrganizerEmail, EventName, EventAddress, EventCity, UserName, Password = '', IsActive = true, flag = 'A', TypeofAddress, Address1 = '', Address2 = '', Pincode = '', IsPrimaryAddress} = req.body;

        const missingKeys = checkKeysAndRequireValues(['OrganizerName', 'OrganizerMobile', 'OrganizerEmail', 'EventName', 'EventAddress', 'EventCity', 'UserName', 'Password'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
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
                    '${OrganizerUKeyId}', '${OrganizerName}', '${OrganizerMobile}', '${OrganizerEmail}', '${EventCode}', '${EventName}', '${EventAddress}', '${EventCity}', '${UserName}', '${Password}', '${ServerName}', ${setSQLBooleanValue(IsActive)}, '${IPAddress}', '${EntryTime}', 'A'
                );
            `

            resultReg = await pool.request().query(InsertReg);
            
            const InsertOrgMst = `
                INSERT INTO OrganizerMaster ( 
                    OrganizerUkeyId, OrganizerName, Mobile1, Email, EntryDate, flag, UserName, Password, IsActive
                ) VALUES (
                    '${OrganizerUKeyId}', '${OrganizerName}', '${OrganizerMobile}', '${OrganizerEmail}', '${EntryTime}', 'A', '${UserName}', '${Password}', 1
                );    
            `

            resultOrgMst = await pool.request().query(InsertOrgMst);
            
            const InsertEvent = `
                INSERT INTO EventMaster ( 
                    EventUKeyId, OrganizerUkeyId, EventName, EventCode, AddressUkeyID, EntryDate, IsActive
                ) VALUES (
                    '${EventUKeyId}', '${OrganizerUKeyId}', '${EventName}', '${EventCode}', '${AddressUkeyID}', '${EntryTime}', 1
                );    
            `

            resultEvent = await pool.request().query(InsertEvent);

            const InsertAddress = `
                INSERT INTO AddressMaster ( 
                    AddressUkeyID, EventUKeyId, OrganizerUkeyId, TypeofAddress, Address1, Pincode, CityName, IsPrimaryAddress, IsActive, EntryDate
                ) VALUES (
                    '${AddressUkeyID}', '${EventUKeyId}', '${OrganizerUKeyId}', '${TypeofAddress}', '${EventAddress}', '${Pincode}', '${EventCity}', ${setSQLBooleanValue(IsPrimaryAddress)}, 1, '${EntryTime}'
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
                OrganizerName : result?.recordset?.[0]?.OrganizerName
                , OrganizerMobile : result?.recordset?.[0]?.OrganizerMobile
                , UserName : result?.recordset?.[0]?.UserName
                , OrganizerUKeyId : result?.recordset?.[0]?.OrganizerUKeyId
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