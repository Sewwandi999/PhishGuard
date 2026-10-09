import React, { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";

import { enablePhishingNotifications, subscribePhishingAlerts } from "../utils/notifyPhishing.js";

export default function PhishingAlertBanner() {
  const [alert, setAlert] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );

  useEffect(() => {
    return subscribePhishingAlerts((detail) => {
      setAlert(detail);
    });
  }, []);

  const requestPermission = async () => {
    const result = await enablePhishingNotifications();
    setPermission(result);
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-slate-900">Phishing notifications</p>
          <p className="text-slate-600">
            Get an alert when a scanned email or SMS is classified as phishing.
          </p>
        </div>
        {permission === "granted" ? (
          <span className="inline-flex items-center gap-2 text-green-700">
            <Bell className="w-4 h-4" />
            Desktop alerts on
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void requestPermission()}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg"
          >
            <BellOff className="w-4 h-4" />
            Enable desktop alerts
          </button>
        )}
      </div>

      {alert ? (
        <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-red-900">{alert.title}</p>
            <p className="text-red-800 mt-1">{alert.body}</p>
            {alert.preview ? <p className="text-red-700 mt-1 break-words">{alert.preview}</p> : null}
          </div>
          <button type="button" onClick={() => setAlert(null)} className="text-red-700" aria-label="Dismiss alert">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
