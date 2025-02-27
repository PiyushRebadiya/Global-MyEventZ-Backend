const router = require("express").Router();
// const UserController = require('../controllers/User');
const UserMasterController = require('../controllers/User_Master');
const UserController = require('../controllers/User');
const EventMasterController = require('../controllers/Event_Master');
const PaymentMasterController = require('../controllers/Payment_Master');
const TicketMasterController = require('../controllers/Ticket_Master');
const OrginizerMasterController = require('../controllers/Organizer_Master');
const QRCodeMasterController = require('../controllers/QR_Code');
const EventController = require('../controllers/Event_Master');
const VerifyTicketController = require('../controllers/Verify_Ticket');
const SpeakerMasterController = require('../controllers/Speaker_Master');
const RazorpayController = require('../controllers/Razorpay');
const PaymentController = require('../controllers/Payment');
const SponsorMasterController = require('../controllers/Sponsor_Master');
const TicketPriceMasterController = require('../controllers/Ticket_Price_Master');
const VolunteerMasterController = require('../controllers/Volumteer_Master');
const SponsorCategoryMasterController = require('../controllers/Sponsor_Category_Master');
const carouselController = require('../controllers/Carousel_Master');
const galleryMasterController = require('../controllers/Gallery_Master');
const TicketViewController = require('../controllers/TicketView_Master');
const firebaseSentNotification = require('../controllers/firebaseSentNotification');
const AutoSentNotificationController = require('../controllers/Auto_Sent_Notification');
const ContactMasterController = require('../controllers/Contact_Master');
const TicketLimitMasterController = require('../controllers/Ticket_Limit_Master');
const MemberTypeMasterController = require('../controllers/Member_Type_Master');
const DashbordController = require('../controllers/dashbord');
const bellNotificationController = require('../controllers/bellNotification');
const bellNotificationByUserController = require('../controllers/bellNotificationByUser');
const LogTableController = require('../controllers/VerifyLog');
const TemplateMasterController = require('../controllers/Template_Master');
const WhatsAppMsgController = require('../controllers/Whats_App_Msg');
const FeedbackMasterController = require('../controllers/FeedBack_Master');
const GateNoListController = require('../controllers/Gate_No_List');
const ComplaintMasterController = require('../controllers/ComplaintMaster');
const LiveStreamController = require('../controllers/Live_Stream');
const IsTicketUserList = require('../controllers/IsTicketUserList');
const ReactDeployController = require('../controllers/React_Deploy_IIS');
const professionCategoryMaster = require('../controllers/professionCategory.js');
const userCategoryMaster = require('../controllers/userCategory');
const StateController = require('../controllers/State');
const CityController = require('../controllers/city');
const OrgUserController = require('../controllers/OrgUserMaster');
const PaymentGatewayMaster = require('../controllers/PaymentGatewayMaster');
// const carouselController = require('../controllers/carousel');

const auth = require("../middleware/auth");

const {SpeakerUpload, SponsorUpload, PaymentUpload, VolunteerMasterUpload, carouselUpload, galleryMasterUpload, ticketViewUpload, UserUpload, complaintUpload, OrginizerUpload} = require('../upload/index');

router.get("/fetchUserMaster", auth, UserMasterController.fetchUserMaster)
router.post("/user_master", UserUpload, UserMasterController.addOrUpdateUserMaster)
router.delete("/delete_user_master", auth, UserMasterController.deleteUserMaster)

router.post("/verify_user_master", UserMasterController.verifyHandler)

router.get('/list_organizer', auth, UserController.fetchOrganizer);
router.post('/organizer_login', UserController.Loginorganizer);
router.post('/organizer_signup', UserController.AddOrginizer);
router.put('/update_organizer', auth, OrginizerUpload, UserController.updateOrginizer);

router.get('/fetch_state', StateController.fetchStateData);
router.get('/fetch_city', CityController.fetchCityData);
//#region EVENTMASTER 
router.get('/fetch_event_list', auth, EventMasterController.EventList);
router.get('/fetch_event_by_id', auth, EventMasterController.fetchEventById);
router.post('/event_master', auth, EventController.addEvent);
router.delete('/delete_event', auth, EventController.RemoveEvent);
//#endregion
router.get('/fetch_org_user_master', auth, OrgUserController.FetchOrgUserMasterDetails);
router.post('/org_user_master', auth, OrginizerUpload, OrgUserController.OrgUserMaster);
router.delete('/delete_org_user_master', auth, OrgUserController.RemoveOrgUser);

