import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  ShieldCheck,
  ShieldX,
  CalendarX,
  SearchX,
  ScanLine,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import api, { photoUrl } from "../lib/axios";
import { useAuth } from "../lib/auth";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { Alert, Avatar, Button, Input, Spinner, cx } from "../components/ui";
import { capitalize, fmtCalendarDate, fmtLongDate, fmtTime } from "../lib/format";

const RESET_AFTER_MS = 10_000;

const OUTCOMES = {
  granted: {
    title: "Access granted",
    icon: ShieldCheck,
    band: "bg-success",
    soft: "bg-success-soft text-success",
  },
  revoked: {
    title: "Access denied",
    reason: "This ID has been revoked.",
    icon: ShieldX,
    band: "bg-danger",
    soft: "bg-danger-soft text-danger",
  },
  wrongdate: {
    title: "Access denied",
    icon: CalendarX,
    band: "bg-warning",
    soft: "bg-warning-soft text-warning",
  },
  notfound: {
    title: "ID not recognised",
    reason: "No record matches this ID number.",
    icon: SearchX,
    band: "bg-danger",
    soft: "bg-danger-soft text-danger",
  },
};

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right leading-tight hidden sm:block">
      <p className="text-sm font-semibold text-fg tabular-nums">{fmtTime(now)}</p>
      <p className="text-[11px] text-subtle">{fmtLongDate(now)}</p>
    </div>
  );
}

