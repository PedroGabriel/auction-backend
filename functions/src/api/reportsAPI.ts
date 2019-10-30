import * as express from "express";
import * as errorParser from '../helpers/errorHelper'
import * as reports from '../domain/reports'

export let router = express.Router();

router.get("/", async (request, response) => {
    try {                                   
        response.send(await reports.reportedCommments(request.query.pageId) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

router.post("/:reportId", async (request, response) => {
    try {                                   
        response.send(await reports.reviseReport(request.params.reportId, request.body.deleteComment) )
    } catch (error) { 
        console.error(error)
        response.status(500).send(errorParser.errorToJson(error))
    }
});