router.get("/fetch_payment_master", auth, PaymentMasterController.fetchPaymentMaster)
router.get("/set_payment_flag", PaymentMasterController.setPaymentFlag)
router.get("/fetch_payment_and_tickets", auth, PaymentMasterController.fetchPaymentAndTickets)
router.post("/add_payment_master", auth, PaymentUpload, PaymentMasterController.addPaymentMaster)
router.put("/update_payment_master", auth, PaymentUpload, PaymentMasterController.updatePaymentMaster)
router.put("/update_payment_statusr", auth, PaymentMasterController.updatePaymentStatus)
router.delete("/delete_payment_master", auth, PaymentMasterController.deletePaymentMaster)

router.get("/fetch_ticket_master", auth, TicketMasterController.fetchTicketMaster)
router.get("/fetch_ticket_list_by_usercode", auth, TicketMasterController.fetchTicketListOnUserCode)
router.get("/fetch_ticket_gate_no", auth, TicketMasterController.fetchTicketGateNo)
router.post("/add_ticket_master", auth, TicketMasterController.addTicketMaster)
router.put("/update_ticket_master", auth, TicketMasterController.updateTicketMaster)
router.delete("/delete_ticket_master", auth, TicketMasterController.deleteTicketMaster)

router.get('/fetch_orginizer_master', auth, OrginizerMasterController.FetchOrganizerDetails);
router.post('/orginizer_master', OrginizerMasterController.OrginazerMaster);
router.delete('/delete_orginizer_master', auth, OrginizerMasterController.RemoveOrginazer);

router.get('/generate_qr_code', QRCodeMasterController.generateQRCode);
router.get('/generate_qr_code_image', QRCodeMasterController.generateQRCodeImageView);

router.post('/verify_ticket', auth, VerifyTicketController.verifyTicket);

router.get('/fetch_speaker_master', auth, SpeakerMasterController.FetchSpeakerMasterDetails);
router.post('/speaker_master', auth, SpeakerMasterController.SpeakerMaster);
router.delete('/delete_speaker_master', auth, SpeakerMasterController.RemoveSpeaker);

router.get('/razorpay/credentials', RazorpayController.fetchRazorpayCredentials);
router.put('/razorpay/credentials', auth, RazorpayController.updateRazorpayCredentials);

router.get('/payment', auth, PaymentController.getPaymentDetails);
router.post('/payment/create', PaymentController.createPayment);
router.post('/payment/capture', PaymentController.capturePayment);
router.get('/payment/all', auth, PaymentController.getAllPayments);

router.get('/fetch_sponsor_master', SponsorMasterController.FetchSponsorMasterDetails);
router.post('/sponsor_master', auth, SponsorUpload, SponsorMasterController.SponsorMaster);
router.delete('/delete_sponsor_master', auth, SponsorMasterController.RemoveSponsor);

router.get('/fetch_ticket_price_master', auth, TicketPriceMasterController.TicketPriceMasterList);
router.post('/ticket_price_master', auth, TicketPriceMasterController.addTicketPriceMaster);
router.delete('/delete_ticket_price_master', auth, TicketPriceMasterController.RemoveTicketPriceMaster);

router.get('/fetch_volunteer_master', auth, VolunteerMasterController.FetchVolunteerMasterDetails);
router.get('/fetch_volunteer_dashboard_view', auth, VolunteerMasterController.VolunteerDashboardView);
router.get('/verify_volunteer', VolunteerMasterController.LoginVolunteer);
router.post('/volunteer_master', auth, VolunteerMasterUpload, VolunteerMasterController.VolunteerMaster);
router.delete('/delete_volunteer_master', auth, VolunteerMasterController.RemoveVolunteer);

router.get('/fetch_sponsor_category_master', auth, SponsorCategoryMasterController.FetchSponsorCategoryMasterDetails);
router.post('/sponsor_category_master', auth, SponsorCategoryMasterController.SponsorCategoryMaster);
router.delete('/delete_sponsor_category_master', auth, SponsorCategoryMasterController.RemoveSponsorCategory);

router.get("/carousel_list", carouselController.fetchCarouselList)
router.post("/carousel_master", auth, carouselUpload, carouselController.CarouserMaster)
router.delete('/delete_carousel_master', auth, carouselController.RemoveCarousel);

router.get("/gallery_list", auth, galleryMasterController.FetchGalleryMasterDetails);
router.post("/gallery_master", auth, galleryMasterUpload, galleryMasterController.GalleryMaster);
router.delete('/delete_gallery_master', auth, galleryMasterController.RemoveGalleryMaster);

