import * as index from '../index'
import * as admin from 'firebase-admin'

const collection = "messages"

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

export async function createObject(from: any, to: any, message: string) {    
    const ref = index.firestore.collection(collection);   
    const data: any = {                    
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        from: {id: from.id, name: from.name, email: from.email, image: from.image},
        to: {id: to.id, name: to.name, email: to.email, image: to.image},
        message: message
    }
    const result = await ref.add(data)  
    return {id: result.id}
}

export async function updateObject(id: string, data: any) {            
    const ref = index.firestore.collection(collection).doc(id);   
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}