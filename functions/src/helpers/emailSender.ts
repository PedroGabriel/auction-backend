// using SendGrid's Node.js Library - https://github.com/sendgrid/sendgrid-nodejs
import * as sendgrid from '@sendgrid/mail'
import * as sendgridClient from '@sendgrid/client'
import * as errorHelper from '../helpers/errorHelper'
import * as httpRequest from "request"
import * as pages from "../domain/pages"
import * as cloudSettings from "../helpers/cloudSettings"

const key = "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"
const sgEmail = sendgrid
sgEmail.setApiKey(key)
const sgClient = sendgridClient
sgClient.setApiKey(key)

const OK_STATUS = 201
const SENDER_ID = 384777
export const LISTING_LIST_ID = 6286067333
const LISTING_SUPRESSION_GROUP_ID = 8765
const MENTIONS_LIST_ID = 0

export const defaultTo = "Pink Slip Daddys <pinkslipdaddys@gmail.com>"
export const defaultFrom = "Pink Slip Daddys <pinkslipdaddys@gmail.com>"

export async function sendMentionEmail(from: any, to: any, comment: any, listing: any) {
    let html:string = (await pages.get("mention-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)
    html = html.replace("{{link}}", cloudSettings.siteURL() + "bid-detail/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Pink Slip Daddy's Messages", html)
}

export async function sendOutbiddedEmail(to: string, listing: any) {
    let html:string = (await pages.get("outbidded-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)
    html = html.replace("{{link}}", cloudSettings.siteURL() + "bid-detail/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Pink Slip Daddy's Messages", html)
}

export async function sendEndingListingEmail(to: string, listing: any, minutes: number) {
    let html:string = (await pages.get("ending-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)
    html = html.replace("{{minutes}}", minutes.toString())
    html = html.replace("{{link}}", cloudSettings.siteURL() + "bid-detail/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Pink Slip Daddy's Messages", html)    
}

export async function sendEndListingEmail(to: string, listing: any) {
    let html:string = (await pages.get("ended-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)    
    html = html.replace("{{link}}", cloudSettings.siteURL() + "bid-detail/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Pink Slip Daddy's Messages", html)    
}


export async function sendNewBidEmail(to: string, listing: any) {
    let html:string = (await pages.get("bid-placed-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)
    html = html.replace("{{link}}", cloudSettings.siteURL() + "bid-detail/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Pink Slip Daddy's Messages", html)
}

export async function sendWriteReview(to: string, listing: any) {
    let html:string = (await pages.get("write-review-template")).html    
    html = html.replace("{{year}}", listing.year)
    html = html.replace("{{model}}", listing.model)
    html = html.replace("{{brand}}", listing.brand)
    html = html.replace("{{link}}", cloudSettings.siteURL() + "review/" + listing.id)
    return sendHtmlEmail(to, defaultFrom, "Write a review", html)
}

export async function sendMessageEmail(from: any, to: string, message: string) {
    const templateData = {        
        firstName: from.name,
        message: message         
    }

    return sendEmail(to, from.email, "New message from " + from.name, message, "d-e04d5bc216ab49d98dd7119391d3746c", templateData)
}

export async function sendHtmlEmail(to: string, from: string, subject: string, html: string) {  
    const msg:any = {
        to: to,
        from: from,
        subject: subject,        
        html: html
    };             
    try {
        return await sgEmail.send(msg);                              
    } catch(error) {
        console.error("failed to send email campaign")          
        if (error.response) {
            console.error(error.response.body)        
        }        
        throw error
    }
}

export async function sendEmail(to: string, from: string, subject: string, text: string, templateId: string = "", templateData: any = undefined) {  
    const msg:any = {
        to: to,
        from: from,
        subject: subject,
        text: text
    };            
    if (templateId) {
        msg.templateId = templateId
        msg.dynamic_template_data = templateData
    }
    try {
        return await sgEmail.send(msg);                              
    } catch(error) {
        console.error("failed to send email campaign")          
        if (error.response) {
            console.error(error.response.body)        
        }        
        throw error
    }
}

export async function clientRequest(request: any) {
    try {
        const result = await sgClient.request(request)
        return result[1]
    } catch( error) {
        if (error.response) {
            console.error(error.response.body )
            throw errorHelper.createError("email_error", JSON.stringify(error.response.body))            
        }        
        throw error
    }
}

export async function createAndSendCampaign(title: string, subject: string, listID: number, supressiongGroupId: number, text: string, category: string ) {  
    const data = {
        "title": title,
        "subject": subject,
        "sender_id": SENDER_ID,        
        "list_ids": [ listID ],
        "categories": [ category ],
        "suppression_group_id": supressiongGroupId,
        "html_content": text
    }

    const createRequest = {
        method: 'POST',
        url: '/v3/campaigns',
        body: data
    };          
    try {
        const createResult = await sgClient.request(createRequest);                    
        return sendCampaign(createResult[1].id)                
    } catch(error) {
        console.error("failed to create campaign")          
        if (error.response) {
            console.error(error.response.body)        
        }        
        throw error
    }
}

export async function sendCampaign(campaignId) {
    const request = {
        method: 'POST',
        url: '/v3/campaigns/' + campaignId + "/schedules/now",
    };
    return await sgClient.request(request)
}  

export async function addRecipient(email: string, name: string) {
    const data = [{          
          email : email,
          first_name: name }];
    
    const options = { 
        method: 'POST',
        url: 'https://api.sendgrid.com/v3/contactdb/recipients',
        headers: { 'content-type': 'application/json',
            authorization: 'Bearer ' + key},
        body: data,
        json: true };

    return new Promise((resolve, reject) => { 
        httpRequest(options,  function (error, response, body) {
            if (error) {  
                console.error(error)
                throw new Error(error) 
            } 
                      
            if (body.persisted_recipients.length > 0) {
                resolve(body.persisted_recipients[0])          
            } else {
                console.error(body)
                throw errorHelper.createError("email_error", JSON.stringify(body.errors))
            }
        })
    })
}

export async function updateList(add: boolean, listId: number, recipientId: string) {
    try {
        if (add) {
            return await addToList(listId, recipientId)
        } else { 
            return await removeFromList(listId, recipientId)
        }
    }  catch(error) {
        if (error.response) {
            if (error.response.body) {      
                console.error(error.response.body)
                throw errorHelper.createError("email_error", JSON.stringify(error.response.body))
            }   
        }
        throw error
    }
}

export async function addToList(listId: number, recipientId: string) {
    const request = {
        method: 'POST',
        url: '/v3/contactdb/lists/'+ listId + '/recipients/' + recipientId,
    };
    return await sgClient.request(request)
}  

export async function removeFromList(listId: number, recipientId: string) {
    const request = {
        method: 'DELETE',
        url: '/v3/contactdb/lists/'+ listId + '/recipients/' + recipientId,
    };
    return await sgClient.request(request)
}  

//create list
export async function createList(listName: string) {
    const data = {name: listName}
    const request = {
        method: 'POST',
        url: '/v3/contactdb/lists',
        body: data
    };
    return await clientRequest(request)
}  

//when follow, add contacts
//send email to who followed