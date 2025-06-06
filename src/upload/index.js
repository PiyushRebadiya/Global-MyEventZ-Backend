const multer = require('multer');
const fs = require('fs');

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

const OrginezerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Organizer`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const OrginizerUpload = multer({ storage: OrginezerStorage }).fields([
    { name: 'Image', maxCount: 1 },
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

const documentUploadStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}`, { recursive: true });
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}`, { recursive: true });
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}/${req?.body?.Category}`, { recursive: true });
        cb(null, `./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}/${req?.body?.Category}/`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const DocumentUploadUpload = multer({ storage: documentUploadStorage }).fields([
    { name: 'FileName', maxCount: 100 },
]);

const documentUploadStorageV2 = multer.diskStorage({
    destination: async function (req, file, cb) {
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}`, { recursive: true });
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}`, { recursive: true });
        await fs.mkdirSync(`./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}/${req?.body?.Category}`, { recursive: true });
        cb(null, `./media/DocumentUpload/${req?.body?.OrganizerUkeyId}/${req?.body?.EventUkeyId}/${req?.body?.Category}/`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const DocumentUploadUploadV2 = multer({ storage: documentUploadStorageV2 }).fields([
    { name: 'FileName', maxCount: 100 },
]);

const ReminderStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Reminder`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const ReminderUpload = multer({ storage: ReminderStorage }).fields([
    { name: 'Image', maxCount: 1 },
]);

const ContectStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./media/Contect`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const ContectUpload = multer({ storage: ContectStorage }).fields([
    { name: 'Image', maxCount: 1 },
]);

module.exports = {
    SpeakerUpload,
    SponsorUpload,
    PaymentUpload,
    VolunteerMasterUpload,
    carouselUpload,
    galleryMasterUpload,
    ticketViewUpload,
    UserUpload,
    complaintUpload,
    OrginizerUpload,
    DocumentUploadUpload,
    ReminderUpload,
    ContectUpload,
    DocumentUploadUploadV2
}