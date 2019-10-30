import * as express from "express";
import * as faq from '../domain/faqs'
import * as errorParser from '../helpers/errorHelper'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let router = express.Router();

router.get("/:id", async (request, response) => {
    try {                
        response.send(await faq.get(request.params.id))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.get("/", async (request, response) => {
    try {                
        response.send(await faq.list())
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/", async (request, response) => {
    try {                
        response.send(await faq.createObject(request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.put("/:id", async (request, response) => {
    try {                
        response.send(await faq.updateObject(request.params.id, request.body))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});


router.delete("/:id", async (request, response) => {
    try {                
        response.send(await faq.deleteObject(request.params.id))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});


