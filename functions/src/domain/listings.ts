import * as index from '../index'
import * as admin from 'firebase-admin'
import * as uploader from '../helpers/uploadDocument'
import * as async from '../helpers/async';
import * as inspections  from '../domain/inspections';
import * as error from '../helpers/errorHelper'
import * as locationStore from '../domain/locationStore';
import * as firestoreHelper from '../helpers/firestoreHelper';
import * as bids  from '../domain/bids';
import * as email  from '../helpers/emailSender';
import * as users  from '../domain/users';
import * as notifications  from '../domain/notifications';

const collection = "listings"
const commentCollection = "comments"
const followingCollection = "followers"
const reportCollection = "reports"

export enum state {
    pending = "pending",
    pre_approved = "pre-approved",
    approved = "approved",
    live = "live",
    closed = "closed",
    pre_approval_rejected = "pre-approval rejected",
    approval_rejected = "approval rejected"
}

function checkState(currentState: string, allowedStates: string[]): boolean {
    return allowedStates.indexOf(currentState) >- 1
}

export async function get(id: string) {    
    const ref = index.firestore.collection(collection).doc(id)
    const listing = await ref.get()    
    if (listing.data()) {
        const result = listing.data()
        result.id = listing.id
        return result
    } else {
        return {}
    }
}

export async function listingsByState(listingState: string) {      
    const ref = index.firestore.collection(collection)   
    const result = []       
    if (listingState === "requires admin") {
        let snapshot = await ref.where("state", "==", state.pending).get()
        firestoreHelper.addToList(result, snapshot)        
        snapshot = await ref.where("state", "==", state.pre_approved).get()
        firestoreHelper.addToList(result, snapshot)                     
        snapshot = await ref.where("state", "==", state.approved).get()
        firestoreHelper.addToList(result, snapshot)        
    } else {
        const snapshot = await ref.where("state", "==", listingState).get()
        snapshot.docs.forEach(listing => { 
            const data = listing.data() 
            data.id = listing.id      
            result.push(data)
        });         
    }
      
    return result
}


export function filterListings(searchCriterias: any, listings: any[]) {
    let result = listings
    if (searchCriterias.state === "all") {        
        // listings = ref.where("public", "==", true)        
    } else if (searchCriterias.status === state.closed) {
        result = result.filter(listing => listing.state === state.closed );
    } else {        
        result = result.filter(listing => listing.state === state.live );
    }
    if (searchCriterias.brand) {
        result = result.filter(listing => listing.brand === searchCriterias.brand );        
    }
    if (searchCriterias.model) {
        result = result.filter(listing => listing.model === searchCriterias.model );        
    }
    if (searchCriterias.year) {
        result = result.filter(listing => listing.year === parseFloat(searchCriterias.year) );        
    }
    if (searchCriterias.minPrice || searchCriterias.maxPrice ) {
        if (searchCriterias.minPrice) {
            result = result.filter(listing => listing.price >= searchCriterias.minPrice );                    
        }
        if (searchCriterias.maxPrice) {
            result = result.filter(listing => listing.price <= searchCriterias.maxPrice );                    
        }
    }
    return result
}

