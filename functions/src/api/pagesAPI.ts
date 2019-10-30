import * as express from "express";
import * as pages from '../domain/pages'
import * as errorParser from '../helpers/errorHelper'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let router = express.Router();

router.get("/:id", async (request, response) => {
    try {                
        response.send(await pages.get(request.params.id))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.put("/:id", async (request, response) => {
    try {                
        response.send(await pages.updateObject(request.params.id, request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