router.get("/ticketview_list", auth, TicketViewController.fetchTicketViewList)
router.post("/ticketview_master", auth, ticketViewUpload, TicketViewController.TicketViewMaster)
router.delete('/delete_ticketview_master', auth, TicketViewController.RemoveTicketView);

router.post('/send_notification_in_background', auth, firebaseSentNotification.sendNotificationInBackground);

router.get("/auto_sent_notification_list", auth, AutoSentNotificationController.fetchAutoSentNotificationList)
router.post("/auto_sent_notification_master", auth, AutoSentNotificationController.AutoSentNotificationHandler)
router.delete('/delete_auto_sent_notification', auth, AutoSentNotificationController.removeAutoSentNotification);

router.get('/fetch_contact_master', auth, ContactMasterController.FetchContactMasterDetails);
router.post('/add_contact_master', ContactMasterController.AddContactMasterMaster);

router.get('/fetch_ticket_limit', auth, TicketLimitMasterController.FetchTicketLimitMasterDetails);
router.post('/ticket_limit_master', auth, TicketLimitMasterController.TicketLimitMaster);
router.delete('/delete_ticket_limit', auth, TicketLimitMasterController.RemoveTicketLimit);

router.get('/fetch_member_type_master', auth, MemberTypeMasterController.FetchMemberTypeMasterDetails);
router.post('/member_type_master', auth, MemberTypeMasterController.MemberTypeMaster);
router.delete('/delete_member_type_master', auth, MemberTypeMasterController.RemoveMemberTypeMaster);

router.get('/dashboard_list', auth, DashbordController.DashbordList);
router.get("/bell_notification_list", auth, bellNotificationController.fetchBellNotificationList);
router.get("/user_bell_notification_view", auth, bellNotificationController.fetchUserNotificationView);

router.post("/bell_notification_by_user", auth, bellNotificationByUserController.verifyBellNotificationByUser);

router.get('/Fetch_verify_ticket_log', auth, LogTableController.fetchLogTable);

router.get('/fetch_template_master', auth, TemplateMasterController.FetchTemplateMasterDetails);
router.post('/manage_template_master', auth, TemplateMasterController.ManageTemplateMaster);
router.delete('/delete_template_master', auth, TemplateMasterController.RemoveTemplateMaster);

router.get('/fetch_what_app_msg', auth, WhatsAppMsgController.fetchWhatAppMsg);
router.post('/add_what_app_msg', auth, WhatsAppMsgController.addWhatsAppMsg);
router.delete('/delete_what_app_msg', auth, WhatsAppMsgController.deleteWhatAppMsg);

router.get('/fetch_gate_no_list', auth, GateNoListController.list_Of_Gate_No);

router.get('/fetch_feedback_master', auth, FeedbackMasterController.FetchFeedbackMasterDetails);
router.post('/feedback_master', auth, FeedbackMasterController.FeedbackMaster);
router.delete('/delete_feedback', auth, FeedbackMasterController.RemoveFeedbackMaster);

router.get("/fetch_complaint_list", auth, ComplaintMasterController.fetchComplaintList)
router.post("/manage_complaint_master", auth, complaintUpload, ComplaintMasterController.manageComplaintMaster)
router.delete('/delete_complaint', auth, ComplaintMasterController.removeComplaintMaster);

router.get('/fetch_live_stream', auth, LiveStreamController.FetchLiveStreamMasterDetails);
router.post('/manage_live_stream', auth, LiveStreamController.ManageLiveStreamMaster);
router.delete('/delete_live_stream', auth, LiveStreamController.RemoveLiveStreamMaster);

router.get('/fetch_ticket_user_list', auth, IsTicketUserList.Ticket_User_List);

router.post('/testing', ReactDeployController.setupIISForSubdomain);

router.get('/fetch_profession_category', auth, professionCategoryMaster.FetchprofessionCategoryMaster);
router.post('/profession_category_master', auth, professionCategoryMaster.professionCategoryMaster);
router.delete('/delete_profession_category', auth, professionCategoryMaster.RemoveprofessionCategory);

router.get('/fetch_user_category_master', userCategoryMaster.fetchUserCategory);
router.post('/user_category_master', auth, userCategoryMaster.createUserCategory);
router.delete('/delete_user_category_master', auth, userCategoryMaster.removeUserCategory);

router.get('/fetch_payment_gateway', auth, PaymentGatewayMaster.FetchPaymentGatewayMasterDetails);
router.post('/payment_gateway_master', auth, PaymentGatewayMaster.PaymentGatewayMaster);
router.delete('/delete_payment_gateway', auth, PaymentGatewayMaster.RemovePaymentGateway);

module.exports = router;