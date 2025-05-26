const router = require("express").Router();
// const UserController = require('../controllers/User');
const UserMasterController = require('../controllers/User_Master');
const UserController = require('../controllers/User');
const EventMasterController = require('../controllers/Event_Master');
// const PaymentMasterController = require('../controllers/Payment_Master');
// const TicketMasterController = require('../controllers/Ticket_Master');
const OrginizerMasterController = require('../controllers/Organizer_Master');
const QRCodeMasterController = require('../controllers/QR_Code');
const EventController = require('../controllers/Event_Master');
// const VerifyTicketController = require('../controllers/Verify_Ticket');
const SpeakerMasterController = require('../controllers/Speaker_Master');
const RazorpayController = require('../controllers/Razorpay');
const PaymentController = require('../controllers/RazorpayAPIs');
const SponsorMasterController = require('../controllers/Sponsor_Master');
// const TicketPriceMasterController = require('../controllers/Ticket_Price_Master');
// const VolunteerMasterController = require('../controllers/Volumteer_Master');
const SponsorCategoryMasterController = require('../controllers/Sponsor_Category_Master');
const carouselController = require('../controllers/Carousel_Master');
const galleryMasterController = require('../controllers/Gallery_Master');
// const TicketViewController = require('../controllers/TicketView_Master');
// const AutoSentNotificationController = require('../controllers/Auto_Sent_Notification');
// const TicketLimitMasterController = require('../controllers/Ticket_Limit_Master');
const ReminderMasterController = require('../controllers/ReminderMaster');
// const LogTableController = require('../controllers/VerifyLog');
const TemplateMasterController = require('../controllers/Template_Master');
const WhatsAppMsgController = require('../controllers/Whats_App_Msg');
const FeedbackMasterController = require('../controllers/FeedBack_Master');
// const IsTicketUserList = require('../controllers/IsTicketUserList');
const professionCategoryMaster = require('../controllers/professionCategory.js');
const userCategoryMaster = require('../controllers/userCategory');
const StateController = require('../controllers/State');
const CityController = require('../controllers/city');
const OrgUserController = require('../controllers/OrgUserMaster');
const PaymentGatewayMaster = require('../controllers/PaymentGatewayMaster');
const DocumentUploadController = require('../controllers/DocumentUpload');
const TicketCategoryController = require('../controllers/TicketCategoryMaster');
const otpController = require('../controllers/otp.js');
const BookingController = require('../controllers/BookingMaster');
const ContectMasterController = require('../controllers/ContectMaster');
const EventContectSettingController = require('../controllers/EventContectSetting');
const RoleRightsControler = require('../controllers/RoleRights');
const CouponMasterController = require('../controllers/CouponMaster');
const MobileSMSMasterController = require('../controllers/MobileSMSMaster');
const SuperAdminDashboardController = require('../controllers/SuperAdminDashboard');
const AdminDashboardController = require('../controllers/AdminDashboardList');
const EventCategoryNasterController = require('../controllers/EventCategoryMaster');
const OrgtermandconditionController = require('../controllers/Org_TermsCondi');
const PricingMasterController = require('../controllers/priceMaster');
const whatsnewcontroller = require('../controllers/WhatsNew');
const OrganizerEmail = require('../controllers/sendEmail');
const SubscriberMaster = require('../controllers/subscriberMaster');
const RatingMasterController = require('../controllers/RatingMaster');
const DisclaimerMasterController = require('../controllers/DisclaimerMaster');
const EmailsLogsAPIController = require('../controllers/EmailsLogsAPI.js');
const firebaseSentNotification = require('../controllers/firebaseSentNotification');
// const carouselController = require('../controllers/carousel');

const auth = require("../middleware/auth");

const { UserUpload, OrginizerUpload, DocumentUploadUpload, ReminderUpload, ContectUpload, DocumentUploadUploadV2} = require('../upload/index');

//#region User Master
router.get("/fetchUserMaster", auth, UserMasterController.fetchUserMaster)
router.get("/verify_user_mobile_number", auth, UserMasterController.VerifyUserMobileNumber)
router.get("/verify_user_email_id", UserMasterController.VerifyUserEmail)
router.post("/user_login_with_email", UserMasterController.UserLoginWithEmail)
router.post("/user_master", UserUpload, UserMasterController.addOrUpdateUserMaster)
router.delete("/delete_user_master", auth, UserMasterController.deleteUserMaster)

router.post("/verify_user_master", UserMasterController.verifyHandler)

router.post("/sentOTP", otpController.otpVerificationHandler)

