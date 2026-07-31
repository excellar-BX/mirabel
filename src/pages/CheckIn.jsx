import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { gsap } from "gsap";
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import IDCard from "../components/IDCard";
import api from "../lib/axios";

const statusConfig = {
  valid: {
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    iconColor: "text-green-400",
    icon: CheckCircle2,
    label: "Access Granted",
    labelColor: "text-green-400",
  },
  revoked: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
    icon: XCircle,
    label: "ID Revoked — Access Denied",
    labelColor: "text-red-400",
  },
  notfound: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
    icon: AlertTriangle,
    label: "ID Not Found",
    labelColor: "text-amber-400",
  },
  wrongdate: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    iconColor: "text-orange-400",
    icon: AlertTriangle,
    label: "Wrong Date — Access Denied",
    labelColor: "text-orange-400",
  },
};

export default function CheckIn() {
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const headerRef = useRef(null);
  const scanBoxRef = useRef(null);
  const manualBoxRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
    )
      .fromTo(
        scanBoxRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
        "-=0.2"
      )
      .fromTo(
        manualBoxRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
        "-=0.2"
      );
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { scale: 0.95, opacity: 0, y: 16 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" }
      );
    }
  }, [result]);

  const verify = async (idNumber) => {
    if (!idNumber.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/logs", { idNumber: idNumber.trim() });
      setResult({ person: res.data.person, status: "valid" });
    } catch (err) {
      const person = err.response?.data?.person;
      const message = err.response?.data?.message;
      if (err.response?.status === 404) {
        setResult({ person: null, status: "notfound" });
      } else if (err.response?.status === 403) {
        // Check if it's a wrong date error
        if (message && message.includes("not authorized for today")) {
          setResult({ person, status: "wrongdate" });
        } else {
          setResult({ person, status: "revoked" });
        }
      } else {
        setError(message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    console.log("Starting scanner...");
    setScanning(true);
    setResult(null);
    setError("");
    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("DOM updated, creating Html5Qrcode...");
    const html5Qr = new Html5Qrcode("qr-reader");
    html5QrRef.current = html5Qr;
    try {
      console.log("Starting camera with facingMode: environment");
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopScanner();
          await verify(decodedText);
        },
        () => {}
      );
      console.log("Camera started successfully");
    } catch (err) {
      console.error("Camera error:", err);
      setError(`Camera error: ${err?.message || "Access denied or not available"}`);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div ref={headerRef} className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 bg-pink-500 rounded-full" />
          <h1 className="text-2xl font-bold text-white">Check-In Desk</h1>
        </div>
        <p className="text-sm text-gray-500 ml-4">
          Scan a QR code or enter an ID manually to verify access
        </p>
      </div>

      {/* Scanner Box */}
      <div
        ref={scanBoxRef}
        className="bg-gray-900 border border-white/5 rounded-2xl p-5 mb-4"
      >
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">
          Camera Scan
        </p>

        <div
          id="qr-reader"
          className={`${scanning ? "mb-4 rounded-xl overflow-hidden" : "invisible"}`}
        />

        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full bg-pink-600 hover:bg-pink-500 active:bg-pink-700 py-3 rounded-xl 
              font-medium flex items-center justify-center gap-2.5 transition-colors text-sm"
          >
            <Camera size={16} />
            Start Camera Scan
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-xl 
              font-medium flex items-center justify-center gap-2.5 transition-colors text-sm text-gray-300"
          >
            <CameraOff size={16} />
            Stop Scanner
          </button>
        )}
      </div>

      {/* Manual Entry */}
      <div
        ref={manualBoxRef}
        className="bg-gray-900 border border-white/5 rounded-2xl p-5 mb-4"
      >
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">
          Manual Entry
        </p>
        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify(manualId)}
            placeholder="e.g. SCH-A1B2C3D4"
            className="flex-1 bg-gray-800 border border-white/5 rounded-xl px-4 py-2.5 
              text-sm font-mono outline-none focus:ring-2 focus:ring-pink-500/50 
              focus:border-pink-500/50 transition-all placeholder-gray-600"
          />
          <button
            onClick={() => verify(manualId)}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 
              px-5 py-2.5 rounded-xl text-sm font-medium transition-colors 
              flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            {loading ? "Checking" : "Verify"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 
          px-4 py-3 rounded-xl mb-4 flex items-center gap-2.5 text-sm">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (() => {
        const cfg = statusConfig[result.status];
        const Icon = cfg.icon;
        return (
          <div
            ref={resultRef}
            className={`border ${cfg.border} ${cfg.bg} rounded-2xl p-5 mb-4`}
          >
            {/* Status banner */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-xl bg-gray-900/60 ${cfg.iconColor}`}>
                <Icon size={20} />
              </div>
              <span className={`font-bold text-base ${cfg.labelColor}`}>
                {cfg.label}
              </span>
            </div>

            {result.person && (
              <div className="flex justify-center mb-4">
                <IDCard person={result.person} />
              </div>
            )}

            <button
              onClick={() => { setResult(null); setManualId(""); }}
              className="w-full bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl 
                text-sm transition-colors flex items-center justify-center gap-2 
                text-gray-300 font-medium"
            >
              <RotateCcw size={14} />
              Clear and Scan Again
            </button>
          </div>
        );
      })()}
    </div>
  );
}