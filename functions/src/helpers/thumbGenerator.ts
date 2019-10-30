import * as functions from 'firebase-functions';
import * as index from "../index"
// import * as Storage from '@google-cloud/storage';
// const gcs = new Storage();
import * as admin from 'firebase-admin';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs-extra';

function listingDirectories(currentDirectory: string): boolean {
    const allowedDirectories = ["approval", "engine", "exterior", "imperfections", "underside"]    
    for (const allowed of allowedDirectories) {        
        if (currentDirectory.startsWith(allowed)) {            
            return true
        }
    }    
    return false
}

function userProfileDirectory(currentDirectory: string): boolean {
    const allowedDirectories = ["userprofile"]    
    for (const allowed of allowedDirectories) {        
        if (currentDirectory.startsWith(allowed)) {            
            return true
        }
    }    
    return false
}

export async function fileUploaded(object: functions.storage.ObjectMetadata, context: functions.EventContext): Promise<any> {    
    const bucketDir = dirname(object.name);
    if (listingDirectories(bucketDir) ) {
        const sizes = [{width: 120, height: 120}, 
                        {width: 360, height: 275},
                        {width: 549, height: 349}];
        return await uploadFile(sizes, object, context)
    } else if (userProfileDirectory(bucketDir)) {
        const sizes = [{width: 120, height: 120}]
        return await uploadFile(sizes, object, context)
    }
}

async function uploadFile(thumbSizes: any, object: functions.storage.ObjectMetadata, context: functions.EventContext): Promise<any> {
    const gcs = admin.storage()
    const bucket = gcs.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath.split('/').pop();
    const bucketDir = dirname(filePath);
    const workingDir = join(tmpdir(), 'thumbs');
    const tmpFilePath = join(workingDir, fileName);

    if (fileName.includes('thumb@') || !object.contentType.includes('image')) {
        console.log('this is a thumb exiting function');
        return false;
    }

    // 1. Ensure thumbnail dir exists
    await fs.ensureDir(workingDir);

    // 2. Download Source File
    await bucket.file(filePath).download({
      destination: tmpFilePath
    });

    // 3. Resize the images and define an array of upload promises
    const sizes = thumbSizes

    const uploadPromises = sizes.map(async size => {
      const thumbName = `thumb@${size.width}_${fileName}`;
      const thumbPath = join(workingDir, thumbName);

      // Resize source image
      await sharp(tmpFilePath)
        .resize(size.width, size.height)
        .toFile(thumbPath);

      // Upload to GCS
      return bucket.upload(thumbPath, {
        destination: join(bucketDir, thumbName)
      });
    });

    // 4. Run the upload operations
    await Promise.all(uploadPromises);

    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir);
}