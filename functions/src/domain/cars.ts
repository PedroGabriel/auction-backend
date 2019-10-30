import * as index from '../index'
import * as admin from 'firebase-admin'

const collection = "settings"
const brandsKey = "brands"

export async function get() {    
    const ref = index.firestore.collection(collection).doc(brandsKey)
    const data = await ref.get()    
    if (data.data()) {
        const result = data.data()
        return result
    } else {
        return {}
    }
}

export async function addBrand(brand: string) {            
    const ref = index.firestore.collection(collection).doc(brandsKey);   
    const data: any = {}    
    data["brands"] = admin.firestore.FieldValue.arrayUnion(...[brand])
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function addModel(brand: string, model: string) {            
    const ref = index.firestore.collection(collection).doc(brandsKey);   
    const data: any = {}
    data[brand] = admin.firestore.FieldValue.arrayUnion(...[model])    
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function addModels(brand: string, model: string[]) {            
    const ref = index.firestore.collection(collection).doc(brandsKey);   
    const data: any = {}
    data[brand] = admin.firestore.FieldValue.arrayUnion(...model)    
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function removeModel(brand: string, model: string) {            
    const ref = index.firestore.collection(collection).doc(brandsKey);   
    const data: any = {}
    data[brand] = admin.firestore.FieldValue.arrayRemove(...[model])    
    const result = await ref.set(data, { merge: true })                      
    return result
}