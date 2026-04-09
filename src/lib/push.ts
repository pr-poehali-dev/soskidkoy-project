import func2url from "../../backend/func2url.json";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(adminId: number): Promise<boolean> {
  console.log("[Push] Starting subscription for admin:", adminId);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] Service Worker or PushManager not supported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("[Push] Permission:", permission);
    if (permission !== "granted") {
      return false;
    }

    const keyRes = await fetch(func2url["push-subscribe"]);
    const keyData = await keyRes.json();
    const vapidPublicKey = keyData.vapid_public_key;
    console.log("[Push] VAPID key received:", vapidPublicKey ? "yes" : "no");
    if (!vapidPublicKey) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("[Push] SW ready, scope:", registration.scope);

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("[Push] Reusing existing subscription");
    }

    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subJson = subscription.toJSON();
    console.log("[Push] Endpoint:", subJson.endpoint);

    const res = await fetch(func2url["push-subscribe"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || "",
        auth_key: subJson.keys?.auth || "",
        admin_id: adminId,
      }),
    });

    const data = await res.json();
    console.log("[Push] Saved:", data);
    return data.success === true;
  } catch (err) {
    console.error("[Push] Error:", err);
    return false;
  }
}