
export function cloudURL(): string {
    const config = JSON.parse(process.env.FIREBASE_CONFIG)
    console.log(config)
    return "https://" +  config.cloudResourceLocation + "1-" + config.projectId + ".cloudfunctions.net/"
}

export function siteURL(): string {
    const config = JSON.parse(process.env.FIREBASE_CONFIG)
    console.log(config)
    return "https://" + config.projectId + ".firebaseapp.com/"
}