function ScannerViewport({ scanning, starting, onStart, onStop }) {
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#0b0c0f] border border-line">
      <div id="qr-reader" className={cx("absolute inset-0", !scanning && "invisible")} />

      {scanning && (
        <>
          {/* Corner frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-[58%] aspect-square">
              {["top-0 left-0 border-t-2 border-l-2 rounded-tl-lg", "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg"].map((c) => (
                <span key={c} className={cx("absolute w-7 h-7 border-white/90", c)} />
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb96b]" />
              Camera live
            </span>
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-md bg-black/55 hover:bg-black/70 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur"
            >
              <CameraOff size={13} />
              Stop
            </button>
          </div>
        </>
      )}

      {!scanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
            <ScanLine size={22} className="text-white/70" />
          </div>
          <p className="text-[15px] font-semibold text-white">Camera is off</p>
          <p className="text-[13px] text-white/55 mt-1 max-w-[260px]">
            Start the camera and hold the ID card's QR code inside the frame.
          </p>
          <Button variant="primary" size="lg" icon={Camera} className="mt-5" onClick={onStart} loading={starting}>
            Start camera
          </Button>
        </div>
      )}
    </div>
  );
}

function IdlePanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center mb-5">
        <ScanLine size={24} className="text-subtle" />
      </div>
      <p className="text-base font-semibold text-fg">Ready for the next person</p>
      <p className="text-sm text-muted mt-1.5 max-w-[300px]">
        Scan an ID card or enter the ID number. The result will appear here.
      </p>
      <ol className="mt-8 w-full max-w-[300px] text-left space-y-3">
        {[
          "Scan the QR code on the ID card",
          "Confirm the photo matches the person",
          "Allow entry only when access is granted",
        ].map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-[13px] text-muted">
            <span className="w-5 h-5 rounded-full bg-surface-2 border border-line text-[11px] font-semibold text-fg flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ResultPanel({ result, onReset }) {
  const o = OUTCOMES[result.status];
  const Icon = o.icon;
  const p = result.person;
  const reason =
    result.status === "wrongdate"
      ? `This visitor is scheduled for ${fmtCalendarDate(p?.expectedDate)}, not today.`
      : result.status === "notfound"
      ? `No record matches “${result.idNumber}”.`
      : o.reason;

  const details = p
    ? p.type === "staff"
      ? [
          ["Role", p.role],
          ["Department", p.department],
        ]
      : [
          ["Purpose", p.purpose],
          ["Host", p.hostName],
          ["Scheduled", p.expectedDate ? fmtCalendarDate(p.expectedDate) : "Any day"],
        ]
    : [];

  return (
    <div className="h-full flex flex-col animate-fade-in" aria-live="assertive">
      {/* Status band */}
      <div className={cx("px-6 py-5 text-white", o.band)}>
        <div className="flex items-center gap-3">
          <Icon size={28} strokeWidth={2.2} />
          <div>
            <p className="text-xl font-semibold tracking-tight">{o.title}</p>
            <p className="text-[13px] text-white/85">
              {result.status === "granted" ? `Checked in at ${fmtTime(result.at)}` : reason}
            </p>
          </div>
        </div>
      </div>

      {/* Person */}
      <div className="flex-1 px-6 py-6">
        {p ? (
          <>
            <div className="flex items-center gap-5">
              <Avatar person={p} src={photoUrl(p)} size="xl" square className="rounded-xl ring-1 ring-line" />
              <div className="min-w-0">
                <p className="text-xl font-semibold text-fg leading-tight break-words">{p.name}</p>
                <p className="text-sm text-muted mt-1">{capitalize(p.type)}</p>
                <p className="font-mono text-[13px] text-fg mt-2.5 tracking-wide">{p.idNumber}</p>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2.5 text-[13px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-fg text-right">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {result.status === "granted" && !p.hasPhoto && (
              <Alert tone="warning" icon={AlertCircle} className="mt-4">
                No photo on file. Verify identity with another document.
              </Alert>
            )}
          </>
        ) : (
          <div className={cx("rounded-lg px-4 py-3 text-[13px] font-medium", o.soft)}>
            Ask the person to contact the front office. Do not allow entry.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <Button variant="secondary" size="lg" className="w-full" onClick={onReset}>
          Next person
          <ArrowRight size={16} />
        </Button>
        <div className="mt-3 h-1 rounded-full bg-surface-3 overflow-hidden">
          <div
            key={result.at}
            className="h-full bg-line-strong origin-left"
            style={{ animation: `shrink ${RESET_AFTER_MS}ms linear forwards` }}
          />
        </div>
        <p className="text-[11px] text-subtle mt-1.5 text-center">Clears automatically</p>
      </div>
    </div>
  );
}

export default function CheckIn() {
  const { authenticated } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manualId, setManualId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const qrRef = useRef(null);
  const busyRef = useRef(false);

  const verify = useCallback(async (raw) => {
    const idNumber = raw.trim();
    if (!idNumber || busyRef.current) return;
    busyRef.current = true;
    setVerifying(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/logs", { idNumber });
      setResult({ status: "granted", person: res.data.person, at: res.data.log?.checkInTime || new Date().toISOString(), idNumber });
      setManualId("");
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;
      const at = new Date().toISOString();
      if (status === 404) setResult({ status: "notfound", person: null, at, idNumber });
      else if (status === 403)
        setResult({
          status: data?.message?.includes("not authorized for today") ? "wrongdate" : "revoked",
          person: data?.person,
          at,
          idNumber,
        });
      else if (status === 429) setError("Too many attempts. Wait a moment and try again.");
      else setError(data?.message || "Could not reach the server. Check the connection and try again.");
    } finally {
      busyRef.current = false;
      setVerifying(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    const qr = qrRef.current;
    qrRef.current = null;
    setScanning(false);
    if (qr) {
      try {
        await qr.stop();
        qr.clear();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const startScanner = async () => {
    setError("");
    setStarting(true);
    setScanning(true); // make the container visible so the library can measure it
    await new Promise((r) => requestAnimationFrame(() => r()));
    const qr = new Html5Qrcode("qr-reader", { verbose: false });
    qrRef.current = qr;
    try {
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.58); return { width: s, height: s }; } },
        (decoded) => {
          try {
            qr.pause(true);
          } catch {
            /* not running */
          }
          verify(decoded);
        },
        () => {}
      );
    } catch (err) {
      qrRef.current = null;
      setScanning(false);
      const msg = String(err?.message || err || "");
      setError(
        /permission|denied|NotAllowed/i.test(msg)
          ? "Camera permission was denied. Allow camera access in the browser settings."
          : "No camera available. Use manual entry instead."
      );
    } finally {
      setStarting(false);
    }
  };

  const reset = useCallback(() => {
    setResult(null);
    setError("");
    const qr = qrRef.current;
    if (qr) {
      try {
        qr.resume();
      } catch {
        /* not paused */
      }
    }
  }, []);

  // Auto-clear the result so the desk is ready for the next person.
  useEffect(() => {
    if (!result) return undefined;
    const t = setTimeout(reset, RESET_AFTER_MS);
    return () => clearTimeout(t);
  }, [result, reset]);

  useEffect(() => () => void stopScanner(), [stopScanner]);

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <header className="h-16 bg-surface border-b border-line">
        <div className="mx-auto max-w-[1200px] h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <Logo subtitle="Check-in desk" />
          <div className="flex items-center gap-4">
            <Clock />
            <div className="hidden sm:block w-px h-8 bg-line" />
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <Link
              to={authenticated ? "/admin" : "/login"}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium text-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              <KeyRound size={14} />
              {authenticated ? "Admin console" : "Admin"}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6 lg:py-10">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight text-fg">Verify identity</h1>
          <p className="text-sm text-muted mt-1">Every successful verification is recorded in the access log.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] items-start">
          {/* Left: input methods */}
          <div className="bg-surface border border-line rounded-xl shadow-xs p-4 sm:p-5">
            <ScannerViewport scanning={scanning} starting={starting} onStart={startScanner} onStop={stopScanner} />

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">or enter ID number</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify(manualId);
              }}
              className="flex gap-2"
            >
              <Input
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                placeholder="SCH-XXXXXXXX"
                aria-label="ID number"
                autoComplete="off"
                spellCheck={false}
                className="h-11 font-mono tracking-wide text-[15px]"
              />
              <Button type="submit" variant="primary" size="lg" loading={verifying} disabled={!manualId.trim()}>
                Verify
              </Button>
            </form>

            {error && (
              <Alert icon={AlertCircle} className="mt-4">
                {error}
              </Alert>
            )}
          </div>

          {/* Right: result */}
          <div className="bg-surface border border-line rounded-xl shadow-xs overflow-hidden lg:min-h-[560px] lg:sticky lg:top-6">
            {verifying ? (
              <div className="h-full min-h-[320px] lg:min-h-[560px] flex flex-col items-center justify-center gap-3">
                <Spinner size={26} />
                <p className="text-sm text-muted">Verifying…</p>
              </div>
            ) : result ? (
              <ResultPanel result={result} onReset={reset} />
            ) : (
              <IdlePanel />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
