import * as express from "express";
import * as notification from '../domain/notifications'
import * as errorParser from '../helpers/errorHelper'
import * as emailSender from '../helpers/emailSender'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let notifications = express.Router();

notifications.get("/:notificationId", async (request, response) => {
    try {                
        response.send(await notification.get(request.params.notificationId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

notifications.post("/", async (request, response) => {
    try {                
        response.send(await notification.createObject(request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

notifications.post("/email", async (request, response) => {
    try {                
        // response.send(await emailSender.sendNewBidEmail("modelo", 100, 10000))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});
