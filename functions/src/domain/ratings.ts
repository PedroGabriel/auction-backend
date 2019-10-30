import * as index from '../index'
import * as admin from 'firebase-admin'
import * as errorHelper from '../helpers/errorHelper'
import * as listings from '../domain/listings'

const collection = "ratings"
const userCollection = "users"

export async function get(id: string) {    
    const ref = index.firestore.collection(collection).doc(id)
    const rating = await ref.get()    
    if (rating.data()) {
        const result = rating.data()
        result.id = rating.id
        return result
    } else {
        return {}
    }
}

export async function ratings(userId: string) {      
    const snapshot = await index.firestore.collection(collection).
                            where("to.id", "==", userId).orderBy("timestamp", "desc").get()
    const result = []
    snapshot.docs.forEach(rating => {     
        const data = rating.data()
        data.id = rating.id   
        result.push(data)
    });            
    return result
}

export async function updateObject(id: string, data: any) {            
    const ref = index.firestore.collection(collection).doc(id);   
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function createObject(data: any) {    
    const ref = index.firestore.collection(collection);                     
    if ( !(data.stars) || (data.stars < 0 || data.stars > 5) ) {
        throw errorHelper.createError("invalid_rating", "number of stars are invalid.")
    }
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()                
    const result = await ref.add(data)  
    if (data.listing) {
        await listings.updateObject(data.listing.id, {reviewed: true})
    }
    return {id: result.id}
}

export async function deleteObject(id: string) {    
    const ref = index.firestore.collection(collection).doc(id);                           
    const result = await ref.delete() 
    return result
}

export async function calculateRating(userId: string, rating: number, add: boolean = true) { 
    const userRef = index.firestore.collection(userCollection).doc(userId)    
    let result: any
    await index.firestore.runTransaction(async transaction => {
        const doc = await transaction.get(userRef);
        const user = doc.data()
        let ratingCount:number = user.ratingCount
        if (!ratingCount) { ratingCount = 0 }
        let previousRating: number = user.rating
        if (!previousRating) { previousRating = 0 }
        let finalRating = 0

        if (add === true)  {
            finalRating = (previousRating * ratingCount + rating) / (ratingCount + 1)
            ratingCount = ratingCount + 1
        } else {
            finalRating = (previousRating * ratingCount - rating) / (ratingCount - 1)
            ratingCount = ratingCount - 1
        }
        const data = {ratingCount: ratingCount, 
                        rating: finalRating,
                        timestamp:  admin.firestore.FieldValue.serverTimestamp()}
                
        
        result = await transaction.set(userRef, data, {merge: true})                 
    })
    return result     
}