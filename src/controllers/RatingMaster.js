const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, setSQLStringValue, setSQLNumberValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const fetchRatings = async (req, res)=>{
    try{
        const { ReviewUkeyId, Star, UserUkeyId } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (ReviewUkeyId) {
            whereConditions.push(`ReviewUkeyId = ${setSQLStringValue(ReviewUkeyId)}`);
        }
        if (UserUkeyId) {
            whereConditions.push(`UserUkeyId = ${setSQLStringValue(UserUkeyId)}`);
        }
        if (Star) {
            whereConditions.push(`Star = ${setSQLStringValue(Star)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM RatingMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM RatingMaster ${whereString}`,
        };

        const result = await getCommonAPIResponse(req, res, getUserList);

        return res.json({
            ...result,
        });
    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const RatingMaster = async (req, res)=>{
    const { ReviewUkeyId, ReviewDetail, Star, UserUkeyId, flag} = req.body;
    
    try{
        const missingKeys = checkKeysAndRequireValues(['ReviewUkeyId', 'UserUkeyId'], req.body);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')}, is required`))
        }
        const { IPAddress, ServerName, EntryTime } = getCommonKeys(req);

        const insertQuery = `
            INSERT INTO RatingMaster (ReviewUkeyId, UserUkeyId, ReviewDetail, Star, IpAddress, HostName, EntryDate, flag) VALUES (
            ${setSQLStringValue(ReviewUkeyId)}, 
            ${setSQLStringValue(UserUkeyId)}, 
            ${setSQLStringValue(ReviewDetail)}, 
            ${setSQLNumberValue(Star)}, 
            ${setSQLStringValue(IPAddress)},
            ${setSQLStringValue(ServerName)},
            ${setSQLStringValue(EntryTime)},
            ${setSQLStringValue(flag)}
            );
        `

        const deleteQuery = `
            DELETE FROM RatingMaster WHERE ReviewUkeyId = '${ReviewUkeyId}';
        `

        if(flag == 'A'){

            const result = await pool.request().query(insertQuery);
                
            if(result.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Rating Created.'),})
            }
    
            return res.status(200).json({...successMessage('New Rating Created Successfully.'), ...req.body, ReviewUkeyId});

        }else if(flag === 'U'){

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Rating Updated.')})
            }
    
            return res.status(200).json({...successMessage('Rating Updated Successfully.'), ...req.body, ReviewUkeyId});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Rating Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Rating Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
}

const RemoveRating = async (req, res) => {
    try{
        const {ReviewUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['ReviewUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }

        const query = `
            DELETE FROM RatingMaster WHERE ReviewUkeyId = '${ReviewUkeyId}'
        `
    
        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Orginizer Deleted.')})
        }

        return res.status(200).json({...successMessage('Orginizer Deleted Successfully.'), ReviewUkeyId});
    }catch(error){
        console.log('Delete Event Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    fetchRatings,
    RatingMaster,
    RemoveRating,
}