router.get('/fetch_profession_category', auth, professionCategoryMaster.FetchprofessionCategoryMaster);
router.post('/profession_category_master', auth, professionCategoryMaster.professionCategoryMaster);
router.delete('/delete_profession_category', auth, professionCategoryMaster.RemoveprofessionCategory);

router.get('/fetch_user_category_master', userCategoryMaster.fetchUserCategory);
router.post('/user_category_master', auth, userCategoryMaster.createUserCategory);
router.delete('/delete_user_category_master', auth, userCategoryMaster.removeUserCategory);
//#endregion

//#region Organizer APIs
router.get('/list_organizer', auth, UserController.fetchOrganizer);
router.get('/verify_organizer_mobile_number', UserController.VerifyOrganizerMobileNumber);
router.get('/verify_Organizer_email_id', UserController.verifyOrganizerEmail);
router.post('/organizer_login', UserController.Loginorganizer);
router.post('/login_with_mobile_and_role', UserController.loginWithMobileAndRole);
router.post('/organizer_login_with_email', UserController.Loginorganizerwithemail);
router.post('/organizer_signup', UserController.AddOrginizer);
router.post('/forget_passwrod', UserController.ForgetPasswordForOrganizer);
router.put('/update_organizer', auth, OrginizerUpload, UserController.updateOrginizer);

router.get('/fetch_org_user_master', auth, OrgUserController.FetchOrgUserMasterDetails);
router.get('/fetch_org_user_master_mob', OrgUserController.FetchOrgUserMasterDetails);
router.post('/org_user_master', auth, OrginizerUpload, OrgUserController.OrgUserMaster);
router.delete('/delete_org_user_master', auth, OrgUserController.RemoveOrgUser);

router.get('/fetch_orginizer_master', auth, OrginizerMasterController.FetchOrganizerDetails);
router.get('/fetch_all_organizer', auth, OrginizerMasterController.fetchAllOrganizer);
router.post('/orginizer_master', OrginizerMasterController.OrginazerMaster);
router.delete('/delete_orginizer_master', auth, OrginizerMasterController.RemoveOrginazer);
//#endregion
router.get('/fetch_state', StateController.fetchStateData);
router.get('/fetch_city', CityController.fetchCityData);
//#region EVENTMASTER , EVENT CATEGORY MASTER
router.get('/fetch_event_list', auth, EventMasterController.EventList);
router.get('/fetch_event_by_id', auth, EventMasterController.fetchEventById);
router.get('/fetch_event_list_mob', EventMasterController.EventList);
router.get('/fetch_event_by_id_mob', EventMasterController.fetchEventById);
router.post('/event_master', auth, EventController.addEvent);
router.delete('/delete_event', auth, EventController.RemoveEvent);

router.get('/fetch_event_category', EventCategoryNasterController.fetchEventCategory);
router.post('/event_category_master', auth, EventCategoryNasterController.EventCategoryMaster);
router.delete('/delete_event_category', auth, EventCategoryNasterController.RemoveEventCategory);
//#endregion

//#region SPEAKER APIs
router.get('/fetch_speaker_master', SpeakerMasterController.FetchSpeakerMasterDetails);
router.get('/fetch_speaker_master_mob', SpeakerMasterController.FetchSpeakerMasterDetails);
router.post('/speaker_master', auth, SpeakerMasterController.SpeakerMaster);
router.delete('/delete_speaker_master', auth, SpeakerMasterController.RemoveSpeaker);
//#endregion
//#region SPONSOR APIs
router.get('/fetch_sponsor_master', SponsorMasterController.FetchSponsorMasterDetails);
router.get('/fetch_sponsor_master_mob', SponsorMasterController.FetchSponsorMasterDetails);
router.post('/sponsor_master', auth, SponsorMasterController.SponsorMaster);
router.delete('/delete_sponsor_master', auth, SponsorMasterController.RemoveSponsor);

router.get('/fetch_sponsor_category_master', auth, SponsorCategoryMasterController.FetchSponsorCategoryMasterDetails);
router.post('/sponsor_category_master', auth, SponsorCategoryMasterController.SponsorCategoryMaster);
router.delete('/delete_sponsor_category_master', auth, SponsorCategoryMasterController.RemoveSponsorCategory);
//#endregion
//#region carousel
router.get("/carousel_list", carouselController.fetchCarouselList)
router.post("/carousel_master", auth, DocumentUploadUpload, carouselController.CarouserMaster)
router.delete('/delete_carousel_master', auth, carouselController.RemoveCarousel);
//#endregion
//#region NOTIFICATION APIs MESSAGE
router.get('/fetch_reminder', auth, ReminderMasterController.fetchReminderMaster);
router.post('/reminder_master', auth, ReminderUpload, ReminderMasterController.ReminderMaster);
router.delete('/delete_reminder', auth, ReminderMasterController.RemoveReminderMaster);

