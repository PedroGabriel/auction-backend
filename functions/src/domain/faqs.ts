import * as index from '../index'
import * as admin from 'firebase-admin'

const collection = "faqs"

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

export async function list() {          
    const snapshot = await index.firestore.collection(collection).orderBy("order").get()
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

export async function updateObject(id: string, data: any) {            
    const ref = index.firestore.collection(collection).doc(id);   
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function deleteObject(id: string) {    
    const ref = index.firestore.collection(collection).doc(id);                           
    const result = await ref.delete() 
    return result
}
