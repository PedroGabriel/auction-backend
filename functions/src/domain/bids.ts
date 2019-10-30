import * as index from '../index'
import * as admin from 'firebase-admin'
import * as listings  from '../domain/listings';
import * as stripe  from '../domain/stripe';
import * as async from '../helpers/async';

const collection = "bids"
const listingCollection = "listings" 
const holdsCollection = "holds" 
const auctionDays = 21
const minFee = 250
const maxFee = 5000

export async function get(id: string) {    
    const ref = index.firestore.collection(collection).doc(id)
    const listing = await ref.get()    
    if (listing.data()) {
        return listing.data()
    } else {
        return {}
    }
}

export async function listByUser(userId: string) {      
    const snapshot = await index.firestore.collection(collection)
                            .where("user.id", "==", userId).orderBy("timestamp", "desc").get()
    const result = []
    snapshot.docs.forEach(listing => {        
        result.push(listing.data())
    });            
    return result
}

export async function listByListing(listingId: string) {      
    const snapshot = await index.firestore.collection(collection)
                            .where("listing.id", "==", listingId).get()
    const result = []
    snapshot.docs.forEach(listing => {        
        result.push(listing.data())
    });            
    return result
}

export async function deleteBids(listingId: string) {      
    const bids = await listByListing(listingId)
    bids.forEach(async bid => {
        await index.firestore.collection(collection).doc(bid.id).delete()
    })
    return true
}

export async function makebid(amount: number, basePrice: number, listingId: string, user: any) {    
    const ref = index.firestore.collection(listingCollection).doc(listingId)    
    let result: any
    await index.firestore.runTransaction(async transaction => {
        const doc = await transaction.get(ref);
        if(!doc.exists){ throw Error("Listing does not exist") }
        const listing = doc.data()
        const data: any = {}
        listing.id = doc.id        
        checkStatus(listing)                
        checkValue(listing, basePrice)        
        const timeToEnd = await checkTime(listing)
        if (timeToEnd <= 60) {
            data.auctionStart = listing.auctionStart
            data.auctionStart._seconds = listing.auctionStart._seconds + 60           
        }              
        //check stripe information                   
        data.price = (listing.price ? listing.price : 0) + amount
        data.bidCount = (listing.bidCount ? listing.bidCount : 0) + 1 
        if (listing.lastBidder) {data.outbiddedUser = listing.lastBidder}        
        data.lastBidder = {
            id: user.id,
            image: (user.image ? user.image : null),
            name: user.name,
            email: user.email}
        await transaction.update(ref, data);          
        result = await createBid(amount, data.price, listing, user)
    })
    return result
}

function checkStatus(listing: any) {    
    if (listing.state !== listings.state.live) {
        const error = Error("This listing is not live.")        
        error.name = "invalid_state"
        throw error
    }
}

function checkValue(listing: any, basePrice: number) {
    const listingPrice = Number(listing.price)    
    if (listingPrice !== basePrice) {        
        const error = Error("You have been outbidded.")        
        error.name = "outbid"
        throw error
    }
}

async function checkTime(listing: any) {    
    const difference = daysDifference(listing)    
    if (difference >= auctionDays) {
        try {
            await listings.checkAndClose(listing)
        } catch (closeError) {
            console.error("failure to close expired listing")
            console.error(closeError)
        }
        const error = Error("This listing has been closed.")        
        error.name = "auction_closed"       
        throw error
    } 
    return (auctionDays - difference) * 24 * 60 * 60
}

export function daysDifference(listing: any): number {
    const now = new Date()
    const auctionStart: FirebaseFirestore.Timestamp = listing.auctionStart    
    return (now.valueOf() - auctionStart.toDate().valueOf()) / 1000 / 60 / 60 / 24    
}

export function timeout(listing: any): boolean {  
    const difference = daysDifference(listing)    
    return (difference >= auctionDays)            
}

