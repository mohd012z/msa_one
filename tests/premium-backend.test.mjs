import assert from 'node:assert/strict';
import {entitlementFromSubscription} from '../premium-prep/backend/google-play.mjs';

let e=entitlementFromSubscription({
  subscriptionState:'SUBSCRIPTION_STATE_ACTIVE',
  acknowledgementState:'ACKNOWLEDGEMENT_STATE_PENDING',
  lineItems:[{productId:'msa_one_premium',expiryTime:'2027-01-01T00:00:00Z'}]
});
assert.equal(e.verified,true);
assert.equal(e.plan,'premium');
assert.ok(e.capabilities.includes('advanced-ai'));

e=entitlementFromSubscription({
  subscriptionState:'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
  lineItems:[{productId:'msa_one_premium'}]
});
assert.equal(e.verified,true,'grace period retains entitlement');

e=entitlementFromSubscription({
  subscriptionState:'SUBSCRIPTION_STATE_ON_HOLD',
  lineItems:[{productId:'msa_one_premium'}]
});
assert.equal(e.verified,false,'on-hold subscription must not receive entitlement');

console.log('Google Play backend entitlement mapping contract passed');
