
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export async function saveFile(filename: string, folder: string, content: string, encoding: string, contentType: string) {
    try {
        // Path to temp directory
        const filepath = path.join(os.tmpdir(), filename);
        // Save file to the temp directory
        fs.writeFileSync(filepath, content, {encoding: encoding})
        // Options of the media file        
        const options = {
            destination: folder+filename,
            uploadType: "media",
            metadata: {
                metadata: {
                    contentType: contentType,                    
                }
            }
        }

        const bucketStore = admin.storage().bucket()        
        const files = await bucketStore.upload(filepath, options)
        const file = files[0]

        const metadata = await file.getMetadata()
        const url = `https://firebasestorage.googleapis.com/v0/b/${metadata[0].bucket}/o/${encodeURIComponent(metadata[0].name)}?alt=media`
        return url
    } catch (error) {
        console.error('Failed file: ', error);
        throw new functions.https.HttpsError('invalid-argument', error);
    }
}