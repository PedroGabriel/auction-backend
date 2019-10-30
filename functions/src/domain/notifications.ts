import * as index from '../index'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import * as email from '../helpers/emailSender'
import * as users from '../domain/users'
import * as listings from '../domain/listings'
import * as bids from '../domain/bids';

const collection = "notifications"
enum NotificationType {
    tag = "comment tag",
    outbidded = "outbidded",
    newBid = "new bid",
    ending = "ending",    
    ended = "ended",
    newListing = "new listing",    
}

export async function get(id: string) {    
    const ref = index.firestore.collection(collection).doc(id)
    const notification = await ref.get()    
    if (notification.data()) {
        const result = notification.data()
        result.id = notification.id
        return result
    } else {
        return {}
    }
}

export async function notifications(userId: string, pageId: string = "") {      
    const ref = index.firestore.collection(collection)
    let query = ref.where("to.id", "==", userId)    
    query = query.orderBy("timestamp", "desc")
    if (pageId !== "") {        
        const docSnapshot = await index.firestore.collection(collection).doc(pageId).get()
        query = query.startAfter(docSnapshot)        
    }
    query = query.limit(20)
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
    const result = await ref.add(data)  
    return {id: result.id}    
}

export async function createTagNotification(from: any, to: any, comment: any) {    
    const ref = index.firestore.collection(collection);                       
    const data: any = {}
    data.from = from
    data.to = to
    data.comment = comment
    data.verb = NotificationType.tag
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    return {id: result.id}
}

export async function deleteTagNotification(commentId: string) {    
    const snapshot = await index.firestore.collection(collection).where("comment.id", "==", commentId)
                                                    .where("verb", "==", NotificationType.tag).get();       
    const batch = index.firestore.batch()  
    snapshot.docs.forEach(notification => {   
        batch.delete(notification.ref)
    });                     

    const result = await batch.commit()
    return result
}

export async function createUserOutbiddedNotification(user: any, listing: any, finalPrice: number) {    
    const ref = index.firestore.collection(collection);                       
    const data: any = {}
    data.to = user
    data.listing = listing
    data.finalPrice = finalPrice
    data.verb = NotificationType.outbidded
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    return {id: result.id}
}

export async function createNewBidNotification(listing: any, amount: number, finalPrice: number) {    
    const ref = index.firestore.collection(collection);                       
    const data: any = {}    
    data.from = listing
    data.amount = amount
    data.finalPrice = finalPrice
    data.verb = NotificationType.newBid
    data.listing = true
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    await replicateNotificationToFollowersOfListing(listing.id, data)
    return {id: result.id}
}

export async function checkAndCreateBidEndingNotifications(listing: any) {
    const minutesRemaining = bids.minutesRemaining(listing)                
    if (minutesRemaining <= 30 && !listing.n30) {               
        await createBidEndindNotification(listing, 30)
        await listings.updateObject(listing.id, {n30: true})  
        return true      
    }
    if (minutesRemaining <= 5 && !listing.n5) {
        await createBidEndindNotification(listing, 5)
        await listings.updateObject(listing.id, {n5: true})          
        return true
    }   
    return false
}  

export async function createBidEndindNotification(listing: any, time: number) {    
    const ref = index.firestore.collection(collection);                       
    const data: any = {}    
    data.from = {id: listing.id, 
                    brand: listing.brand,
                    model: listing.model,
                    year: listing.year}
    data.time = time
    data.listing = true
    data.verb = NotificationType.ending
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    await replicateNotificationToFollowersOfListing(listing.id, data)
    return {id: result.id}
}

export async function createBidEndedNotification(listing: any) {    
    const ref = index.firestore.collection(collection);                       
    const data: any = {}    
    data.from = {id: listing.id, 
                    brand: listing.brand,
                    model: listing.model,
                    year: listing.year}    
    data.verb = NotificationType.ended
    data.listing = true
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    await replicateNotificationToFollowersOfListing(listing.id, data)
    return {id: result.id}
}

export function findUsersIn(text: String)  {
    //warning não funciona no node 6
    // const regex = text.match(/(?<=@<)(.*?)(?=>)/gi);    
    const regex = text.match(/@<(.*?)>/gi);           
    const result = []
    regex.forEach(element => {
        result.push(element.substring(2, element.length - 1))
    });    
    return result
}

export function checkMentionsAndNotify(comment: any) {   
    findUsersIn(comment.comment).forEach(async userId => {   
        const toUser = await users.userInfo(userId)
        const notify = toUser.notifyMention === true
        const toUserSnippet: any = {id: toUser.id, name: toUser.name, email: toUser.email, notify: notify}
        if (toUser.image) { toUserSnippet.image = toUser.image}            
        await createTagNotification(comment.user, toUserSnippet, comment)                             
    })
}

export async function notificationCreated(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext): Promise<any> { 
    const data = snapshot.data()   
    switch(data.verb) { 
        case NotificationType.newBid: { 
            if (data.listing !== true) {
                if ((await shouldSendListingEmail(data.to.id)) === true ) {
                    const userEmail = await getOrFetchUserEmail(data.to)
                    await email.sendNewBidEmail(userEmail, data.from)
                }
            }
            break; 
        } 
        case NotificationType.tag: { 
            if (data.to.notify) {
                // await email.sendMentionEmail(data.from, data.to, data.comment)
            }                
            break; 
        } 
        case NotificationType.outbidded: { 
            const userEmail = await getOrFetchUserEmail(data.to)
            await email.sendOutbiddedEmail(userEmail, data.listing)
            break; 
        } 
        case NotificationType.ending: { 
            if (data.listing !== true) {   
                if ((await shouldSendListingEmail(data.to.id)) === true ) {
                    const userEmail = await getOrFetchUserEmail(data.to)
                    await email.sendEndingListingEmail(userEmail, data.from, data.time)
                }                             
            }
            break; 
        } 
        case NotificationType.ended: { 
            if (data.listing !== true) {
                if ((await shouldSendListingEmail(data.to.id)) === true ) {
                    const userEmail = await getOrFetchUserEmail(data.to)
                    await email.sendEndListingEmail(userEmail, data.from)
                }
            }
            break; 
        } 
        default: { 
            console.log("Invalid Notification"); 
            break;              
        }
    }  
}

export async function replicateNotificationToFollowersOfListing(listingId: string, notification: any) {
    const followings = await listings.getFollowing("", listingId)
    delete notification.listing
    followings.forEach(async following => {   
        if (following.user) {
            notification.to = following.user                
            await createObject(notification)
        }
    });    
}

async function getOrFetchUserEmail(user: any) {
    if (user.email) {
        return user.email
    } else {
        return (await users.userInfo(user.id)).email
    }
}

async function shouldSendListingEmail(userId: string) {
    return (await users.userInfo(userId)).notifyListings   
}