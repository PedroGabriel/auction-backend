import * as index from '../index'

export function transformToList(snapshot: FirebaseFirestore.QuerySnapshot): any[] {
    const result = []
    snapshot.docs.forEach(doc => { 
        const data = doc.data() 
        data.id = doc.id      
        result.push(data)
    });     

    return result
}

export function addToList(list: any[], snapshot: FirebaseFirestore.QuerySnapshot): any[] {    
    snapshot.docs.forEach(doc => { 
        const data = doc.data() 
        data.id = doc.id      
        list.push(data)
    });     
    
    return list
}

export async function getKeys(keys: any, collection: string) {
    const references: FirebaseFirestore.DocumentReference[] = []
    for (const key of keys) {
        console.log(key)
        const ref = index.firestore.collection(collection).doc(String(key))
        references.push(ref)
    }    
    if (references.length > 0) {        
        const docs = await index.firestore.getAll(index.firestore.collection(collection).doc("x"), ...references)
        const result = []
        docs.forEach(doc => {
            if (doc.data()) {
                const data = doc.data()
                data.id = doc.id
                result.push(data)
            }
        });
        return result
    } else {
        return []
    }
}