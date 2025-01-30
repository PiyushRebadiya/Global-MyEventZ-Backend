const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const { checkKeysAndRequireValues, errorMessage, successMessage } = require('../common/main');
const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_X509_CERT_URL, FIREBASE_CLIENT_ID, FIREBASE_CLIENT_EMAIL, LIVE_URL } = require('../common/variable');

const serviceAccount = {
  type: "service_account",
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: FIREBASE_PRIVATE_KEY.replaceAll('\\n','\n'),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/firebase.messaging"
];

const getAccessToken = async () => {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: scopes
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
};

const sentNotificationOnSetTime = async (req) => {
  const { Title, Description, Link = '', NotificationToken, Image, BussinessName = '', MobileNumber = '' } = req.body;

  // Check for missing required keys
  const missingKeys = checkKeysAndRequireValues(['Title', 'Description', 'NotificationToken'], req.body);
  if (missingKeys.length !== 0) {
    console.error('Missing required keys:', missingKeys);
    return;
  }

  try {
    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.error('Failed to retrieve access token');
      return;
    }

    // Define the endpoint
    const endpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    // Construct the notification message
    const message = {
      message: {
        token: NotificationToken,
        notification: {
          title: Title,
          body: Description,
          image: `${Image}`
        },
        data: {
          page: Link
        }
      }
    };

    // Send the notification
    const response = await axios.post(endpoint, message, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Notification Sent Successfully:', response.data);
  } catch (error) {
    console.log('BussinessName', `${BussinessName} - ${MobileNumber}`);
    console.error('Failed to send notification:', error.response ? error.response.data : error.message);
  }
}

const sendNotificationInBackground = async (req, res) => {
  const { Title, Description, LinkType, Link, NotificationToken, Image } = req.body;

  const missingKeys = checkKeysAndRequireValues(['Title', 'Description', 'NotificationToken'], req.body)
  if (missingKeys.length !== 0) {
    return res.status(400).send(errorMessage(`${missingKeys} is required`));
  }
  const accessToken = await getAccessToken();

  const endpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

  const message = {
    message: {
      token: NotificationToken,
      notification: {
        title: Title,
        body: Description,
        image: `${LIVE_URL}/${Image}`
      },
      data: {
        page: Link
      }
    }
  };

  try {
    const response = await axios.post(endpoint, message, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('Send Notification Done', response.data);
    return res.status(200).send(successMessage('Notification sent successfully'));
  } catch (error) {
    console.error('Failed Notification Sent', error.response ? error.response.data : error.message);
    return res.status(500).send(errorMessage(error.response ? error?.response?.data?.error?.message : error.message));
  }
};

module.exports = {
  sendNotificationInBackground,
  sentNotificationOnSetTime,
}
