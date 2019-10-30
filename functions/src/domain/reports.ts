import * as index from '../index'
import * as listings  from './listings';
import * as admin from 'firebase-admin'

const listingCollection = "listings"
const commentCollection = "comments"
const reportCollection = "reports"

export async function get(id: string) {    
    const ref = index.firestore.collection(reportCollection).doc(id)
    const report = await ref.get()    
    if (report.data()) {
        const result = report.data()
        result.id = report.id
        return result
    } else {
        return {}
    }
}

export async function updateObject(id: string, data: any) {            
    const ref = index.firestore.collection(reportCollection).doc(id);   
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function reportComment(listingId: string, commentId: string, user: any, message: string) {    
    const ref = index.firestore.collection(listingCollection).doc(listingId).collection(commentCollection).doc(commentId); 
    const comment = await ref.get()
    const reportRef = index.firestore.collection(reportCollection)  
    const listing = await listings.get(listingId)      
    const data: any = {} 
    data.listing = {id: listingId,
                    year: listing.year, 
                    brand: listing.brand, 
                    model: listing.model}
    data.user = {
        id: user.id,
        image: (user.image ? user.image : null),
        name: user.name       
    }
    data.comment = {
        id: comment.id,
        timestamp: comment.data().timestamp,
        user: comment.data().user,
        comment: comment.data().comment
    }   
    data.needsRevision = true 
    data.message = message
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await reportRef.add(data)        
    return {id: result.id}
}

export async function reportedCommments(pageId: string = "") {
    const ref = index.firestore.collection(reportCollection)   
    let query =  ref.orderBy("timestamp", "desc") 
    query = query.where("needsRevision", "==", true)
    if (pageId !== "") {
        const docSnapshot = await index.firestore.collection(listingCollection).doc(pageId).get()
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

 export async function reviseReport(reportId: string, deleteComment: boolean) {
    const report  = await get(reportId)
    if (deleteComment === true) {
        await listings.deleteComment(report.listing.id, report.comment.id)
    } 
    await updateObject(reportId, {needsRevision: false})
    return {result: true}
 }