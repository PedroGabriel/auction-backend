import * as index from '../index'
import * as admin from 'firebase-admin'
import * as listings from '../domain/listings';
import * as errorHelper from '../helpers/errorHelper';
import * as stripe from '../domain/stripe';
import * as async from '../helpers/async';

const listingCollection = "listings"
const inspectionCollection = "inspections"

const inspectionAmount = 299

export async function getInspection(listingId: string, userId: string) {    
    const ref = index.firestore.collection(listingCollection).doc(listingId).collection(inspectionCollection).doc(userId)
    const inspection = await ref.get()    
    if (inspection.data()) { 
        const result = inspection.data()
        result.id = inspection.id 
        return result
    } else {
        return {}
    }
}

export async function inspectionsByListing(listingId: string) {     
    const ref = index.firestore.collection(listingCollection).doc(listingId).collection(inspectionCollection)
    const snapshot = await ref.get()
    const result = []
    snapshot.docs.forEach(data => {   
        const jsonData = data.data()
        jsonData.id = data.id
        result.push(jsonData)
    });            
    return result
}

export async function approveOrRejectDocument(listingId: string, approved: boolean) {    
    if (approved) {
        await listings.updateObject(listingId, {verified: true} )
        return await checkAndChargeHolds(listingId)
        //maybe send email
    } else {
        //just let them know that was denied?
        return true
    }
 }

export async function requestInspection(listingId: string, userId: string) {    
   const listing = await listings.get(listingId)
   let data: any = {amount: inspectionAmount}
   const inspection = await getInspection(listingId, userId)
   if (inspection.id) {
       throw errorHelper.createError("inspection_request", "inspection already requested.")
   }
   if (listing.user.id === userId) {
        data = await requestInspectionForOwner(listing, userId, data)
   } else {
        data = await requestInspectionForBuyer(listing, userId, data)
   }   
   await listings.updateObject(listingId, {inspectionRequested: true} )
   return await createObject(listingId, userId, data)
}

export async function requestInspectionForOwner(listing: any, userId: string, data: any) {       
    if (listing.reservePrice >= 100000) {
        data.amount = 0
        data.charged = true
    } else {        
        data.chargeId = (await stripe.createHoldToUser(userId, inspectionAmount, 
            "Inspection requested for " + listing.brand + " " + listing.model + " " + listing.year)).id
        data.charged = false
    }
    return data
}

export async function requestInspectionForBuyer(listing: any, userId: string, data: any) {           
    data.chargeId = (await stripe.createHoldToUser(userId, inspectionAmount, 
        "Inspection requested for " + listing.brand + " " + listing.model + " " + listing.year)).id
    data.charged = false
    return data
}

export async function createObject(listingId: string, userId: string, data: any) {    
    const ref = index.firestore.collection(listingCollection).doc(listingId).collection(inspectionCollection).doc(userId);                       
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()        
    const result = await ref.set(data, {merge: true})  
    return {id: userId}
}

export async function updateObject(listingId: string, inspectionId: string, data: any) {    
    const ref = index.firestore.collection(listingCollection).doc(listingId).collection(inspectionCollection).doc(inspectionId);                       
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()        
    const result = await ref.set(data, {merge: true})  
    return true
}

export async function checkAndChargeHolds(listingId: string) {    
    const inspections = await inspectionsByListing(listingId)
    const result = []
    const errors = []
    await async.forEach(inspections, async(inspection) => {        
        try {
            if (inspection.charged === false) {                
                await stripe.chargeHoldToUser(inspection.chargeId)                
                await updateObject(listingId, inspection.id, {charged: true})
                result.push( inspection.id )        
            }            
        } catch(error) {            
            console.error(error)
            errors.push(error.message)            
            await updateObject(listingId, inspection.id, {error: error.message})                
        }               
    })
    return {result: result, errors: errors}
}