export function minutesRemaining(listing: any): number {  
    const difference = daysDifference(listing)    
    return (auctionDays - difference) * 24 * 60           
}

async function createBid(amount: number, finalPrice: number, listing: any, user: any) {
    const ref = index.firestore.collection(collection);  
    const data: any = {}                    
    data.amount = amount
    const listingSnippet = {id: listing.id, 
                            brand: listing.brand,
                            model: listing.model,
                            year: listing.year}
    data.finalPrice = finalPrice
    data.listing = listingSnippet
    const userSnippet = {
        id: user.id,
        image: (user.image ? user.image : null),
        name: user.name,
        email: user.email       
    }
    data.user = userSnippet
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()            
    const result = await ref.add(data)                      
    return {id: result.id}
}

export async function createHold(bidAmount: number, listingId: string, user: any) {
    const check = await checkHold(listingId, user.id)
    console.log(check)
    if (check.result === true) {
        const error = Error("Your hold already been charged for this listing")        
        error.name = "double_charged"
        throw error
    }
    let holdAmount = bidAmount * 0.05
    if (holdAmount < minFee) {holdAmount = minFee} 
    if (holdAmount > maxFee) {holdAmount = maxFee} 
    holdAmount = parseFloat(holdAmount.toFixed(2))    
    const listing = await listings.get(listingId)    
    const stripeResult = await stripe.createHoldToUser(user.id, holdAmount, 
        "Pink slip daddys hold for " + listing.brand + " " + listing.model + " " + listing.year )    
    const ref = index.firestore.collection(holdsCollection);  
    const data: any = {}                        
    const listingSnippet = {id: listingId}
    data.holdAmount = holdAmount
    data.initialBid = bidAmount
    data.listing = listingSnippet
    const userSnippet = {
        id: user.id,
        name: user.name        
    }
    data.holdId = stripeResult.id
    data.user = userSnippet
    data.waitingCharge = true
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()            
    const result = await ref.add(data)                      
    return {id: result.id}
}

export async function checkHold(listingId: string, userId: string) {    
    const ref = index.firestore.collection(holdsCollection)
    const query = ref.where("listing.id", "==", listingId)
                     .where("user.id", "==", userId).where("waitingCharge", "==", true)
    const snapshot = await query.get()
    return {result: (snapshot.docs.length > 0)} 
}

export async function chargeHoldForWinner(listingId: string, userId: string) {   
    const ref = index.firestore.collection(holdsCollection)
    const query = ref.where("listing.id", "==", listingId)
                     .where("user.id", "==", userId).where("waitingCharge", "==", true)
    const snapshot = await query.get() 
    if (snapshot.docs.length === 0) {
        await listings.updateObject(listingId, {charged: false, error: "Hold not found."})    
        return false
    }
    try {
        const hold = snapshot.docs[0]
        await stripe.chargeHoldToUser(hold.data().holdId)   
        await updateHold(hold.id, {waitingCharge: false})            
        await listings.updateObject(listingId, {charged: true, holdId: hold.id})    
        return true
    } catch(error) {
        console.error(error)
        await listings.updateObject(listingId, {charged: false, error: error.message})
        return false
    }
} 

export async function releaseHolds(listingId: string) {    
    const ref = index.firestore.collection(holdsCollection)
    const query = ref.where("listing.id", "==", listingId).where("waitingCharge", "==", true)
    const snapshot = await query.get()
    const result = []
    await async.forEach(snapshot.docs, async(hold) => {
        const holdData = hold.data()  
        try {
            await stripe.releaseHold(holdData.holdId)
            await updateHold(hold.id, {waitingCharge: false})
            result.push( hold.id )        
        } catch(error) {            
            console.error(error)
            await updateHold(hold.id, {error: error.message})            
        }               
    })
    return result
}

export async function updateHold(id: string, data: any) {            
    const ref = index.firestore.collection(holdsCollection).doc(id);   
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}


