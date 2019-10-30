import * as express from "express";
import * as user from '../domain/users'
import * as payment from '../domain/stripe'
import * as listing from '../domain/listings'
import * as message from '../domain/messages'
import * as ratings from '../domain/ratings'
import * as notification from '../domain/notifications'
import * as bids from '../domain/bids'
import * as errorParser from '../helpers/errorHelper'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as email from '../helpers/emailSender'


// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let users = express.Router();

users.get("/:userId", async (request, response) => {
    try {                
        response.send(await user.userInfo(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/payments/info", async (request, response) => {
    try {                
        response.send(await payment.getStripeUserData(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/", async (request, response) => {
    try {                
        response.send(await user.users())
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.put("/:id/profilepicture", async (request, response) => {
    try {       
        await user.checkUserPermission(request.get("idToken"), request.params.id)         
        const id = await user.uploadProfilePicture(request.params.id, request.body)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.put("/:userId", async (request, response) => {
    try {                
        await user.checkUserPermission(request.get("idToken"), request.params.userId)
        const id = await user.updateUser(request.params.userId, request.body)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.put("/changestatus/:userId", async (request, response) => {
    try {                
        await user.checkUserPermission(request.get("idToken"), request.params.userId)
        console.log("passed")
        const data = {disabled: request.body.disabled}
        console.log(await admin.auth().updateUser(request.params.userId, data ))
        const id = await user.updateUser(request.params.userId, data)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.post("/", async (request, response) => {
    try {
        response.send(await user.createUser(request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/listings/", async (request, response) => {
    try {                
        response.send(await listing.listingsByUser(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/comments/", async (request, response) => {
    try {                
        response.send(await user.comments(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/notifications/", async (request, response) => {
    try {                
        response.send(await notification.notifications(request.params.userId, request.query.pageId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/ratings/", async (request, response) => {
    try {                
        response.send(await ratings.ratings(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/bids/", async (request, response) => {
    try {                
        response.send(await bids.listByUser(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.get("/:userId/following/", async (request, response) => {
    try {                
        response.send(await listing.getFollowing(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.put("/:userId/notifications/", async (request, response) => {
    try {                
        response.send(await user.updateNotificationsSettings(request.params.userId, request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

users.post("/:userId/messages/", async (request, response) => {
    let messageId: string
    try {
        const from = await user.getUserFromToken(request.get("idToken"))  
        // const from =  await user.userInfo(request.get("idToken"))        
        const to = await user.userInfo(request.params.userId)        
        const messageResult = await message.createObject(from, to, request.body.message)  
        messageId = messageResult.id
        response.send(await email.sendMessageEmail(from, to.email, request.body.message))
    } catch (error) { 
        console.error(error)
        if (messageId) {
            await message.updateObject(messageId, {error: errorParser.errorToJson(error)})
        }
        response.status(500).send(errorParser.errorToJson(error))
    }
});

export async function triggerCommentCreated(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> {               
    const listingData = await listing.get(context.params.listingId)                
    const comment = snapshot.data()
    comment.listing = {id: listingData.id, model: listingData.model, year: listingData.year}        
    await user.saveComment(comment.user.id, snapshot.id, comment)  
    comment.id = snapshot.id
    notification.checkMentionsAndNotify(comment)
}

export async function triggerCommentDeleted(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> {               
    const comment = snapshot.data()
    await user.deleteComment(comment.user.id, snapshot.id)    
    await notification.deleteTagNotification(context.params.commentId)
}

export async function triggerUserCreated(userCreated: admin.auth.UserRecord, context: functions.EventContext): Promise<any> {  
    try {
        const userData: any = {}
        userData.name = userCreated.displayName
        userData.email = userCreated.email
        userData.image = userCreated.photoURL        
        await user.updateUser(userCreated.uid, userData)

        const notificationData = await user.registerNotificationsSettings(userCreated.displayName, userCreated.email)
        await user.updateUser(userCreated.uid, notificationData) 
    } catch (error) {
        console.log(error)
        return error
    }
}