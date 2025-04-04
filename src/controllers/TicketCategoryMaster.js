const { errorMessage, successMessage, checkKeysAndRequireValues, generateCODE, setSQLBooleanValue, getCommonKeys, generateJWTT, generateUUID, getCommonAPIResponse, toFloat, setSQLStringValue, setSQLDecimalValue } = require("../common/main");
const {pool} = require('../sql/connectToDatabase');

const FetchTicketCategory = async(req, res)=>{
    try{
        const { TicketCateUkeyId, OrganizerUkeyId, EventUkeyId, IsActive } = req.query;
        let whereConditions = [];

        // Build the WHERE clause based on the Status
        if (TicketCateUkeyId) {
            whereConditions.push(`TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)}`);
        }
        if (EventUkeyId) {
            whereConditions.push(`EventUkeyId = ${setSQLStringValue(EventUkeyId)}`);
        }
        if (OrganizerUkeyId) {
            whereConditions.push(`OrganizerUkeyId = ${setSQLStringValue(OrganizerUkeyId)}`);
        }
        if(IsActive){
            whereConditions.push(`IsActive = ${setSQLBooleanValue(IsActive)}`);
        }
        // Combine the WHERE conditions into a single string
        const whereString = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const getUserList = {
            getQuery: `SELECT * FROM TicketCategoryMaster ${whereString} ORDER BY EntryDate DESC`,
            countQuery: `SELECT COUNT(*) AS totalCount FROM TicketCategoryMaster ${whereString}`,
        };
        const result = await getCommonAPIResponse(req, res, getUserList);
        return res.json(result);

    }catch(error){
        return res.status(400).send(errorMessage(error?.message));
    }
}

const TicketCategoryMaster = async(req, res)=>{
    const { TicketCateUkeyId, TicketLimits, Category, TicketPrice, IsActive = true, OrganizerUkeyId, EventUkeyId, DiscPer, DiscAmt, flag, ConvenienceFee} = req.body;
    const {IPAddress, ServerName, EntryTime} = getCommonKeys(req);
    try{
        const missingKeys = checkKeysAndRequireValues(['TicketCateUkeyId', 'TicketLimits', 'Category', 'TicketPrice', 'IsActive', 'OrganizerUkeyId', 'EventUkeyId'], req.body)
        if(missingKeys.length > 0){
            return res.status(200).json(errorMessage(`${missingKeys.join(', ')} is required`));
        }
        
        // Exclude the current category in case of update
        const EventCategoryLimits = await pool.request().query(`
            SELECT SUM(TicketLimits) AS TotalLimits 
            FROM TicketCategoryMaster 
            WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)}
            ${flag === 'U' ? `AND TicketCateUkeyId != ${setSQLStringValue(TicketCateUkeyId)}` : ''}
        `);
        
        const EventLimits = await pool.request().query(`
            SELECT TicketLimit FROM EventMaster WHERE EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        `);
        
        const totalExistingLimits = EventCategoryLimits.recordset?.[0]?.TotalLimits || 0;
        const eventSeatLimit = EventLimits.recordset?.[0]?.TicketLimit || 0;
        
        if (totalExistingLimits + TicketLimits > eventSeatLimit) {
            return res.status(400).json(errorMessage(
                `Event limit exceeded! Max: ${eventSeatLimit}, Assigned: ${totalExistingLimits}.`
            ));
        }
        
        const insertQuery = `
            INSERT INTO TicketCategoryMaster (
                TicketCateUkeyId, TicketLimits, Category, TicketPrice, IsActive, OrganizerUkeyId, EventUkeyId, flag, IpAddress, HostName, EntryDate, DiscPer, DiscAmt, ConvenienceFee
            ) VALUES (
                ${setSQLStringValue(TicketCateUkeyId)}, ${setSQLStringValue(TicketLimits)}, ${setSQLStringValue(Category)}, ${setSQLStringValue(TicketPrice)}, ${setSQLStringValue(IsActive)}, ${setSQLStringValue(OrganizerUkeyId)}, ${setSQLStringValue(EventUkeyId)}, ${setSQLStringValue(flag)}, ${setSQLStringValue(IPAddress)}, ${setSQLStringValue(ServerName)}, ${setSQLStringValue(EntryTime)}, ${setSQLStringValue(DiscPer)}, ${setSQLStringValue(DiscAmt)}, ${setSQLDecimalValue(ConvenienceFee)}
            );
        `
        const deleteQuery = `
            DELETE FROM TicketCategoryMaster WHERE TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)}
        `
        if(flag == 'A'){
            const result = await pool.request().query(insertQuery);

            if(result.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Ticket Category Created.'),})
            }

            return res.status(200).json({...successMessage('New Ticket Category Created Successfully.'), ...req.body});

        }else if(flag === 'U'){

            const deleteResult = await pool.request().query(deleteQuery);
            const insertResult = await pool.request().query(insertQuery);

            if(deleteResult.rowsAffected[0] === 0 && insertResult.rowsAffected[0] === 0){
                return res.status(400).json({...errorMessage('No Ticket Category Updated.')})
            }

            return res.status(200).json({...successMessage('New Ticket Category Updated Successfully.'), ...req.body});
        }else{
            return res.status(400).json({...errorMessage("Use 'A' flag to Add and 'U' flag to update, it is compulsary to send flag.")});
        }
    }catch(error){
        if(flag === 'A'){
            console.log('Add Ticket Category Error :', error);
        }
        if(flag === 'U'){
            console.log('Update Ticket Category Error :', error);
        }
        return res.status(500).send(errorMessage(error?.message));
    }
}

const RemoveTicketCategory = async(req, res)=>{
    try{
        const {TicketCateUkeyId, EventUkeyId} = req.query;

        const missingKeys = checkKeysAndRequireValues(['TicketCateUkeyId', 'EventUkeyId'], req.query);

        if(missingKeys.length > 0){
            return res.status(400).json(errorMessage(`${missingKeys.join(', ')} is Required`));
        }
        const CountOfBookedTicketOnCategory = await pool.request().query(`select COUNT(*) AS BookedTickets from Bookingdetails where TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)}`)

        if(CountOfBookedTicketOnCategory?.recordset?.[0]?.BookedTickets > 0){
            return res.status(200).json(errorMessage('Ticket category cannot be deleted as tickets have already been booked under this category.'))
        }

        const query = `
            DELETE FROM TicketCategoryMaster WHERE TicketCateUkeyId = ${setSQLStringValue(TicketCateUkeyId)} and EventUkeyId = ${setSQLStringValue(EventUkeyId)}
        `

        const result = await pool.request().query(query);
            
        if(result.rowsAffected[0] === 0){
            return res.status(400).json({...errorMessage('No Ticket Category Deleted.')})
        }

        return res.status(200).json({...successMessage('Ticket Category Deleted Successfully.'), ...req.query});
    }catch(error){
        console.log('Delete Ticket Category Error :', error);
        return res.status(500).json({...errorMessage(error.message)});
    }
}

module.exports = {
    FetchTicketCategory,
    TicketCategoryMaster,
    RemoveTicketCategory
}