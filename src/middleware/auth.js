const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../common/variable");
const { pool } = require("../sql/connectToDatabase");
const { setSQLStringValue, setSQLBooleanValue } = require("../common/main");

const verifyToken = async (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({
            status: 401,
            message: "A token is required for authentication",
        });
    }
    try {
        token = token.replace("Bearer ", "");
        token = token.replace("bearer ", "");
         const CheckToken = await pool
            .request()
            .input("Token", token)
            .query("SELECT * FROM user_devices WHERE Token = @Token AND Log_In = 1");
        if (CheckToken.recordset.length === 0) {
            return res.status(401).send({
                status: 401,
                message: "Invalid Token",
            });
        }
        
        if(setSQLBooleanValue(CheckToken.recordset[0].Log_Out) === 1 || setSQLBooleanValue(CheckToken.recordset[0].Log_In) === 0){
            if(token){
                const updateQuery = `
                UPDATE user_devices 
                SET Log_Out = 1, Log_In = 0, Log_Out_Time = GETDATE(), Remark = 'Invalid Token [Forced Logout by System]' 
                WHERE Token = ${setSQLStringValue(token)}
                `;
                await pool.request().query(updateQuery);
            }
            return res.status(401).send({
                status: 401,
                message: "Logged Out",
            });
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send(err?.message || "Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
