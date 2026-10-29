import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, PlayCircle, Send } from "lucide-react";
import { siteSettingService } from "../../services/websiteService";
import { integrationService } from "../../services/integrationService";

const SETTING_TYPE = "sms_gateway";

const GATEWAYS = {
  ssl_wireless: {
    label: "SSL Wireless",
    description: "SSL Wireless plain API দিয়ে OTP/SMS পাঠাবে।",
    fields: [
      { key: "apiToken", label: "API Token", required: true, secret: true },
      { key: "sid", label: "SID", required: true },
    ],
  },
  bdbulksms: {
    label: "BulkSMSBD",
    description: "BulkSMSBD API key ও Sender ID দিয়ে OTP/SMS পাঠাবে।",
    fields: [
      { key: "apiKey", label: "API Key", required: true, secret: true },
      { key: "senderId", label: "Sender ID", required: true },
    ],
  },
  twilio: {
    label: "Twilio",
    description: "Twilio international SMS gateway।",
    fields: [
      { key: "accountSid", label: "Account SID", required: true },
      { key: "authToken", label: "Auth Token", required: true, secret: true },
      { key: "fromNumber", label: "From Number", required: true },
    ],
  },
};

const DEFAULT = {
  type: "ssl_wireless",
  status: true,
  orderConfirm: true,
  otpVerification: true,
  forgotPassword: true,
  passwordGenerator: true,
  apiToken: "",
  sid: "",
  username: "",
  password: "",
  token: "",
  senderId: "",
  accountSid: "",
  authToken: "",
  fromNumber: "",
};

function normalizeLoadedSettings(data = {}) {
  const type =
    data.type ||
    data.gatewayType ||
    (data.token || data.username || data.password ? "bdbulksms" : "") ||
    (data.accountSid || data.authToken ? "twilio" : "") ||
    "ssl_wireless";

  return {
    ...DEFAULT,
    ...data,
    type: GATEWAYS[type] ? type : "ssl_wireless",
    status: data.status !== false,
    apiToken: data.apiToken || data.apiKey || "",
    apiKey: data.apiKey || data.api_key || data.token || data.apiToken || data.password || "",
    token: data.token || data.apiKey || data.api_key || data.apiToken || data.password || "",
    senderId: data.senderId || data.senderid || "",
  };
}

export default function SmsGatewayPage() {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const gateway = GATEWAYS[form.type] || GATEWAYS.ssl_wireless;
  const activeFields = useMemo(() => gateway.fields, [gateway]);

  useEffect(() => {
    siteSettingService
      .get(SETTING_TYPE)
      .then((res) => {
        if (res.data?.data) setForm(normalizeLoadedSettings(res.data.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    const payload = {
      type: form.type,
      status: form.status,
      orderConfirm: form.orderConfirm,
      otpVerification: form.otpVerification,
      forgotPassword: form.forgotPassword,
      passwordGenerator: form.passwordGenerator,
    };

    activeFields.forEach((field) => {
      payload[field.key] = String(form[field.key] || "").trim();
    });

    return payload;
  }

  function validatePayload(payload) {
    const missing = activeFields
      .filter((field) => field.required && !payload[field.key])
      .map((field) => field.label);
    if (!payload.type) missing.push("Gateway");
    if (missing.length) return `${missing.join(", ")} required`;
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = buildPayload();
    const validationError = validatePayload(payload);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await siteSettingService.upsert(SETTING_TYPE, payload);
      setSuccess("SMS gateway settings saved. OTP এখন এই gateway দিয়ে যাবে।");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    const payload = buildPayload();
    const validationError = validatePayload(payload);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setTesting(true);
    setError("");
    setSuccess("");
    try {
      await siteSettingService.upsert(SETTING_TYPE, payload);
      await integrationService.test("sms", payload.type, payload);
      setSuccess("SMS configuration is ready.");
    } catch (err) {
      setError(err.message || "SMS configuration test failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">SMS Gateway</h1>
          <p className="mt-1 text-xs text-gray-500">
            OTP, order confirm এবং account SMS-এর gateway এখানে set করুন।
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
        >
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5 grid gap-3 lg:grid-cols-3">
            {Object.entries(GATEWAYS).map(([key, item]) => (
              <button
                type="button"
                key={key}
                onClick={() => setField("type", key)}
                className={`rounded-lg border p-4 text-left transition ${
                  form.type === key
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <MessageSquare
                    size={16}
                    className={form.type === key ? "text-teal-600" : "text-gray-400"}
                  />
                  {item.label}
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Field label="Gateway Status">
              <Toggle checked={form.status} onChange={() => setField("status", !form.status)} />
            </Field>
            <Field label="Order OTP">
              <Toggle
                checked={form.otpVerification}
                onChange={() => setField("otpVerification", !form.otpVerification)}
              />
            </Field>
            <Field label="Order Confirm SMS">
              <Toggle
                checked={form.orderConfirm}
                onChange={() => setField("orderConfirm", !form.orderConfirm)}
              />
            </Field>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {activeFields.map((field) => (
              <Field key={field.key} label={field.label} required={field.required}>
                <TextInput
                  type={field.secret ? "password" : "text"}
                  value={form[field.key]}
                  onChange={(v) => setField(field.key, v)}
                />
              </Field>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <Field label="Forgot Password SMS">
              <Toggle
                checked={form.forgotPassword}
                onChange={() => setField("forgotPassword", !form.forgotPassword)}
              />
            </Field>
            <Field label="Password Generator SMS">
              <Toggle
                checked={form.passwordGenerator}
                onChange={() => setField("passwordGenerator", !form.passwordGenerator)}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send size={15} />
              {testing ? "Testing..." : "Test Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({ type = "text", value, onChange }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-8 w-[58px] items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-sky-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
