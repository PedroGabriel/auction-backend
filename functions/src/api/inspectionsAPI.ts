import * as express from "express";
import * as inspection from '../domain/inspections'
import * as errorParser from '../helpers/errorHelper'
import * as users from '../domain/users'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let inspections = express.Router();

inspections.post("/", async (request, response) => {
    try {                
        // const user =  await users.userInfo("AfK7tYYfZrZMEqIFxxxCLgM5PGC3") 
        const user = await users.getUserFromToken(request.get("idToken"))          
        response.send(await inspection.requestInspection(request.body.listingId, user.id) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

inspections.post("/approveorreject", async (request, response) => {
    try {                                
        // await users.checkUserPermission(request.get("idToken"), "")
        response.send(await inspection.approveOrRejectDocument(request.body.listingId, request.body.approve) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

inspections.get("/listing/:listingId/user/:userId", async (request, response) => {
    try {                        
        const aInspection = await inspection.getInspection(request.params.listingId, request.params.userId)                
        const result = aInspection.id ? true : false
        response.send(await {result: result})
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});