export async function searchListings(searchCriterias: any) {      
    const ref = index.firestore.collection(collection)
    let collectionQuery : FirebaseFirestore.Query
    
    if (searchCriterias.status === "all") {
        collectionQuery = ref.where("public", "==", true)        
    } else if (searchCriterias.status === state.closed) {
        collectionQuery = ref.where("live", "==", false)
        collectionQuery = collectionQuery.where("closed", "==", true)
    } else {
        collectionQuery = ref.where("live", "==", true)
        collectionQuery = collectionQuery.where("closed", "==", false)
    }

    if (searchCriterias.model) {
        collectionQuery = collectionQuery.where("model", "==", searchCriterias.model)
    }
    if (searchCriterias.brand) {
        collectionQuery = collectionQuery.where("brand", "==", searchCriterias.brand)
    }
    if (searchCriterias.city) {
        collectionQuery = collectionQuery.where("address.city", "==", searchCriterias.city)
    }
    if (searchCriterias.zipcode) {
        collectionQuery = collectionQuery.where("address.zipcode", "==", searchCriterias.zipcode)
    }
    if (searchCriterias.year) {
        collectionQuery = collectionQuery.where("year", "==", parseFloat(searchCriterias.year))
    }
    if (searchCriterias.minPrice || searchCriterias.maxPrice ) {
        if (searchCriterias.minPrice) {
            collectionQuery = collectionQuery.where("price", ">=", parseFloat(searchCriterias.minPrice))
        }
        if (searchCriterias.maxPrice) {
            collectionQuery = collectionQuery.where("price", "<=", parseFloat(searchCriterias.maxPrice))
        }
        collectionQuery = collectionQuery.orderBy("price", "desc")
    } else {
        collectionQuery = collectionQuery.orderBy("auctionStart")
    }       
    
    if (searchCriterias.latitude) {
        const locationsKeys = await locationStore.searchLocations(parseFloat(searchCriterias.latitude), parseFloat(searchCriterias.longitude), parseFloat(searchCriterias.radius))        
        let result = await firestoreHelper.getKeys(locationsKeys, collection)        
        result = filterListings(searchCriterias, result)        
        return result           
    } else {
        const snapshot = await collectionQuery.limit(40).get()
        const result = []
        snapshot.docs.forEach(data => {   
            const jsonData = data.data()
            jsonData.id = data.id
            result.push(jsonData)
        });  
        return result         
    }
}

export async function recommendedListings() {      
    const ref = index.firestore.collection(collection)
    const query = ref.where("state", "==", state.live).orderBy("auctionStart")    
    const snapshot = await query.get()
    const result = []
    snapshot.docs.forEach(data => {   
        const jsonData = data.data()
        jsonData.id = data.id
        result.push(jsonData)
    });            
    return result
}

export async function listingsByUser(userId: string) {      
    const ref = index.firestore.collection(collection)
    const query = ref.where("user.id", "==", userId)    
    const snapshot = await query.get()
    const result = []
    snapshot.docs.forEach(data => {   
        const jsonData = data.data()
        jsonData.id = data.id
        result.push(jsonData)
    });            
    return result
}

export async function createObject(data: any) {    
    const ref = index.firestore.collection(collection);                       
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()        
    data.state = state.pending
    prepareListingData(data)    
    const result = await ref.add(data)       
    return {id: result.id}
}

export async function updateObject(id: string, data: any) {            
    const ref = index.firestore.collection(collection).doc(id);          
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    prepareListingData(data)
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function deleteListing(id: string) {    
    const listing = await get(id)           
    const allowedStates = [state.pre_approval_rejected, state.approval_rejected]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to delete listing with state: " + listing.state)
    }  
    return await deleteObject(id)
}

export async function deleteObject(id: string) {    
    const ref = index.firestore.collection(collection).doc(id);                           
    const result = await ref.delete() 
    return result
}

function prepareListingData(data: any) {
    if (data.address) {
        if (data.address.location) {
            data.address.location = new admin.firestore.GeoPoint(data.address.location._latitude, data.address.location._longitude)
        }            
    }
    return data
}

export function createSnippet(data: any, includeImage: Boolean = false) {
    const snippet: any = {}
    snippet.id = data.id
    snippet.model = data.model
    snippet.brand = data.brand
    snippet.year = data.year
    snippet.state = data.state    
    snippet.auctionStart = data.auctionStart
    if (includeImage === true && data.exterior)  {
        if (data.exterior.length > 0) {
            snippet.picture = data.exterior[0]
        }        
    }
    if (data.address) {
        if (data.address.location) {
            snippet.location = data.address.location
        }            
    }
    console.log(snippet)
    return snippet
}

export async function uploadPhotos(id: string, folder: string, photos: any) { 
    const result = []
    await async.forEach(photos, async(photo) => {
        result.push(await (uploader.saveFile(photo.filename, folder + "/" + id + "/", photo.content, photo.encoding, photo.contentType) ))
    })
        
    const data: any = {}
    data[folder] =  admin.firestore.FieldValue.arrayUnion(...result)    
    await updateObject(id, data)
    return result
}