router.get('/fetch_reminder_read', auth, ReminderMasterController.fetchReminderRead);
router.post('/add_reminder_read', auth, ReminderMasterController.addReminderRead);

router.post('/send_what_app_msg', WhatsAppMsgController.addWhatsAppMsg);
router.get('/whatsapp_message_report', WhatsAppMsgController.whatsappReport123);
//#endregion
//#region OTHER APIs
router.get('/fetch_template_master', auth, TemplateMasterController.FetchTemplateMasterDetails);
router.post('/template_master', auth, TemplateMasterController.ManageTemplateMaster);
router.delete('/delete_template_master', auth, TemplateMasterController.RemoveTemplateMaster);

router.get('/fetch_feedback_master', auth, FeedbackMasterController.FetchFeedbackMasterDetails);
router.post('/feedback_master', auth, FeedbackMasterController.FeedbackMaster);
router.delete('/delete_feedback', auth, FeedbackMasterController.RemoveFeedbackMaster);

router.get('/generate_qr_code', QRCodeMasterController.generateQRCode);
router.get('/generate_qr_code_image', QRCodeMasterController.generateQRCodeImageView);

router.get('/razorpay/credentials', RazorpayController.fetchRazorpayCredentials);
router.put('/razorpay/credentials', auth, RazorpayController.updateRazorpayCredentials);
//#endregion

//#region DOCUMENT UPLOAD MASTER
router.get('/list_document', auth, DocumentUploadController.FetchDocumentUploadDetails);
router.post('/document_upload_master', auth, DocumentUploadUpload, DocumentUploadController.DocumentUpload);
router.post('/document_upload_master_V2', auth, DocumentUploadUploadV2, DocumentUploadController.DocumentUpload);
router.put('/document_status_update', auth, DocumentUploadController.updateIsActiveStatusOfDocument);
router.delete('/delete_document', auth, DocumentUploadController.RemoveDocumnet);
router.delete('/delete_document_V2', auth, DocumentUploadController.RemoveDocumnetV2);
//#endregion

//#region NEW BOOKING TICKET APIs
router.get('/fetch_ticket_category', auth, TicketCategoryController.FetchTicketCategory);
router.post('/ticket_category_master', auth, TicketCategoryController.TicketCategoryMaster);
router.delete('/delete_ticket_category', auth, TicketCategoryController.RemoveTicketCategory);

router.get('/fetch_booking_master', auth, BookingController.fetchBookings);
router.get('/fetch_booking_master_by_id', auth, BookingController.fetchBookingInfoById);
router.post('/booking_master', auth, BookingController.BookingMaster);
router.delete('/delete_bookings', auth, BookingController.RemoveBookings);

router.get('/fetch_coupons', auth, CouponMasterController.FetchCoupons);
router.post('/coupon_master', auth, CouponMasterController.CouponMaster);
router.delete('/delete_coupon', auth, CouponMasterController.RemoveCoupon);

router.get('/verify_ticket', auth, BookingController.VerifyTicket);
router.post('/multiple_ticket_verify', auth, BookingController.verifyTicketOnBookingDetailsUKkeyId);
//#endregion

//#region CONTECT apiS
router.get('/fetch_contect', auth, ContectMasterController.fetchContects);
router.post('/contect_master', auth, ContectUpload, ContectMasterController.ContectMaster);
router.delete('/delete_contect', auth, ContectMasterController.RemoveContect);

router.get('/fetch_event_contect_setting', auth, EventContectSettingController.fetchEventContectSetting);
router.post('/event_contect_setting_master', auth, EventContectSettingController.EventContectSetting);
router.delete('/delete_event_contect_setting', auth, EventContectSettingController.RemoveEventContectSetting);
//#endregion

//#region ROLE RIGHTS
router.get('/fetch_role_rights', auth, RoleRightsControler.fetchRoleRights);
router.get('/fetch_main_menu', auth, RoleRightsControler.fetchMainMenu);
router.get('/fetch_sub_menu', auth, RoleRightsControler.fetcSubMenu);
router.post('/add_role_rights', auth, RoleRightsControler.addRoleRighys);
//#endregion

