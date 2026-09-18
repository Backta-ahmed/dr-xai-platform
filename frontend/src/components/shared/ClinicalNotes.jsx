import React, { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import Card, { CardHeading } from "../ui/Card";
import api, { errorMessage } from "../../api/axios";

const MAX_LENGTH = 5000;

/**
 * The reading clinician's own assessment, recorded against a diagnosis.
 *
 * The platform is a second reader: it offers a grade the ophthalmologist
 * verifies against the image. Until now there was nowhere to record the
 * verdict that actually matters — the specialist's own. The column and the
 * PATCH endpoint both existed; nothing in the interface reached them.
 *
 * Saved explicitly rather than on blur. This text lands on a signed report, so
 * committing it should be a decision, not a side effect of clicking away.
 */
const ClinicalNotes = ({ diagnosisId, value, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setDraft(value ?? "");
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    const next = draft.trim();
    try {
      // Empty string rather than null so clearing notes is expressible.
      const res = await api.patch(`/diagnosis/${diagnosisId}`, { notes: next || null });
      onSaved?.(res.data);
      setEditing(false);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your notes."));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card padding="sm">
        <CardHeading
          as="h3"
          action={
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil size={13} aria-hidden="true" />
              {value ? "Edit" : "Add"}
            </Button>
          }
        >
          Your assessment
        </CardHeading>
        {value ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{value}</p>
        ) : (
          <p className="text-sm leading-relaxed text-gray-600">
            No assessment recorded. Your notes appear on the exported report.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <CardHeading as="h3">Your assessment</CardHeading>
      <label htmlFor="clinical-notes" className="sr-only">
        Clinical notes
      </label>
      <textarea
        id="clinical-notes"
        ref={textareaRef}
        rows={6}
        maxLength={MAX_LENGTH}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        placeholder="Findings, agreement or disagreement with the model, and any follow-up."
        className="block w-full rounded-control border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed shadow-sm transition-colors placeholder:text-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="tabular text-2xs text-gray-600">
          {draft.length} / {MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={cancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ClinicalNotes;
