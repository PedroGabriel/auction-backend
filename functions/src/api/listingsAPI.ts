import * as express from "express";
import * as listing from '../domain/listings'
import * as errorParser from '../helpers/errorHelper'
import * as reports from '../domain/reports'
import * as admin from 'firebase-admin'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let listings = express.Router();

listings.get("/:listingId", async (request, response) => {
    try {                
        response.send(await listing.get(request.params.listingId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/", async (request, response) => {
    try {                
        response.send(await listing.createObject(request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.put("/:id", async (request, response) => {
    try {                
        const id = await listing.updateObject(request.params.id, request.body)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.delete("/:id", async (request, response) => {
    try {                
        const id = await listing.deleteListing(request.params.id)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/state/:state", async (request, response) => {
    try {        
        response.send(await listing.listingsByState(request.params.state))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/", async (request, response) => {
    try {                   
        response.send(await listing.searchListings(request.query))
    } catch (error) {         
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/recommended", async (request, response) => {
    try {                   
        response.send(await listing.recommendedListings())
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.put("/:id/photos", async (request, response) => {
    try {                
        const id = await listing.uploadPhotos(request.params.id, request.body.folder, request.body.photos)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.delete("/:id/photos", async (request, response) => {
    try {                
        const id = await listing.deletePhotos(request.params.id, request.body.folder, request.body.photos)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.put("/:id/files", async (request, response) => {
    try {                
        const id = await listing.uploadFiles(request.params.id, request.body.documents)
        response.send(id)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.put("/:id/inspection", async (request, response) => {
    try {                
        const id = await listing.uploadInspection(request.params.id, request.body)
        response.send({result: id})
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.put("/:id/cover", async (request, response) => {
    try {                
        const id = await listing.uploadCover(request.params.id, request.body)
        response.send({result: id})
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/:listingId/comments", async (request, response) => {
    try {                
        response.send(await listing.comments(request.params.listingId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:listingId/comments", async (request, response) => {
    try {                        
        response.send(await listing.makeComment(request.params.listingId, request.body.comment, request.body.user))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/:listingId/comments/:commentId/like", async (request, response) => {
    try {                
        const userId = (await admin.auth().verifyIdToken(request.get("idToken"))).uid                        
        response.send(await listing.reactComment(request.params.listingId, request.params.commentId, userId) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/:listingId/comments/:commentId/unlike", async (request, response) => {
    try {     
        const userId = (await admin.auth().verifyIdToken(request.get("idToken"))).uid               
        response.send(await listing.reactComment(request.params.listingId, request.params.commentId, userId, false ))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:listingId/comments/:commentId/report", async (request, response) => {
    try {                                   
        response.send(await reports.reportComment(request.params.listingId, request.params.commentId, request.body.user, request.body.message) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.delete("/:listingId/comments/:commentId", async (request, response) => {
    try {                
        response.send(await listing.deleteComment(request.params.listingId, request.params.commentId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.get("/:listingId/comments/:commentId/like", async (request, response) => {
    try {                
        const userId = (await admin.auth().verifyIdToken(request.get("idToken"))).uid                        
        response.send(await listing.reactComment(request.params.listingId, request.params.commentId, userId) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

//should check whos logged in
listings.post("/:id/pre-approve", async (request, response) => {     
    try {                                            
        response.send(await listing.preApprove(request.params.id, request.body.comment))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:id/approve", async (request, response) => {     
    try {                                            
        response.send(await listing.approve(request.params.id, request.body.comment))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:id/go-live", async (request, response) => {     
    try {                                            
        response.send(await listing.goLive(request.params.id, request.body.comment))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:id/reject-pre-approval", async (request, response) => {     
    try {                                            
        response.send(await listing.rejectpreApproval(request.params.id, request.body.comment))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:id/reject-approval", async (request, response) => {     
    try {                                            
        response.send(await listing.rejectApproval(request.params.id, request.body.comment))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:id/close", async (request, response) => {     
    try {                                            
        response.send(await listing.close(request.params.id))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:listingId/follow", async (request, response) => {
    try {                                          
        response.send(await listing.followListing(request.params.listingId, request.body.user))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

listings.post("/:listingId/unfollow", async (request, response) => {
    try {                                    
        response.send(await listing.unfollowListing(request.params.listingId, request.body.user))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});