//#region MOBILE SMS MASTER
router.get("/fetch_mob_sms_master", auth, MobileSMSMasterController.FetchMobSMSMastDetails);
router.post("/mob_sms_master", auth, MobileSMSMasterController.ManageMobSMSMast);
router.delete('/delete_mob_sms_master', auth, MobileSMSMasterController.RemoveMobSMSMast);
//#endregion

//#region  DASBOARD and REPORTS apis
router.get('/super_admin_dashboard_list', auth, SuperAdminDashboardController.SuperAdminDashoardList);
router.get('/super_admin_user_chart_list', auth, SuperAdminDashboardController.SuperAdminDashboardChartView);
router.get('/admin_dashboard_count_list', auth, AdminDashboardController.AdminDashboardList);
router.get('/ticket_register_report', auth, AdminDashboardController.TicketRegisterReport);
router.get('/admin_dashboard_chart_list', auth, AdminDashboardController.AdminDashboadChartList);
router.get('/transaction_report',auth, AdminDashboardController.TransactionReport);
router.get('/ticket_verify_count',auth, AdminDashboardController.TicketVerifyReport);
router.get('/ticket_verify_report', auth, AdminDashboardController.TicketVerifyReportByTicketCategory);
router.get('/custome_report', auth, AdminDashboardController.CustomeReport);
router.get('/dashboard_volunteer_master', auth, AdminDashboardController.dashboardVolunteerCount);
//#endregion

//#region RAZORPAY apis 
// router.get('/payment', auth, PaymentController.getPaymentDetails);
router.post('/create_razorpay_order_id', auth, PaymentController.createRazorpayOrderId);
// router.get('/fetch_razorpay_order_details_by_id', auth, PaymentController.fetchOrderDetails);
// router.post('/payment/capture', PaymentController.capturePayment);
// router.get('/fetch_razorpay_payments', auth, PaymentController.getAllPayments);
// router.get('/payment_refund', auth, PaymentController.paymentRefund);

router.get('/fetch_payment_gateway', auth, PaymentGatewayMaster.FetchPaymentGatewayMasterDetails);
router.post('/payment_gateway_master', auth, PaymentGatewayMaster.PaymentGatewayMaster);
router.delete('/delete_payment_gateway', auth, PaymentGatewayMaster.RemovePaymentGateway);
//#endregion

//#region Terms and Condition master
router.get('/fetch_organizer_terms_condition', auth, OrgtermandconditionController.fetchOrgTermCond);
router.post('/organizer_terms_condition', auth, OrgtermandconditionController.OrgTermCond);
router.delete('/delete_organizer_terms_condition', auth, OrgtermandconditionController.RemoveOrgTermCond);
//#endregion

//#region Pricing Master
router.get('/fetch_pricing', PricingMasterController.FetchPricing);
router.post('/pricing_master', auth, PricingMasterController.PricingMaster);
router.delete('/delete_pricing', auth, PricingMasterController.RemovePricing);
//#endregion

//#region Whats New
router.get('/fetch_whats_new', whatsnewcontroller.Fetchwhatsnew);
router.post('/whats_new_master', auth, whatsnewcontroller.whatsnew);
router.delete('/delete_whats_new', auth, whatsnewcontroller.removewhatsnew);
//#endregion

//#region send email.
// router.get('/send_organizer_email', OrganizerEmail.sendOrganizerRegisterMail);
//#endregion

//#region Subscriber master
router.get('/fetch_subscriber', SubscriberMaster.fetchSubscriberlist);
router.post('/subscriber_master', auth, SubscriberMaster.SubscriberMaster);
//#endregion

//#region Rating master
router.get('/fetch_rating', RatingMasterController.fetchRatings);
router.get('/fetch_subscriber_rating_count', RatingMasterController.countOfRatingAndsubscriber);
router.post('/rating_master', RatingMasterController.RatingMaster);
//#endregion

//#region Disclaimer master
router.get('/fetch_disclaimer_master', DisclaimerMasterController.fetchDisclaimer);
router.post('/disclaimer_master', auth, DisclaimerMasterController.Disclaimer);
router.delete('/delete_disclaimer_master', auth, DisclaimerMasterController.RemoveDisclaimer);
//#endregion

//#region Email Logs
router.get('/fetch_email_logs', auth, EmailsLogsAPIController.fetchEmailLogs);
//#endregion

//#Background Notification
router.post('/send_notification_in_background', auth, firebaseSentNotification.sendNotificationInBackground);
//#endregion
module.exports = router;