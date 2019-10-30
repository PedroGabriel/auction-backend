import * as index from '../index'
import * as admin from 'firebase-admin'
import * as geo from 'geofirestore'
import * as errorHelper from '../helpers/errorHelper'

let geoSingleton: geo.GeoFirestore

function geoFirestore() {    
    const collectionRef = index.firestore.collection('locations');
    if (geoSingleton) {
        return geoSingleton
    }    
    geoSingleton = new geo.GeoFirestore(collectionRef);
    return geoSingleton
}

export async function setLocation(id: string, data: any) {    
    if (data.location)    
        geoFirestore().set(id, data, "location")
}

export async function removeLocation(id: string) {    
    geoFirestore().remove(id)
}

export async function searchLocations(latitude: number, longitude: number, radius: number, locationType: string = null): Promise<Object> {          
    return new Promise((resolve, reject) => {
        
        const results: Object[] = [];
        const geoQuery = geoFirestore().query({
                center: new admin.firestore.GeoPoint(latitude, longitude),
            radius: radius
            // ,query: (locationType) ? (ref) => ref.where('d.locationType', '==', locationType) : null
            // ,query: (ref) => ref.where('d.year', '==', 2011)
        });
    
        // As documents come in, add the $key/id to them and push them into our results
        geoQuery.on('key_entered', function (key, document, distance) {
            // console.log(key + ' entered query at ' + document.location.latitude + ',' + document.location.longitude + ' (' + distance + ' km from center)');
            // const doc = document
            // doc.id = key
            results.push(key);
        });

        geoQuery.on('error', function (error) {
            console.error(error)
            resolve(error)
        })
    
        geoQuery.on('ready', () => {
            geoQuery.cancel()
            resolve(results)            
        });
    });
}

