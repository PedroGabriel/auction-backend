import * as index from '../index'
import * as admin from 'firebase-admin'
import * as async from '../helpers/async';
import * as stripeAPI from 'stripe'

const collection = "stripeUsers"
const stripe = new stripeAPI('sk_test_CS1WamyAYlcHvEij6C8gIQ5r')
const currency = 'usd';

export async function sourceCreate(userId: string, data: any) {
  // const ref = await index.firestore.collection(collection).doc(userId).collection(subcollectionsources)
  // data.timestamp = admin.firestore.FieldValue.serverTimestamp()        

  // // Look up the Stripe customer id written in createStripeCustomer
  // const snapshot = await ref.parent.get()
  // const snapval = snapshot.data();
  // const customer = snapval.customer_id
  // const email = snapval.email
  
    const card =  {
      "number": data.number,
      "exp_month": data.expmonth,
      "exp_year": data.expyear,
      "cvc": data.cvc,
      // "name": data.cardholdername,
      // "address_line1": data.street,
      // "address_line2": data.streetlinetwo,
      // "address_city": data.city,
      // "address_zip": data.zip,
      // "address_state": data.state,
      // "address_country": data.country
    }  

  // Add a payment source (card) for a user by writing a stripe payment source token to Realtime database
  const sourceObj = {
    type: 'card',
    currency: currency,
    owner: {
      email: data.email
    },
    usage: "reusable",
    card: card
  };

  // Create source in Stripe
  const response = await stripe.sources.create(sourceObj);
  const source = response.id;
  // If the result is successful, write it back to the database
  // await ref.doc(source).set(response, { merge: true });
  
  // // If the result is successful, write it back to the database
  // await ref.doc(source).collection(subcollectioncards).doc(cardid).set(responseCards, { merge: true });

  // // Attaches a Source object to a Customer. The source must be in a chargeable or pending state.
  // await stripe.customers.createSource(customer, { source: source });

  // // Set card default
  // await stripe.customers.update(customer, { default_source: source });

  return {id: source}
}

export async function getStripeUserData(userId: string, excludeSourceId: boolean = true ) {
    const stripeData = await index.firestore.collection(collection).doc(userId).get() 
    if (stripeData.data()) {
        const result = stripeData.data()   
        if (result.sourceId) { result.card = (await stripe.sources.retrieve(result.sourceId)).card}             
        if (excludeSourceId) { delete result.sourceId }        
        return result
    } else {
        return {}
    }
}

export async function registerUserToStripe(userId: string, email: string) {
    const customer = await stripe.customers.create({email: email});
    await admin.firestore().collection(collection).doc(userId).set({customerId: customer.id, email: email}, {merge: true});
    return customer.id
}

export async function updateDefaultPaymentMethod(userId: string, email: string,  sourceId: string) {    
    const stripeData =  await getStripeUserData(userId)
    let stripeCustomerId = ""
    if (stripeData.customerId) {
        stripeCustomerId = stripeData.customerId
    } else {
        stripeCustomerId = await registerUserToStripe(userId, email)      
    }    
    const result =  await stripe.customers.update(stripeCustomerId, {
      source: sourceId
    });
    await admin.firestore().collection(collection).doc(userId).set({paymentMethodRegistered: true, sourceId: sourceId}, {merge: true});
    return result
}

export async function deletePaymentMethod(userId: string) {
    const stripeData =  await getStripeUserData(userId, false)    
    const result =  await stripe.customers.deleteSource(stripeData.customerId, stripeData.sourceId);
    await admin.firestore().collection(collection).doc(userId).set({paymentMethodRegistered: false}, {merge: true});
    return result
}

export async function createHoldToUser(userId: string, amount: number, description: string) {    
    const stripeData =  await getStripeUserData(userId)    
    const chargeObj = {
        amount: amount * 100,
        currency: currency,
        customer: stripeData.customerId,
        description: description,
        capture: false 
    };

    const response = await stripe.charges.create(chargeObj);
    return {id: response.id}
}

export async function chargeHoldToUser(holdId: string) {
    const result = await stripe.charges.capture(holdId);
    console.log(result)
    return true
}

export async function releaseHold(holdId: string) {
    const result = await stripe.refunds.create({charge: holdId});
    console.log(result)
    return true
}

export async function chargeUser(userId: string, amount: number, description: string) {    
    const stripeData =  await getStripeUserData(userId)    
    const chargeObj = {
        amount: amount * 100,
        currency: currency,
        customer: stripeData.customerId,
        description: description        
    };

    const response = await stripe.charges.create(chargeObj);
    return {id: response.id}
}


