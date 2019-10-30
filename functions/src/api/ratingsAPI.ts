import * as express from "express";
import * as ratings from '../domain/ratings'
import * as errorParser from '../helpers/errorHelper'
import * as functions from 'firebase-functions'
import * as users from '../domain/users'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let router = express.Router();

router.get("/:userId", async (request, response) => {
    try {                
        response.send(await ratings.ratings(request.params.userId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/", async (request, response) => {
    try {                
        response.send(await ratings.createObject(request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.delete("/:id", async (request, response) => {
    try {                
        response.send(await ratings.deleteObject(request.params.id))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

export async function triggerRatingCreated(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> {                   
    const rating = snapshot.data()   
    await ratings.calculateRating(rating.to.id, rating.stars)    
}

export async function triggerRatingDeleted(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> {               
    const rating = snapshot.data()  
    await ratings.calculateRating(rating.to.id, rating.stars, false)    
}
