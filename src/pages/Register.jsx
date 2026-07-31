import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  UserPlus,
  Upload,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import api from "../lib/axios";

const initialState = {
  name: "",
  type: "staff",
  role: "",
  department: "",
  purpose: "",
  hostName: "",
  expectedDate: "",
};

function Field({ label, ...props }) {
  return (
    <div>
      {label && (
        <label className="text-xs text-gray-500 mb-1.5 block font-medium uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className="w-full bg-gray-800 border border-white/5 rounded-xl px-4 py-2.5 
          text-sm outline-none focus:ring-2 focus:ring-pink-500/50 
          focus:border-pink-500/40 transition-all placeholder-gray-600 text-white"
        {...props}
      />
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState(initialState);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const headerRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
    ).fromTo(
      formRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
      "-=0.2"
    );
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    if (!form.name.trim()) return setError("Full name is required");

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    if (photo) data.append("photo", photo);

    try {
      setLoading(true);
      const res = await api.post("/people", data);
      setResult(res.data);
      setForm(initialState);
      setPhoto(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isStaff = form.type === "staff";

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div ref={headerRef} className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 bg-pink-500 rounded-full" />
          <h1 className="text-2xl font-bold text-white">Register Person</h1>
        </div>
        <p className="text-sm text-gray-500 ml-4">
          Create a new staff or visitor ID
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 
          px-4 py-3 rounded-xl mb-4 flex items-center gap-2.5 text-sm">
          <XCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 
          px-4 py-3 rounded-xl mb-4 flex items-center gap-2.5 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>
            Registered successfully. ID:{" "}
            <span className="font-mono font-bold">{result.idNumber}</span>
          </span>
        </div>
      )}

      {/* Form Card */}
      <div
        ref={formRef}
        className="bg-gray-900 border border-white/5 rounded-2xl p-6 space-y-5"
      >
        {/* Type Toggle */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-widest">
            Person Type
          </p>
          <div className="flex gap-2 p-1 bg-gray-800 rounded-xl">
            {["staff", "visitor"].map((t) => (
              <button
                key={t}
                onClick={() => setForm((p) => ({ ...p, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                  form.type === t
                    ? "bg-pink-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-widest">
            Photo
          </p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={26} className="text-gray-600" />
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 
                bg-gray-800 border border-white/5 hover:bg-gray-700 hover:border-white/10
                text-sm px-4 py-2.5 rounded-xl transition-all text-gray-300 font-medium">
                <Upload size={14} />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </label>
              <p className="text-xs text-gray-600 mt-1.5">
                JPG, PNG, WEBP up to 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Common Field */}
        <Field
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          label="Full Name *"
        />

        {/* Staff Fields */}
        {isStaff && (
          <>
            <Field
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="e.g. Teacher, Security Guard"
              label="Role"
            />
            <Field
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Sciences, Admin"
              label="Department"
            />
          </>
        )}

        {/* Visitor Fields */}
        {!isStaff && (
          <>
            <Field
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Reason for visiting"
              label="Purpose of Visit"
            />
            <Field
              name="hostName"
              value={form.hostName}
              onChange={handleChange}
              placeholder="Name of person being visited"
              label="Host Name"
            />
            <Field
              type="date"
              name="expectedDate"
              value={form.expectedDate}
              onChange={handleChange}
              label="Expected Date"
            />
          </>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-500 active:bg-pink-700 
            disabled:opacity-40 py-3 rounded-xl font-medium transition-colors 
            flex items-center justify-center gap-2 text-sm mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Register
            </>
          )}
        </button>
      </div>
    </div>
  );
}