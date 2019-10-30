
export function errorToJson(error): String {
    const json = {}
    if (error.code) {
        json["stripeMessage"] = errorStripe(error.code)
    }
    json["message"] = error.message
    json["name"] = error.name
    return JSON.stringify(json)
}

export function createError(name: string, message: string): Error {
    const error = Error(message)        
    error.name = name
    return error
}

//https://stripe.com/docs/error-codes
export function errorStripe(code: string): String {
    switch(code)
    {
        case "account_already_exists":
            return "The email address provided for the creation of a deferred account already has an account associated with it."
        case "account_country_invalid_address":
            return "The country of the business address provided does not match the country of the account. Businesses must be located in the same country as the account."
        case "account_invalid":
            return "The account ID provided as a value for the Stripe-Account header is invalid. Check that your requests are specifying a valid account ID."
        case "account_number_invalid":
            return "The bank account number provided is invalid (e.g., missing digits). Bank account information varies from country to country."
        case "alipay_upgrade_required":
            return "This method for creating Alipay payments is not supported anymore."
        case "amount_too_large":
            return "The specified amount is greater than the maximum amount allowed. Use a lower amount and try again."
        case "amount_too_small":
            return "The specified amount is less than the minimum amount allowed. Use a higher amount and try again."
        case "api_key_expired":
            return "The API key provided has expired."
        case "balance_insufficient":
            return "The transfer or payout could not be completed because the associated account does not have a sufficient balance available."
        case "bank_account_exists":
            return "The bank account provided already exists on the specified Customer object. If the bank account should also be attached to a different customer, include the correct customer ID when making the request again."
        case "bank_account_unusable":
            return "The bank account provided cannot be used for payouts. A different bank account must be used."
        case "bank_account_unverified":
            return "Your Connect platform is attempting to share an unverified bank account with a connected account."
        case "bitcoin_upgrade_required":
            return "This method for creating Bitcoin payments is not supported anymore."
        case "card_declined":
            return "The card has been declined. When a card is declined, the error returned also includes the decline_code attribute with the reason why the card was declined."
        case "charge_already_captured":
            return "The charge you’re attempting to capture has already been captured."
        case "charge_already_refunded":
            return "The charge you’re attempting to refund has already been refunded."
        case "charge_disputed":
            return "The charge you’re attempting to refund has been charged back."
        case "charge_exceeds_source_limit":
            return "This charge would cause you to exceed your rolling-window processing limit for this source type."
        case "charge_expired_for_capture":
            return "The charge cannot be captured as the authorization has expired. Auth and capture charges must be captured within seven days."
        case "country_unsupported":
            return "Your platform attempted to create a custom account in a country that is not yet supported."
        case "coupon_expired":
            return "The coupon provided for a subscription or order has expired. Either create a new coupon, or use an existing one that is valid."
        case "customer_max_subscriptions":
            return "The maximum number of subscriptions for a customer has been reached. Contact us if you are receiving this error."
        case "email_invalid":
            return "The email address is invalid (e.g., not properly formatted). Check that the email address is properly formatted and only includes allowed characters."
        case "expired_card":
            return "The card has expired. Check the expiration date or use a different card."
        case "idempotency_key_in_use":
            return "The idempotency key provided is currently being used in another request. This occurs if your integration is making duplicate requests simultaneously."
        case "incorrect_address":
            return "The card’s address is incorrect. Check the card’s address or use a different card."
        case "incorrect_cvc":
            return "The card’s security code is incorrect. Check the card’s security code or use a different card."
        case "incorrect_number":
            return "The card number is incorrect. Check the card’s number or use a different card."
        case "incorrect_zip":
            return "The card’s ZIP code is incorrect. Check the card’s ZIP code or use a different card."
        case "instant_payouts_unsupported":
            return "The debit card provided as an external account does not support instant payouts. Provide another debit card or use a bank account instead."
        case "invalid_card_type":
            return "The card provided as an external account is not a debit card. Provide a debit card or use a bank account instead."
        case "invalid_charge_amount":
            return "The specified amount is invalid. The charge amount must be a positive integer in the smallest currency unit, and not exceed the minimum or maximum amount."
        case "invalid_cvc":
            return "The card’s security code is invalid. Check the card’s security code or use a different card."
        case "invalid_expiry_month":
            return "The card’s expiration month is incorrect. Check the expiration date or use a different card."
        case "invalid_expiry_year":
            return "The card’s expiration year is incorrect. Check the expiration date or use a different card."
        case "invalid_number":
            return "The card number is invalid. Check the card details or use a different card."
        case "invalid_source_usage":
            return "The source cannot be used because it is not in the correct state (e.g., a charge request is trying to use a source with a pending, failed, or consumed source)."
        case "invoice_no_customer_line_items":
            return "An invoice cannot be generated for the specified customer as there are no pending invoice items."
        case "invoice_no_subscription_line_items":
            return "An invoice cannot be generated for the specified subscription as there are no pending invoice items. "
        case "invoice_not_editable":
            return "The specified invoice can no longer be edited. Instead, consider creating additional invoice items that will be applied to the next invoice."
        case "invoice_upcoming_none":
            return "There is no upcoming invoice on the specified customer to preview. Only customers with active subscriptions or pending invoice items have invoices that can be previewed."
        case "livemode_mismatch":
            return "Test and live mode API keys, requests, and objects are only available within the mode they are in."
        case "missing":
            return "Both a customer and source ID have been provided, but the source has not been saved to the customer. To create a charge for a customer with a specified source, you must first save the card details."
        case "not_allowed_on_standard_account":
            return "Transfers and payouts on behalf of a Standard connected account are not allowed."
        case "order_creation_failed":
            return "The order could not be created. Check the order details and then try again."
        case "order_required_settings":
            return "The order could not be processed as it is missing required information. Check the information provided and try again."
        case "order_status_invalid":
            return "The order cannot be updated because the status provided is either invalid or does not follow the order lifecycle (e.g., an order cannot transition from created to fulfilled without first transitioning to paid)."
        case "order_upstream_timeout":
            return "The request timed out. Try again later."
        case "out_of_inventory":
            return "The SKU is out of stock. If more stock is available, update the SKU’s inventory quantity and try again."
        case "parameter_invalid_empty":
            return "One or more required values were not provided. Make sure requests include all required parameters."
        case "parameter_invalid_integer":
            return "One or more of the parameters requires an integer, but the values provided were a different type. Make sure that only supported values are provided for each attribute."
        case "parameter_invalid_string_blank":
            return "One or more values provided only included whitespace. Check the values in your request and update any that contain only whitespace."
        case "parameter_invalid_string_empty":
            return "One or more required string values is empty. Make sure that string values contain at least one character."
        case "parameter_missing":
            return "One or more required values are missing."
        case "parameter_unknown":
            return "The request contains one or more unexpected parameters. Remove these and try again."
        case "parameters_exclusive":
            return "Two or more mutually exclusive parameters were provided."
        case "payment_intent_authentication_failure":
            return "The provided source has failed authentication. Provide source_data or a new source to attempt to fulfill this PaymentIntent again."
        case "payment_intent_incompatible_payment_method":
            return "The PaymentIntent expected a payment method with different properties than what was provided."
        case "payment_intent_invalid_parameter":
            return "One or more provided parameters was not allowed for the given operation on the PaymentIntent."
        case "payment_intent_payment_attempt_failed":
            return "The latest payment attempt for the PaymentIntent has failed."
        case "payment_intent_unexpected_state":
            return "The PaymentIntent’s state was incompatible with the operation you were trying to perform."
        case "payment_method_unactivated":
            return "The charge cannot be created as the payment method used has not been activated."
        case "payment_method_unexpected_state":
            return "The provided payment method’s state was incompatible with the operation you were trying to perform. Confirm that the payment method is in an allowed state for the given operation before attempting to perform it."
        case "payouts_not_allowed":
            return "Payouts have been disabled on the connected account."
        case "platform_api_key_expired":
            return "The API key provided by your Connect platform has expired. This occurs if your platform has either generated a new key or the connected account has been disconnected from the platform."
        case "postal_code_invalid":
            return "The ZIP code provided was incorrect."
        case "processing_error":
            return "An error occurred while processing the card. Check the card details are correct or use a different card."
        case "product_inactive":
            return "The product this SKU belongs to is no longer available for purchase."
        case "rate_limit":
            return "Too many requests hit the API too quickly."
        case "resource_already_exists":
            return "A resource with a user-specified ID (e.g., plan or coupon) already exists. Use a different, unique value for id and try again."
        case "resource_missing":
            return "The ID provided is not valid. Either the resource does not exist, or an ID for a different resource has been provided."
        case "routing_number_invalid":
            return "The bank routing number provided is invalid."
        case "secret_key_required":
            return "The API key provided is a publishable key, but a secret key is required."
        case "sepa_unsupported_account":
            return "Your account does not support SEPA payments."
        case "shipping_calculation_failed":
            return "Shipping calculation failed as the information provided was either incorrect or could not be verified."
        case "sku_inactive":
            return "The SKU is inactive and no longer available for purchase. Use a different SKU, or make the current SKU active again."
        case "state_unsupported":
            return "Occurs when providing the legal_entity information for a U.S. custom account, if the provided state is not supported. (This is mostly associated states and territories.)"
        case "tax_id_invalid":
            return "The tax ID number provided is invalid (e.g., missing digits). Tax ID information varies from country to country, but must be at least nine digits."
        case "taxes_calculation_failed":
            return "Tax calculation for the order failed."
        case "testmode_charges_only":
            return "Your account has not been activated and can only make test charges."
        case "tls_version_unsupported":
            return "Your integration is using an older version of TLS that is unsupported. You must be using TLS 1.2 or above."
        case "token_already_used":
            return "The token provided has already been used. You must create a new token before you can retry this request."
        case "token_in_use":
            return "The token provided is currently being used in another request. This occurs if your integration is making duplicate requests simultaneously."
        case "transfers_not_allowed":
            return "The requested transfer cannot be created."
        case "upstream_order_creation_failed":
            return "The order could not be created. Check the order details and then try again."
        case "url_invalid":
            return "The URL provided is invalid."
        default:
            return "Contact us if you are receiving this error."
    }
}