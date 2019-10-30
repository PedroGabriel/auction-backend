import * as express from "express";
import * as cars from '../domain/cars'
import * as errorParser from '../helpers/errorHelper'
import * as async from '../helpers/async'

// This is the router which will be imported in our
// api hub (the index.ts which will be sent to Firebase Functions).
export let router = express.Router();

router.get("/", async (request, response) => {
    try {                
        response.send(await cars.get())
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/:brand", async (request, response) => {
    try {                
        response.send(await cars.addBrand(request.params.brand))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/:brand/:model", async (request, response) => {
    try {                        
        response.send(await cars.addModel(request.params.brand, request.params.model))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.delete("/:brand/:model", async (request, response) => {
    try {                        
        response.send(await cars.removeModel(request.params.brand, request.params.model))
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.put("/import/", async (request, response) => {
    try {      
        const result = []        
        await async.forEach(request.body , async(brand) => {
            console.log(brand)
            await cars.addBrand(brand.brand)
            await cars.addModels(brand.brand, brand.models)            
        })                
        response.send(result)
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

