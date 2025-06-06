
const dotenv = require("dotenv");
dotenv.config();

const { PORT, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_SERVER, DATABASE_USER, SECRET_KEY, LIVE_URL, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_CLIENT_ID, FIREBASE_CLIENT_X509_CERT_URL } = process.env;

module.exports = {
    PORT,
    DATABASE_PASSWORD,
    DATABASE_NAME,
    DATABASE_SERVER,
    DATABASE_USER,
    SECRET_KEY,
    LIVE_URL,
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID,
    FIREBASE_CLIENT_X509_CERT_URL
}