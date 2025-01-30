const multer = require('multer');

const SpeakerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Speaker`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
// const ImageUploadFields = [
//     { name: 'Img', maxCount: 1 },
// ];
const SpeakerUpload = multer({ storage: SpeakerStorage }).fields([
    { name: 'Img', maxCount: 1 },
]);

const SponsorStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Sponsor`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const SponsorUpload = multer({ storage: SponsorStorage }).fields([
    { name: 'Img', maxCount: 1 },
]);

const PaymentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Payment`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const PaymentUpload = multer({ storage: PaymentStorage }).fields([
    { name: 'PaymentImg', maxCount: 1 },
]);

const VolunteerMasterStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Volunteer`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const VolunteerMasterUpload = multer({ storage: VolunteerMasterStorage }).fields([
    { name: 'Img', maxCount: 1 },
]);

const carouselStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/carousel`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const ImageUploadFields = [
    { name: 'Img', maxCount: 1 },
];

const carouselUpload = multer({ storage: carouselStorage }).fields(ImageUploadFields);

const galleryMasterStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isVideo = file.mimetype.startsWith('video');
        const directory = isVideo ? './media/Gallery/Video' : './media/Gallery';
        // Ensure the Thumbnail directory logic is separate from multer storage configuration.
        if (file?.fieldname === 'Thumbnail') {
            const thumbnailDirectory = './media/Gallery/Thumbnail';
            // You can add additional logic here to handle thumbnail directory creation if needed.
            return cb(null, thumbnailDirectory);
        }
        cb(null, directory); // Only call the callback once with the appropriate directory.
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const galleryMasterUpload = multer({ 
    storage: galleryMasterStorage, 
    limits: { fileSize: Infinity } // No file size limit
}).fields([
    { name: 'Img', maxCount: 10 }, // Accept up to 10 files per request for flexibility
    { name: 'Thumbnail', maxCount: 1 }
]);


const ticketViewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/TicketView`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const ticketViewUpload = multer({ storage: ticketViewStorage }).fields(ImageUploadFields);


// Configure Multer storage
const EventStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Event`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

// Multer upload middleware
const EventUpload = multer({storage: EventStorage}).fields([
    { name: 'Img1', maxCount: 1 },
    { name: 'Img2', maxCount: 1 },
    { name: 'Img3', maxCount: 1 }
]);


const UserStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/User`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const UserUpload = multer({ storage: UserStorage }).fields([
    { name: 'ProfiilePic', maxCount: 1 },
]);

const complaintStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Complaint`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const complaintUpload = multer({ storage: complaintStorage }).fields(ImageUploadFields);

module.exports = {
    SpeakerUpload,
    SponsorUpload,
    PaymentUpload,
    VolunteerMasterUpload,
    carouselUpload,
    galleryMasterUpload,
    EventUpload,
    ticketViewUpload,
    UserUpload,
    complaintUpload
}