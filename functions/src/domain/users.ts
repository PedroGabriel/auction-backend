import * as index from '../index'
import * as admin from 'firebase-admin'
import * as uploader from '../helpers/uploadDocument'
import * as charges from './stripe'
import * as errorHelper from  '../helpers/errorHelper';
import * as emailSender from  '../helpers/emailSender';

const collection = "users"
const commentCollection = "comments"
enum userType {
    user = "user",
    admin = "admin"
}

export async function userInfo(userId: string) { 
    const ref = index.firestore.collection(collection).doc(userId)
    const user = await ref.get()    
    if (user.data()) {
        const result = user.data()
        result.id = user.id
        return result
    } else {
        return {}
    }
}

export async function users() {      
    const snapshot = await index.firestore.collection(collection).get()
    const result = []
    snapshot.docs.forEach(user => {     
        const data = user.data()
        data.id = user.id   
        result.push(data)
    });            
    return result
}

export async function uploadProfilePicture(id: string, photo: any) {     
    const result = await uploader.saveFile(id, "userprofile/", photo.content, photo.encoding, photo.contentType)
    const data: any = {}
    data.image =  result  
    await updateUser(id, data)
    return {image: result}
}

export async function updateUser(id: string, data: any) {   
    const ref = index.firestore.collection(collection).doc(id);          
    data.timestamp = admin.firestore.FieldValue.serverTimestamp()
    const result = await ref.set(data, { merge: true })                      
    return result
}

export async function registerNotificationsSettings(name: string, email: string) {   
    const data: any = {notifyMentions: true, 
                        notifyListings: true, 
                        bidSound: true,
                        commentSound: true}
    const emailId = await emailSender.addRecipient(email, name)
    data.emailId = String(emailId)
    return data
 }
 
export async function updateNotificationsSettings(userId: string, data: any) {   
   const dataToSave: any = {notifyMentions: data.notifyMentions, 
                             notifyListings: data.notifyListings, 
                            bidSound: data.bidSound,
                            commentSound: data.commentSound}
    const emailId = await emailSender.addRecipient(data.email, data.name)    
    data.emailId = String(emailId)
    return await updateUser(userId, dataToSave)
}

export async function getUserFromToken(idToken: string) {
    const userAuth = await admin.auth().verifyIdToken(idToken)
    return userInfo(userAuth.uid)
}

export async function checkUserPermission(idToken: string, id: string){
    // if (enforceAuthentication === false) {
    //     return true
    // }
    const userAuth = await getUserFromToken(idToken)    
    const userDatabase = await userInfo(id);    
    if (userAuth.type === userType.admin) {
        return true
    }
    //verifica se é pessoa alterando seus próprios dados
    if (userDatabase.id) {        
        if (userDatabase.id === userAuth.uid) {
            return true
        }
    }

    throw errorHelper.createError("not allowed", "You're not allowed to make this change.")
}

export async function createUser(data: any) {    
    const result = await admin.auth().createUser({
            email: data.email,
            emailVerified: false,        
            password: data.password,
            displayName: data.name,    
            disabled: false
         })
   
    if (data.type) {
        await updateUser(result.uid, {type: data.type})
    }
    
    return result
}

export async function saveComment(userId: string, commentId: string, comment: any) { 
    const userRef = index.firestore.collection(collection).doc(userId)    
    let result: any
    await index.firestore.runTransaction(async transaction => {
        const doc = await transaction.get(userRef);
        const user = doc.data()
        let commentCount = user.commentCount
        if (!commentCount) { commentCount = 0 }
        commentCount = commentCount + 1
        const data = {commentCount: commentCount, 
                        timestamp:  admin.firestore.FieldValue.serverTimestamp()}

        const commentRef = index.firestore.collection(collection).doc(userId).collection(commentCollection).doc(commentId);       
        result = await transaction.set(commentRef, comment, {merge: true})     
        
        result = await transaction.set(userRef, data, {merge: true})                 
    })
    return result     
}

export async function deleteComment(userId: string, commentId: string) { 
    const userRef = index.firestore.collection(collection).doc(userId)    
    let result: any
    await index.firestore.runTransaction(async transaction => {
        const doc = await transaction.get(userRef);
        const user = doc.data()
        let commentCount = user.commentCount
        if (!commentCount) { commentCount = 0 }
        commentCount = commentCount - 1
        const data = {commentCount: commentCount, 
                        timestamp:  admin.firestore.FieldValue.serverTimestamp()}

        const commentRef = index.firestore.collection(collection).doc(userId).collection(commentCollection).doc(commentId);       
        result = await transaction.delete(commentRef)     
        
        result = await transaction.set(userRef, data, {merge: true})                 
    })
    return result     
}

export async function comments(userId: string) {      
    const snapshot = await index.firestore.collection(collection).doc(userId).collection(commentCollection).orderBy("timestamp", "desc").get()
    const result = []
    snapshot.docs.forEach(comment => {        
        const data = comment.data()
        data.id = comment.id
        result.push(data)
    });            
    return result
}

