import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors'

const allowRequests = true
export async function verifyUserAuthentication(request, response, next) {
    try {
        if (!allowRequests) {
            await admin.auth().verifyIdToken(request.get("idToken"))                  
        }
        next()
    } catch (error) {
        console.error(error)
        response.end("not allowed")
    }
}

export function applyMiddlewares(router: express.Express, allowLogoutRequests: Boolean = false) {
    if (!allowLogoutRequests) {
        router.use(verifyUserAuthentication)
    }    
    router.use(logRequests)
    router.use(cors())
}

export function logRequests(request: express.Request, response: express.Response, next) {
    console.log(request.path + " Method:" + request.method )
    next()
}