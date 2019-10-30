import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as usersAPI from './api/usersAPI'
import * as inspectionsAPI from './api/inspectionsAPI'
import * as listingsAPI from './api/listingsAPI'
import * as bidsAPI from './api/bidsAPI'
import * as chargesAPI from './api/paymentsAPI'
import * as notificationsAPI from './api/notificationsAPI'
import * as middleware from './helpers/middleware'
import * as faqsAPI from './api/faqsAPI'
import * as pagesAPI from './api/pagesAPI'
import * as notifications from './domain/notifications'
import * as carsAPI from './api/carsAPI'
import * as ratingsAPI from './api/ratingsAPI'
import * as reportsAPI from './api/reportsAPI'
import * as thumbGenerator from './helpers/thumbGenerator'

admin.initializeApp()
export const firestore = admin.firestore()
firestore.settings({timestampsInSnapshots: true})

const appUsers = express()
middleware.applyMiddlewares(appUsers)
appUsers.use("/", usersAPI.users)

const appInspections = express()
middleware.applyMiddlewares(appInspections)
appInspections.use("/", inspectionsAPI.inspections)

const appListings = express()
middleware.applyMiddlewares(appListings, true)
appListings.use("/", listingsAPI.listings)

const appBids = express()
middleware.applyMiddlewares(appBids)
appBids.use("/", bidsAPI.bids)

const appPayments = express()
middleware.applyMiddlewares(appPayments)
appPayments.use("/", chargesAPI.router)

const appNotifications = express()
middleware.applyMiddlewares(appNotifications)
appNotifications.use("/", notificationsAPI.notifications)

const appFaqs = express()
middleware.applyMiddlewares(appFaqs)
appFaqs.use("/", faqsAPI.router)

const appPages = express()
middleware.applyMiddlewares(appPages)
appPages.use("/", pagesAPI.router)

const appCars = express()
middleware.applyMiddlewares(appCars)
appCars.use("/", carsAPI.router)

const appRatings = express()
middleware.applyMiddlewares(appRatings)
appRatings.use("/", ratingsAPI.router)

const appReports = express()
middleware.applyMiddlewares(appReports)
appReports.use("/", reportsAPI.router)

exports.users = functions.https.onRequest(appUsers)
exports.inspections = functions.https.onRequest(appInspections)
exports.listings = functions.https.onRequest(appListings)
exports.bids = functions.https.onRequest(appBids)
exports.payments = functions.https.onRequest(appPayments)
exports.faqs = functions.https.onRequest(appFaqs)
exports.notifications = functions.https.onRequest(appNotifications)
exports.pages = functions.https.onRequest(appPages)
exports.cars = functions.https.onRequest(appCars)
exports.ratings = functions.https.onRequest(appRatings)
exports.reports = functions.https.onRequest(appReports)

//listeners
exports.eventCommentCreated = functions.firestore.document('listings/{listingId}/comments/{commentId}').onCreate(usersAPI.triggerCommentCreated);
exports.eventCommentDeleted = functions.firestore.document('listings/{listingId}/comments/{commentId}').onDelete(usersAPI.triggerCommentDeleted);
exports.eventUserCreated = functions.auth.user().onCreate( usersAPI.triggerUserCreated);
exports.eventbidCreated = functions.firestore.document('bids/{bidId}').onCreate(bidsAPI.bidCreated);
exports.eventNotificationCreated = functions.firestore.document('notifications/{notificationId}').onCreate(notifications.notificationCreated);
exports.eventRatingCreated = functions.firestore.document('ratings/{ratingId}').onCreate(ratingsAPI.triggerRatingCreated);
exports.eventRatingDeleted = functions.firestore.document('ratings/{ratingId}').onDelete(ratingsAPI.triggerRatingDeleted);

exports.eventImageUploaded = functions.storage.object().onFinalize(thumbGenerator.fileUploaded)