export async function deletePhotos(id: string, folder: string, imageLinks: string[]) {    
    const data: any = {}
    data[folder] =  admin.firestore.FieldValue.arrayRemove(...imageLinks)    
    const result = await updateObject(id, data)
    return result
}

export async function uploadFiles(id: string, documents: any) { 
    const result = []
    await async.forEach(documents, async(aDocument) => {
        result.push(await (uploader.saveFile(aDocument.filename, "documents/"+id+"/", aDocument.content, aDocument.encoding, aDocument.contentType) ))
    })
        
    const data: any = {}
    data.documents =  admin.firestore.FieldValue.arrayUnion(...result)    
    await updateObject(id, data)
    return result
}

export async function uploadInspection(id: string, document: any) {     
    const result = await uploader.saveFile(id, "inspections/", document.content, document.encoding, document.contentType)
    const data: any = {}
    data.inspection =  result  
    await updateObject(id, data)
    return result
}

export async function uploadCover(id: string, photo: any) {     
    const result = await uploader.saveFile(id, "covers/", photo.content, photo.encoding, photo.contentType)
    const data: any = {}
    data.cover =  result  
    await updateObject(id, data)
    return result
}

export async function preApprove(id: string, comment: string) {        
    const listing = await get(id)
    const allowedStates = [state.pending, state.pre_approval_rejected]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to pre-aprove listing with state: " + listing.state)
    }
    const data = {state : state.pre_approved,                 
                  timestamp: admin.firestore.FieldValue.serverTimestamp()}   
    if (comment) { data["comment"] = comment } 
    await updateObject(id, data)   
    return data     
}

export async function approve(id: string, comment: string) { 
    const listing = await get(id)           
    const allowedStates = [state.pre_approved, state.approval_rejected, state.live]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to aprove listing with state: " + listing.state)
    }  
    await inspections.checkAndChargeHolds(id)
    const data = {state : state.approved,
                  approved: true, 
                  public: false,
                  live: false,
                  closed: false,                                   
                  timestamp: admin.firestore.FieldValue.serverTimestamp()}                   
    if (comment) { data["comment"] = comment }
    if (listing.state === state.live) {
        await undoBidsAndCleanListing(listing)
    }
    await updateObject(id, data)
    return data 
}

export async function rejectpreApproval(id: string, comment: string) {  
    const listing = await get(id)           
    const allowedStates = [state.pending]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to reject pre approval listing with state: " + listing.state)
    }      
    const data = {state : state.pre_approval_rejected,
                  timestamp: admin.firestore.FieldValue.serverTimestamp()} 
    if (comment) { data["comment"] = comment }       
    await updateObject(id, data)    
    return data 
}

export async function rejectApproval(id: string, comment: string) {  
    const listing = await get(id)           
    const allowedStates = [state.pre_approved]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to reject approval listing with state: " + listing.state)
    }        
    const data = {state : state.approval_rejected,
                  timestamp: admin.firestore.FieldValue.serverTimestamp()}  
    if (comment) { data["comment"] = comment }                    
    await updateObject(id, data)    
    return data 
}

export async function goLive(id: string, comment: string) {
    let listing = await get(id)             
    const allowedStates = [state.approved]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to go live listing with state: " + listing.state)
    }        
    const data: any = {state: state.live,    
                        price: 0,  
                        public: true,                  
                        live: true,
                        closed: false, 
                        timestamp: admin.firestore.FieldValue.serverTimestamp(), 
                        auctionStart: admin.firestore.FieldValue.serverTimestamp()}    
   
    if (comment) { data.comment = comment }
    await updateObject(id, data)    
    listing  = await get(id) 
    await locationStore.setLocation(id, createSnippet(listing))
    return data 
}

