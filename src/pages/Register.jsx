import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, X, AlertCircle, CheckCircle2, Printer, UserPlus, Briefcase, CalendarClock } from "lucide-react";
import api from "../lib/axios";
import IDCard from "../components/IDCard";
import { Alert, Button, ButtonLink, Card, Field, Input, PageHeader, cx } from "../components/ui";

const EMPTY = {
  name: "",
  type: "staff",
  role: "",
  department: "",
  purpose: "",
  hostName: "",
  expectedDate: "",
};

const MAX_PHOTO = 4 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function TypeOption({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex-1 text-left rounded-lg border px-4 py-3 transition-colors",
        active ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line hover:border-line-strong bg-surface"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={active ? "text-accent" : "text-muted"} />
        <span className="text-sm font-semibold text-fg">{title}</span>
      </div>
      <p className="text-xs text-muted mt-1">{description}</p>
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)] py-6 first:pt-0 last:pb-0">
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="text-[13px] text-muted mt-1">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const fileRef = useRef(null);

  // Release the object URL when the preview changes or the page unmounts.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const pickPhoto = (file) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, photo: "Use a JPEG, PNG or WebP image." }));
      return;
    }
    if (file.size > MAX_PHOTO) {
      setErrors((er) => ({ ...er, photo: "Photo must be 4 MB or smaller." }));
      return;
    }
    setErrors((er) => ({ ...er, photo: undefined }));
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    setForm(EMPTY);
    clearPhoto();
    setErrors({});
    setSubmitError("");
    setCreated(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (form.type === "visitor" && !form.hostName.trim()) next.hostName = "Who is the visitor here to see?";
    setErrors(next);
    if (Object.keys(next).length) return;

    const data = new FormData();
    const fields = form.type === "staff" ? ["name", "type", "role", "department"] : ["name", "type", "purpose", "hostName", "expectedDate"];
    fields.forEach((k) => form[k] && data.append(k, form[k].trim()));
    if (photo) data.append("photo", photo);

    setLoading(true);
    setSubmitError("");
    try {
      const res = await api.post("/people", data);
      setCreated(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Success ─────────────── */
  if (created) {
    return (
      <>
        <PageHeader title="Register person" description="Issue a new staff or visitor ID card" />
        <Card className="p-6 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div>
              <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-fg mt-5">ID card issued</h2>
              <p className="text-sm text-muted mt-1.5 max-w-md">
                <span className="text-fg font-medium">{created.name}</span> is registered as a{" "}
                {created.type === "staff" ? "staff member" : "visitor"} and can check in now
                {created.type === "visitor" && created.expectedDate ? " on their scheduled date" : ""}.
              </p>
              <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5">
                <span className="text-xs text-muted">ID number</span>
                <span className="font-mono text-[15px] font-semibold tracking-wide text-fg">{created.idNumber}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-8">
                <Button variant="primary" icon={Printer} onClick={() => window.print()}>
                  Print card
                </Button>
                <Button icon={UserPlus} onClick={reset}>
                  Register another
                </Button>
                <ButtonLink to="/admin/people" variant="ghost">
                  View directory
                </ButtonLink>
              </div>
            </div>
            <div className="flex justify-center">
              <IDCard person={created} photoSrc={preview} />
            </div>
          </div>
        </Card>
      </>
    );
  }

  /* ─────────────── Form ─────────────── */
  const isStaff = form.type === "staff";
  const draft = { ...form, status: "active", idNumber: null };

  return (
    <>
      <PageHeader
        title="Register person"
        description="Issue a new staff or visitor ID card"
        actions={
          <Link to="/admin/people" className="text-[13px] font-medium text-muted hover:text-fg">
            Cancel
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] items-start">
        <Card>
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 sm:p-6 divide-y divide-line">
              <Section title="Person type" description="Visitors can only check in on their scheduled date.">
                <div className="flex flex-col sm:flex-row gap-3">
                  <TypeOption
                    active={isStaff}
                    icon={Briefcase}
                    title="Staff"
                    description="Teachers, admin and support staff"
                    onClick={() => setForm((f) => ({ ...f, type: "staff" }))}
                  />
                  <TypeOption
                    active={!isStaff}
                    icon={CalendarClock}
                    title="Visitor"
                    description="Parents, contractors and guests"
                    onClick={() => setForm((f) => ({ ...f, type: "visitor" }))}
                  />
                </div>
              </Section>

              <Section title="Photo" description="Shown at the check-in desk to confirm identity.">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    pickPhoto(e.dataTransfer.files?.[0]);
                  }}
                  className={cx(
                    "flex items-center gap-4 rounded-lg border border-dashed p-4",
                    errors.photo ? "border-danger" : "border-line-strong"
                  )}
                >
                  <div className="w-16 h-20 rounded-md overflow-hidden bg-surface-3 shrink-0 flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={18} className="text-subtle" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-fg font-medium truncate">
                      {photo ? photo.name : "Drag a photo here, or browse"}
                    </p>
                    <p className="text-xs text-subtle mt-0.5">JPEG, PNG or WebP · max 4 MB · portrait works best</p>
                    <div className="flex gap-2 mt-2.5">
                      <Button size="sm" onClick={() => fileRef.current?.click()}>
                        {photo ? "Replace" : "Choose file"}
                      </Button>
                      {photo && (
                        <Button size="sm" variant="ghost" icon={X} onClick={clearPhoto}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                </div>
                {errors.photo && <p className="text-xs text-danger mt-1.5">{errors.photo}</p>}
              </Section>

              <Section title="Details" description={isStaff ? "Printed on the staff card." : "Used to verify the visit."}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required htmlFor="name" error={errors.name} className="sm:col-span-2">
                    <Input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Adaeze Okafor" autoComplete="off" />
                  </Field>

                  {isStaff ? (
                    <>
                      <Field label="Role" htmlFor="role">
                        <Input id="role" value={form.role} onChange={set("role")} placeholder="e.g. Mathematics teacher" />
                      </Field>
                      <Field label="Department" htmlFor="department">
                        <Input id="department" value={form.department} onChange={set("department")} placeholder="e.g. Sciences" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Host" required htmlFor="hostName" error={errors.hostName}>
                        <Input id="hostName" value={form.hostName} onChange={set("hostName")} placeholder="Person being visited" />
                      </Field>
                      <Field label="Scheduled date" htmlFor="expectedDate" hint="Leave empty to allow any day.">
                        <Input
                          id="expectedDate"
                          type="date"
                          value={form.expectedDate}
                          min={new Date().toLocaleDateString("en-CA")}
                          onChange={set("expectedDate")}
                        />
                      </Field>
                      <Field label="Purpose of visit" htmlFor="purpose" className="sm:col-span-2">
                        <Input id="purpose" value={form.purpose} onChange={set("purpose")} placeholder="e.g. Parent–teacher meeting" />
                      </Field>
                    </>
                  )}
                </div>
              </Section>
            </div>

            {submitError && (
              <div className="px-5 sm:px-6 pb-4">
                <Alert icon={AlertCircle}>{submitError}</Alert>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-line bg-surface-2/50 rounded-b-xl">
              <Button variant="ghost" onClick={reset} disabled={loading}>
                Reset
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Register and issue card
              </Button>
            </div>
          </form>
        </Card>

        <div className="xl:sticky xl:top-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle mb-3">Card preview</p>
          <div className="rounded-xl border border-line bg-surface-2 py-8 flex justify-center">
            <IDCard person={draft} photoSrc={preview} preview />
          </div>
          <p className="text-xs text-subtle mt-3">The ID number and QR code are generated on registration.</p>
        </div>
      </div>
    </>
  );
}
