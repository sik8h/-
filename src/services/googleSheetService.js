/**
 * Google Sheet API / GAS Service for Woojung Logistics
 */

export const GAS_URL = "https://script.google.com/macros/s/AKfycbz1GvHqsae_JspPAJpAGqX5Fs9hbhqrvW9QvnNvGzLBPdil3ckutmR_Xk0SUSeR4kKa_g/exec";

/**
 * Fetch VIP customer database from Google Sheets via Google Apps Script (GAS)
 */
export async function syncCustomersFromSheet() {
  if (!GAS_URL || GAS_URL.includes("YOUR_GAS_DEPLOYMENT_ID")) {
    console.log("[SheetSync] GAS URL is placeholder; using local default VIPs.");
    return null;
  }
  try {
    const response = await fetch(`${GAS_URL}?action=getCustomers`, {
      method: "GET",
      mode: "cors"
    });
    if (response.ok) {
      const data = await response.json();
      console.log("[SheetSync] Fetched customers from Google Sheet:", data);
      return data;
    }
  } catch (err) {
    console.warn("[SheetSync] Sync failed or offline:", err);
  }
  return null;
}

/**
 * Post shipment order record to Google Sheets via Google Apps Script (GAS)
 */
export async function logOrderToSheetAsync(order, customer) {
  if (!GAS_URL || GAS_URL.includes("YOUR_GAS_DEPLOYMENT_ID")) {
    console.log("[SheetSync] Logged order locally (GAS URL is placeholder):", order);
    return;
  }

  const payload = {
    action: "logOrder",
    order: {
      timestamp: new Date().toISOString(),
      store: order.store,
      carrier: order.carrier || "한진",
      boxType: order.boxType,
      fee: order.fee || "",
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      recipientAddr: order.recipientAddr,
      item: order.item,
      quantity: order.quantity
    },
    customer: customer ? {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      usedStore: customer.store
    } : null
  };

  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log("[SheetSync] Order posted to Google Sheet successfully.");
  } catch (err) {
    console.warn("[SheetSync] Failed to post order to Google Sheet:", err);
  }
}
