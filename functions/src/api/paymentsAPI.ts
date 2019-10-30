import * as express from "express";
import * as payments from '../domain/stripe'
import * as errorParser from '../helpers/errorHelper'
import * as users from '../domain/users'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let router = express.Router();

router.post("/", async (request, response) => {
    try {                
        response.send(await payments.updateDefaultPaymentMethod(request.body.userId, request.body.email, request.body.sourceId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.delete("/", async (request, response) => {
    try {        
        const user = await users.getUserFromToken(request.get("idToken"))          
        response.send(await payments.deletePaymentMethod(user.id))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/source", async (request, response) => {
    try {                
        response.send(await payments.sourceCreate(request.body.userid, request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/createHold", async (request, response) => {
    try {                
        response.send(await payments.createHoldToUser(request.body.userId, request.body.amount, request.body.description))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/chargeHold", async (request, response) => {
    try {                
        response.send(await payments.chargeHoldToUser(request.body.holdId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/releaseHold", async (request, response) => {
    try {                
        response.send(await payments.releaseHold(request.body.holdId))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});