export async function close(id: string, listingData: any = undefined) {
    let listing: any
    if (listingData) { listing = listingData } else { listing = await get(id) }
    const allowedStates = [state.live]
    if (!checkState(listing.state, allowedStates)) {
        throw error.createError("invalid_state", "trying to close listing with state: " + listing.state)
    }        
    const data: any = {state : state.closed,
                        live: false, 
                        closed: true,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()}            
    await updateObject(id, data)   
    listing.state = state.closed
    await locationStore.setLocation(id, createSnippet(listing)) 
    if (await bids.chargeHoldForWinner(listing.id, listing.lastBidder.id)) {
        await bids.releaseHolds(listing.id)
        const user = await users.userInfo(listing.lastBidder.id)
        await email.sendWriteReview(user.email, listing)
    }    
    return data 
}

export async function checkAndClose(listing: any) {        
    if (listing.state === state.live)  {         
        await notifications.checkAndCreateBidEndingNotifications(listing)                  
        if (bids.timeout(listing)) {            
            await close(listing.id, listing)
            await notifications.createBidEndedNotification(listing)
            return true
        }         
    }     
    return false            
}

export async function comments(listingId: string) {      
    const snapshot = await index.firestore.collection(collection).doc(listingId).collection(commentCollection).orderBy("timestamp", "desc").get()
    const result = []
    snapshot.docs.forEach(listing => { 
        const data = listing.data()
        data.id = listing.id       
        result.push(data)
    });            
    return result
}

export async function makeComment(listingId: string, text: string, user: any) {    
    const ref = index.firestore.collection(collection).doc(listingId).collection(commentCollection);   
    const data: any = {}                    
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()       
    data.comment = text
    data.user = user
    const result = await ref.add(data)                      
    return {id: result.id}
}

export async function reactComment(listingId: string, commentId: string, userId: string, like: boolean = true) {    
    const ref = index.firestore.collection(collection).doc(listingId).collection(commentCollection).doc(commentId);   
    const data: any = {}   
    if (like) {
        data.likes = admin.firestore.FieldValue.arrayUnion(userId)       
    } else {
        data.likes = admin.firestore.FieldValue.arrayRemove(userId)       
    }         
    const result = await ref.update(data, {merge: true})                      
    return {result: true}
}

export async function deleteComment(listingId: string, commentId: string) {    
    const ref = index.firestore.collection(collection).doc(listingId).collection(commentCollection).doc(commentId);       
    const result = await ref.delete()                          
    return {result}
}

export async function followListing(listingId: string, user: any) {    
    const following = await getFollowing(user.id, listingId)
    if (following.length > 0) {
        return following[0]
    } else {
        const listing = await get(listingId)
        const ref = index.firestore.collection(followingCollection);
        const data:any = {}  
        data.listing = createSnippet(listing, true)
        data.user = {
            id: user.id,
            image: (user.image ? user.image : null),
            name: user.name,
            email: user.email           
        }
        data.timestamp = admin.firestore.FieldValue.serverTimestamp()        
        
        const result = await ref.add(data)          
        return {id: result.id}
    }
}

export async function unfollowListing(listingId: string, user: any) {        
    const following = await getFollowing(user.id, listingId)
    await Promise.all(following.map(async (follow) => {
        const ref = index.firestore.collection(followingCollection).doc(follow.id)
        await ref.delete()
    }));
    
    return following
}

export async function getFollowing(userId: string, listingId: string = "") {
    const ref = index.firestore.collection(followingCollection)    
    let query: FirebaseFirestore.Query
    if (userId !== "") {
        query = ref.where("user.id", "==", userId)        
    }
    if (listingId !== "") {
        query = (query ? query : ref).where("listing.id", "==", listingId)
    } else {
        query =  (query ? query : ref).orderBy("timestamp", "desc")  
    }    
    const snapshot = await query.get()
    const result = []
    snapshot.docs.forEach(data => {   
        const jsonData = data.data()
        jsonData.id = data.id
        result.push(jsonData)
    });            
    return result
 }   

 async function undoBidsAndCleanListing(listing: any) {    
    await bids.releaseHolds(listing.id)
    await bids.deleteBids(listing.id)
    const data: any = {
        price: 0,
        lastBidder: admin.firestore.FieldValue.delete(),
        outbiddedUser: admin.firestore.FieldValue.delete()
    }
    await updateObject(listing.id, data)
    await locationStore.removeLocation(listing.id)
 }