import * as express from "express";
import * as bid from '../domain/bids'
import * as errorParser from '../helpers/errorHelper'
import * as functions from 'firebase-functions'
import * as notification from '../domain/notifications'
import * as listing from '../domain/listings'
import * as async from '../helpers/async'
import * as users from '../domain/users'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let bids = express.Router();

bids.get("/detail/:bidId", async (request, response) => {
    try {                
        response.send(await bid.get(request.params.bidId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

bids.get("/:listingId", async (request, response) => {
    try {                
        response.send(await bid.listByListing(request.params.listingId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

bids.post("/", async (request, response) => {
    try {                
        response.send(await bid.makebid(request.body.amount, request.body.basePrice, request.body.listingId, request.body.user))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))       
    }
});

bids.post("/checkAndCloseListings", async (request, response) => {     
    try {             
        const openListings = await listing.listingsByState(listing.state.live)    
        let closed = 0        
        let errors = 0      
        const errorsMessage = []    
        await async.forEach(openListings, async(aListing) => {
            try {
                if (await listing.checkAndClose(aListing)) {
                    closed++
                    console.log(aListing.id + " closed by job")
                }
            } catch (error) {
                errors++
                errorsMessage.push("Listing " + aListing.id + " Error: "  + error.message)
                console.error(aListing.id + " caused error while being closed by job")
                console.error(error)
            }           
        })
        let result = "live listings: " + openListings.length + ", closed: " + closed + ",errors: " + errors
        result = result + "\n" + errorsMessage
        response.send(result)
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))
    }
});

bids.get("/checkhold/:listingId", async (request, response) => {
    try {               
        const user = await users.getUserFromToken(request.get("idToken"))          
        response.send(await bid.checkHold(request.params.listingId, user.id))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))       
    }
});

bids.post("/hold/:listingId", async (request, response) => {
    try {                                 
        const user = await users.getUserFromToken(request.get("idToken"))        
        response.send(await bid.createHold(request.body.amount + request.body.basePrice, request.params.listingId, user))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))       
    }
});

// bids.post("/releaseholds/:listingId", async (request, response) => {
//     try {                              
//         response.send(await bid.releaseHolds( request.params.listingId))
//     } catch (error) { 
//         console.error(error)        
//         response.status(500).send(errorParser.errorToJson(error))       
//     }
// });

bids.post("/chargewinner/:listingId", async (request, response) => {
    try {           
        const list = await listing.get(request.params.listingId)
        response.send(await bid.chargeHoldForWinner( request.params.listingId, list.lastBidder.id))
    } catch (error) { 
        console.error(error)        
        response.status(500).send(errorParser.errorToJson(error))       
    }
});

export async function bidCreated(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> { 
    const bidData = snapshot.data()   
    await notification.createNewBidNotification(bidData.listing, bidData.amount, bidData.finalPrice)   
    const listingData = await listing.get(bidData.listing.id)
    if (listingData.outbiddedUser) {
        await notification.createUserOutbiddedNotification(listingData.outbiddedUser, bidData.listing, bidData.finalPrice)
    } 
}