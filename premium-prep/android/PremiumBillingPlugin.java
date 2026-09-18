package com.msa.one.displayfit37;

import android.os.Bundle;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "MSABilling")
public class PremiumBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    // Activation script changes this copy to true only when PREMIUM_ACTIVATE=1.
    private static final boolean ACTIVE = false;
    private BillingClient billingClient;
    private PluginCall purchaseCall;
    private ProductDetails productDetails;

    @Override
    public void load() {
        if (ACTIVE) connect();
    }

    private void connect() {
        if (billingClient != null && billingClient.isReady()) return;
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {}
            @Override public void onBillingServiceDisconnected() {}
        });
    }

    private boolean rejectIfInactive(PluginCall call) {
        if (ACTIVE) return false;
        call.reject("PREMIUM_NOT_ACTIVE");
        return true;
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject out = new JSObject();
        out.put("prepared", true);
        out.put("active", ACTIVE);
        out.put("billingLibrary", "9.1.0");
        out.put("ready", ACTIVE && billingClient != null && billingClient.isReady());
        call.resolve(out);
    }

    @PluginMethod
    public void queryProduct(PluginCall call) {
        if (rejectIfInactive(call)) return;
        connect();
        String productId = call.getString("productId", "msa_one_premium");
        QueryProductDetailsParams.Product product =
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        QueryProductDetailsParams params =
            QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, result) -> {
            List<ProductDetails> list = result.getProductDetailsList();
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || list.isEmpty()) {
                call.reject("PRODUCT_UNAVAILABLE");
                return;
            }
            productDetails = list.get(0);
            JSObject out = new JSObject();
            out.put("productId", productDetails.getProductId());
            out.put("name", productDetails.getName());
            out.put("description", productDetails.getDescription());
            JSArray plans = new JSArray();
            List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
            if (offers != null) {
                for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                    JSObject p = new JSObject();
                    p.put("basePlanId", offer.getBasePlanId());
                    p.put("offerId", offer.getOfferId());
                    p.put("offerToken", offer.getOfferToken());
                    plans.put(p);
                }
            }
            out.put("plans", plans);
            call.resolve(out);
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        if (rejectIfInactive(call)) return;
        connect();
        if (productDetails == null) {
            call.reject("QUERY_PRODUCT_FIRST");
            return;
        }
        String basePlan = call.getString("basePlan", "monthly");
        String offerToken = null;
        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
        if (offers != null) {
            for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                if (basePlan.equals(offer.getBasePlanId())) {
                    offerToken = offer.getOfferToken();
                    break;
                }
            }
        }
        if (offerToken == null) {
            call.reject("BASE_PLAN_UNAVAILABLE");
            return;
        }

        BillingFlowParams.ProductDetailsParams productParams =
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build();
        BillingFlowParams flow =
            BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(productParams))
                .build();

        purchaseCall = call;
        BillingResult result = billingClient.launchBillingFlow(getActivity(), flow);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            purchaseCall = null;
            call.reject("BILLING_FLOW_FAILED_" + result.getResponseCode());
        }
    }

    @PluginMethod
    public void restore(PluginCall call) {
        if (rejectIfInactive(call)) return;
        connect();
        QueryPurchasesParams params =
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("RESTORE_FAILED_" + result.getResponseCode());
                return;
            }
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    call.resolve(purchaseToJS(purchase));
                    return;
                }
            }
            JSObject out = new JSObject();
            out.put("restored", false);
            call.resolve(out);
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = purchaseCall;
        purchaseCall = null;
        if (call == null) return;
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
            call.reject("PURCHASE_FAILED_" + result.getResponseCode());
            return;
        }
        Purchase purchase = purchases.get(0);
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            JSObject pending = purchaseToJS(purchase);
            pending.put("pending", true);
            call.resolve(pending);
            return;
        }
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            call.reject("PURCHASE_NOT_COMPLETED");
            return;
        }
        // Do not grant entitlement here. Return token to the web layer, which sends it
        // to the secure backend for Google Play verification/acknowledgement.
        call.resolve(purchaseToJS(purchase));
    }

    private JSObject purchaseToJS(Purchase purchase) {
        JSObject out = new JSObject();
        out.put("purchaseToken", purchase.getPurchaseToken());
        out.put("acknowledged", purchase.isAcknowledged());
        out.put("state", purchase.getPurchaseState());
        out.put("products", new JSArray(purchase.getProducts()));
        if (!purchase.getProducts().isEmpty()) out.put("productId", purchase.getProducts().get(0));
        return out;
    }
}
