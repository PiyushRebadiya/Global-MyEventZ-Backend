const express = require('express');
const { PORT } = require('./common/variable');
// const { createAllTableInDB } = require('./db/version');
const { connectToDatabase } = require('./sql/connectToDatabase');
const routes = require('./Routes/routes');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { autoVerifyCarousel, autoUpdateEvent, autoUpdateCoupon } = require('./controllers/autoRunQuery');
const cron = require('node-cron');
// const { sendNotificationOnSetTime } = require('./controllers/globleAutoSentNotification');
const path = require('path');
const { sendNotificationOnSetTime, autoSendEventReview } = require('./common/notification');
// const { sendNotificationOnSetTime } = require('./controller/globleAutoSentNotification');

// Connect to the database
connectToDatabase()
.then(() => {

    console.log('Connected to the database successfully');
})
.catch(error => {
    console.error('Error connecting to the database:', error);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json())
app.use(cors());

// Middleware to disable caching for all GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next(); // Pass control to the next middleware/route
});
// app.use('/', express.static(`./media/carousel`));
// app.use('/', express.static(`./media/sentNotification`));
// app.use('/', express.static(`./media/userInfo`));

app.use('/', express.static(`./media/Speaker`));
app.use('/', express.static(`./media/Sponsor`));
app.use('/', express.static(`./media/Payment`));
app.use('/', express.static(`./media/Volunteer`));
app.use('/', express.static(`./media/Carousel`));
app.use('/', express.static(`./media/Gallery`));
app.use('/', express.static(`./media/Gallery/Video`));
app.use('/', express.static(`./media/Gallery/Thumbnail`));
app.use('/', express.static(`./media/Event`));
app.use('/', express.static(`./media/TicketView`));
app.use('/', express.static(`./media/User`));
app.use('/', express.static(`./media/Complaint`));
app.use('/', express.static(`./media/Organizer`));
app.use('/', express.static(`./media/DocumentUpload`));
app.use('/', express.static(`./media/Reminder`));
app.use('/', express.static(`./media/Contect`));

app.use("/", routes);

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/home', 'index.html'));
});

// cron.schedule('58 13 * * *', () => {
//     console.log('Running Auto Task ' + new Date());
// });


// call for new DB Entry
// setTimeout(() => {
//     createAllTableInDB();
// }, 5000);

setInterval(() => {
    sendNotificationOnSetTime()
}, 300000);

cron.schedule('0 15 * * *', () => {
    autoSendEventReview();
});
// let i = 0

// routes.stack.map(()=>{
//     i++
// })

// console.log('number of apis in myeventz :',i);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
