import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import * as signalR from "@microsoft/signalr";
import {
  SwalConfirm,
  SwalSuccess,
  SwalError,
  ToastError,
} from "../../../utils/SwalAlert";
import { getTeacherObsFormRef } from "../../../API/ReferencesAPI";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  createTeacherObsFormValidation,
  CreateTeacherObsFormAsync,
  createLessonSurveyFormValidation,
  createLessonSurveyFormAsync,
  getTeacherFilledFormListAsync,
  getObservationDetailsByID,
} from "../../../API/TeacherPerformanceAPI";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const Icon = ({ name, className = "" }) => (
  <i className={`fa-solid fa-${name} ${className}`} />
);

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

const textareaClass =
  "min-h-[100px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

const errorInputClass =
  "w-full rounded-lg border border-red-400 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50";

const RATING_DESCRIPTORS = {
  5: {
    short: "Outstanding",
    detail:
      "Evaluate their strengths and weaknesses accurately. Take targeted actions to improve.",
  },
  4: {
    short: "Very Good",
    detail: "Know their strengths and weaknesses and act purposely to improve.",
  },
  3: {
    short: "Good",
    detail:
      "Know there are strengths and weaknesses and take steps to improve.",
  },
  2: {
    short: "Acceptable",
    detail: "Passive learners know how to improve their work in general terms.",
  },
  1: {
    short: "Weak",
    detail:
      "Rarely reflect on their learning and are unsure how to improve their work.",
  },
};

// ─────────────────────────────────────────────
// SAVING STEPS
// ─────────────────────────────────────────────
const SAVING_STEPS = [
  { key: "validating", label: "Validating form data...", icon: "circle-check" },
  { key: "submitting", label: "Saving to database...", icon: "database" },
  { key: "notifying", label: "Broadcasting update...", icon: "satellite-dish" },
  { key: "done", label: "Complete!", icon: "check" },
];

// ─────────────────────────────────────────────
// FORM DATA MAPPERS
// Converts camelCase form state → PascalCase DTO keys
// Numeric fields sent as byte (0 fallback, never empty string)
// ─────────────────────────────────────────────
const toSurveyFormData = (form, schoolYear) => {
  const fd = new FormData();
  const s = (v) => v ?? "";

  // Include Term + AcadYear just like observation does
  fd.append("Term", String(schoolYear?.currentTerm ?? 0));
  fd.append("AcadYear", String(schoolYear?.currentAcadYear ?? 0));

  fd.append("SurveyDate", s(form.surveyDate));
  fd.append("PerformanceManagerName", s(form.performanceManagerName));
  fd.append("TeacherName", s(form.teacherName));
  fd.append("TeacherID", s(form.teacherID)); // match exact casing your backend expects
  fd.append("GeneralObservations", s(form.generalObservations));
  fd.append(
    "QualityOfResponseToStudentsWork",
    s(form.qualityOfResponseToStudentsWork),
  );
  fd.append(
    "QualityOfContributionToSchoolLife",
    s(form.qualityOfContributionToSchoolLife),
  );

  return fd;
};

const toObservationFormData = (form, schoolYear) => {
  const fd = new FormData();
  const b = (v) => (v === "" || v == null ? "0" : String(v));
  const s = (v) => v ?? "";

  fd.append("Term", String(schoolYear?.currentTerm ?? 0));
  fd.append("AcadYear", String(schoolYear?.currentAcadYear ?? 0));

  fd.append("JointObserverID", s(form.jointObserverID));
  fd.append("JointObserverName", s(form.jointObserverName));
  fd.append("ObservationDate", s(form.observationDate));
  fd.append("ObserverName", s(form.observerName));
  fd.append("TeacherIDBeingObs", s(form.teacherID));
  fd.append("TeacherNameBeingObs", s(form.teacherName));
  fd.append("LessonNumber", s(form.lessonNumber));
  fd.append("YearGroupSection", s(form.yearGroupSection));
  fd.append("Subject", s(form.subject));
  fd.append("Topic", s(form.topic));
  fd.append("NoOfStudents", b(form.noOfStudents));
  fd.append("NoOfGT", b(form.noOfGT));
  fd.append("NoOfSOD", b(form.noOfSOD));
  fd.append("NoOfEmirati", b(form.noOfEmirati));
  fd.append("LearningObjective", s(form.learningObjective));

  fd.append("TS_SubjectKnowledge", b(form.ts_subjectKnowledge));
  fd.append("TS_LessonPlanning", b(form.ts_lessonPlanning));
  fd.append("TS_LearningEnvironment", b(form.ts_learningEnvironment));
  fd.append("TS_Interactions", b(form.ts_interactions));
  fd.append("TS_IndividualNeeds", b(form.ts_individualNeeds));
  fd.append("TS_Expectations", b(form.ts_expectations));
  fd.append("TS_CriticalThinking", b(form.ts_criticalThinking));
  fd.append("TeachersKnowledgeSupport", b(form.teachersKnowledgeSupport));

  fd.append("LS_Responsibility", b(form.ls_responsibility));
  fd.append("LS_StrengthsWeaknesses", b(form.ls_strengthsWeaknesses));
  fd.append("LS_Interaction", b(form.ls_interaction));
  fd.append("LS_Communication", b(form.ls_communication));
  fd.append("LS_Connections", b(form.ls_connections));
  fd.append("LS_Innovation", b(form.ls_innovation));
  fd.append("LS_Technology", b(form.ls_technology));
  fd.append("LS_CriticalThinking", b(form.ls_criticalThinking));

  fd.append("InternalAssessment", b(form.internalAssessment));
  fd.append("AssessmentInfluence", b(form.assessmentInfluence));
  fd.append("AssessmentAnalysis", b(form.assessmentAnalysis));

  fd.append("QT_Attainment", b(form.qt_attainment));
  fd.append("QT_ProgressInLesson", b(form.qt_progressInLesson));
  fd.append("QT_ProgressGroups", b(form.qt_progressGroups));

  fd.append("Wellbeing", b(form.wellbeing));
  fd.append("Benchmarking", b(form.benchmarking));

  fd.append("TeacherReflection", s(form.teacherReflection));
  fd.append("NeedsForImprovement", s(form.needsForImprovement));
  fd.append("OverallStrengths", s(form.overallStrengths));

  fd.append("OverallRating", b(form.overallRating));
  fd.append("ClearProgress", b(form.clearProgress));
  fd.append("DemandOnStudents", b(form.demandOnStudents));
  fd.append("EffectivePlenary", b(form.effectivePlenary));

  return fd;
};

// ─────────────────────────────────────────────
// FORM STATE — OBSERVATION
// ─────────────────────────────────────────────
const OBSERVATION_INITIAL = {
  observationDate: "",
  observerName: "",
  teacherName: "",
  teacherID: "",
  jointObserverName: "",
  jointObserverID: "",
  lessonNumber: "",
  yearGroupSection: "",
  subject: "",
  topic: "",
  noOfStudents: "",
  noOfGT: "",
  noOfSOD: "",
  noOfEmirati: "",
  learningObjective: "",
  ts_subjectKnowledge: "",
  ts_lessonPlanning: "",
  ts_learningEnvironment: "",
  ts_interactions: "",
  ts_individualNeeds: "",
  ts_expectations: "",
  ts_criticalThinking: "",
  teachersKnowledgeSupport: "",
  ls_responsibility: "",
  ls_strengthsWeaknesses: "",
  ls_interaction: "",
  ls_communication: "",
  ls_connections: "",
  ls_innovation: "",
  ls_technology: "",
  ls_criticalThinking: "",
  internalAssessment: "",
  assessmentInfluence: "",
  assessmentAnalysis: "",
  qt_attainment: "",
  qt_progressInLesson: "",
  qt_progressGroups: "",
  wellbeing: "",
  benchmarking: "",
  teacherReflection: "",
  needsForImprovement: "",
  overallStrengths: "",
  overallRating: "",
  clearProgress: "",
  demandOnStudents: "",
  effectivePlenary: "",
};

const OBSERVATION_REQUIRED = Object.keys(OBSERVATION_INITIAL);

// ─────────────────────────────────────────────
// FORM STATE — SURVEY
// ─────────────────────────────────────────────
const SURVEY_INITIAL = {
  surveyDate: "",
  performanceManagerName: "",
  teacherName: "",
  teacherID: "",
  generalObservations: "",
  qualityOfResponseToStudentsWork: "",
  qualityOfContributionToSchoolLife: "",
};

const SURVEY_REQUIRED = Object.keys(SURVEY_INITIAL);

// ─────────────────────────────────────────────
// SAVING OVERLAY MODAL
// ─────────────────────────────────────────────
function SavingOverlay({ currentStep }) {
  const stepIndex = SAVING_STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-green-700 to-green-500" />
        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Icon name="spinner" className="fa-spin text-green-700 text-lg" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Processing submission
              </p>
              <p className="text-xs text-slate-500">
                Please wait, do not close this window
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {SAVING_STEPS.map((step, i) => {
              const isDone = i < stepIndex;
              const isActive = i === stepIndex;
              const isPending = i > stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs transition-all ${
                      isDone
                        ? "bg-green-700 text-white"
                        : isActive
                          ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <Icon name="check" className="text-[10px]" />
                    ) : isActive ? (
                      <Icon name="spinner" className="fa-spin text-[10px]" />
                    ) : (
                      <Icon name={step.icon} className="text-[10px]" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone
                        ? "text-green-700 line-through opacity-60"
                        : isActive
                          ? "font-semibold text-slate-800"
                          : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VIEW DETAILS MODAL
// ─────────────────────────────────────────────
function ViewDetailsModal({ record, onClose, ratingLabels }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getObservationDetailsByID(
          record.idx,
          record.formType,
        );
        setDetails(data);
      } catch (e) {
        setError("Failed to load record details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [record.id]);

  const getRatingLabel = (val) =>
    val
      ? `${val} – ${ratingLabels?.[val] ?? RATING_DESCRIPTORS[val]?.short ?? val}`
      : "—";

  const DetailRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-800">{value || "—"}</span>
    </div>
  );

  const RatingRow = ({ label, value }) => (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="flex-1 pr-4 text-sm text-slate-600">{label}</span>
      {value ? (
        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          <Icon name="star" className="text-[9px]" />
          {getRatingLabel(value)}
        </span>
      ) : (
        <span className="text-sm text-slate-400">—</span>
      )}
    </div>
  );

  const SectionBlock = ({ title, children }) => (
    <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.50)",
        backdropFilter: "blur(2px)",
      }}
      className="flex items-start justify-center overflow-y-auto px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {record.type === "observation"
                ? "Observation Details"
                : "Survey Details"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {record.teacherName || "—"} ·{" "}
              {record.date
                ? format(new Date(record.date), "MMM dd, yyyy")
                : "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <Icon name="xmark" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
              <Icon
                name="spinner"
                className="fa-spin text-2xl text-green-600"
              />
              <span className="text-sm">Loading details...</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 py-16 text-red-500">
              <Icon name="circle-exclamation" className="text-2xl" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {details && record.formType === "Lesson Observation" && (
            <>
              <SectionBlock title="General Information">
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <DetailRow label="Observer" value={details.observerName} />
                  <DetailRow
                    label="Date"
                    value={
                      details.observationDate
                        ? format(
                            new Date(details.observationDate),
                            "MMM dd, yyyy",
                          )
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Teacher Observed"
                    value={details.teacherName}
                  />
                  <DetailRow
                    label="Joint Observer"
                    value={details.jointObserverName}
                  />
                  <DetailRow
                    label="Lesson Number"
                    value={details.lessonNumber}
                  />
                  <DetailRow
                    label="Year Group / Section"
                    value={details.yearGroupSection}
                  />
                  <DetailRow label="Subject" value={details.subject} />
                  <DetailRow label="Topic" value={details.topic} />
                  <DetailRow label="Students" value={details.noOfStudents} />
                  <DetailRow label="G&T Students" value={details.noOfGT} />
                  <DetailRow label="SODs" value={details.noOfSOD} />
                  <DetailRow
                    label="Emirati Students"
                    value={details.noOfEmirati}
                  />
                </div>
                <DetailRow
                  label="Learning Objective"
                  value={details.learningObjective}
                />
              </SectionBlock>

              <SectionBlock title="Teaching Skills">
                <RatingRow
                  label="Subject knowledge / how students learn"
                  value={details.tS_SubjectKnowledge}
                />
                <RatingRow
                  label="Lesson planning / use of time and resources"
                  value={details.tS_LessonPlanning}
                />
                <RatingRow
                  label="Learning environment"
                  value={details.tS_LearningEnvironment}
                />
                <RatingRow
                  label="Interactions, use of questioning and dialogue"
                  value={details.tS_Interactions}
                />
                <RatingRow
                  label="Meeting students' individual needs"
                  value={details.tS_IndividualNeeds}
                />
                <RatingRow
                  label="Teacher's expectations"
                  value={details.tS_Expectations}
                />
                <RatingRow
                  label="Critical thinking / problem-solving / innovation"
                  value={details.tS_CriticalThinking}
                />
                <RatingRow
                  label="Teachers' knowledge and support for learning"
                  value={details.teachersKnowledgeSupport}
                />
              </SectionBlock>

              <SectionBlock title="Learning Skills">
                <RatingRow
                  label="Students take responsibility for own learning"
                  value={details.lS_Responsibility}
                />
                <RatingRow
                  label="Students' knowledge of strengths and weaknesses"
                  value={details.lS_StrengthsWeaknesses}
                />
                <RatingRow
                  label="Students' interaction and collaboration"
                  value={details.lS_Interaction}
                />
                <RatingRow
                  label="Students' communication of learning"
                  value={details.lS_Communication}
                />
                <RatingRow
                  label="Making connections with other learning & real world"
                  value={details.lS_Connections}
                />
                <RatingRow
                  label="Innovation, enquiry & research"
                  value={details.lS_Innovation}
                />
                <RatingRow
                  label="Students' use of technology"
                  value={details.lS_Technology}
                />
                <RatingRow
                  label="Critical thinking & problem solving"
                  value={details.lS_CriticalThinking}
                />
              </SectionBlock>

              <SectionBlock title="Internal Assessment">
                <RatingRow
                  label="Internal Assessment Processes"
                  value={details.internalAssessment}
                />
                <RatingRow
                  label="Use of assessment information to influence teaching"
                  value={details.assessmentInfluence}
                />
                <RatingRow
                  label="Analysis of assessment data to monitor progress"
                  value={details.assessmentAnalysis}
                />
              </SectionBlock>

              <SectionBlock title="Quantitative Terms">
                <RatingRow
                  label="Attainment – knowledge, skills and understanding"
                  value={details.qT_Attainment}
                />
                <RatingRow
                  label="Progress of students in lesson"
                  value={details.qT_ProgressInLesson}
                />
                <RatingRow
                  label="Progress of different groups (LA, MA, HA, SOD, G&T)"
                  value={details.qT_ProgressGroups}
                />
              </SectionBlock>

              <SectionBlock title="Wellbeing & Benchmarking">
                <RatingRow
                  label="Students' Wellbeing Experiences"
                  value={details.wellbeing}
                />
                <RatingRow
                  label="External, national and international benchmarking"
                  value={details.benchmarking}
                />
              </SectionBlock>

              <SectionBlock title="Post Lesson Review">
                <DetailRow
                  label="Teacher Reflection"
                  value={details.teacherReflection}
                />
                <DetailRow
                  label="Needs for Improvement"
                  value={details.needsForImprovement}
                />
                <DetailRow
                  label="Overall Strengths Observed"
                  value={details.overallStrengths}
                />
              </SectionBlock>

              <SectionBlock title="Final Ratings">
                <RatingRow
                  label="Overall Rating"
                  value={details.overallRating}
                />
                <RatingRow
                  label="Clear Progress Demonstrated"
                  value={details.clearProgress}
                />
                <RatingRow
                  label="Demand Placed on Students"
                  value={details.demandOnStudents}
                />
                <RatingRow
                  label="Effective Plenary"
                  value={details.effectivePlenary}
                />
              </SectionBlock>
            </>
          )}
          {details && record.formType === "Teacher Survey Performance" && (
            <>
              <SectionBlock title="Survey Information">
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <DetailRow
                    label="Survey Date"
                    value={
                      details.surveyDate
                        ? format(new Date(details.surveyDate), "MMM dd, yyyy")
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Performance Manager"
                    value={details.performanceManagerName}
                  />
                  <DetailRow label="Teacher Name" value={details.teacherName} />
                </div>
              </SectionBlock>
              <SectionBlock title="Observations & Contributions">
                <DetailRow
                  label="General Observations on Teaching Quality"
                  value={details.generalObservations}
                />
                <DetailRow
                  label="Quality of Response to Students' Work"
                  value={details.qualityOfResponseToStudentsWork}
                />
                <DetailRow
                  label="Quality of Contribution to School Life"
                  value={details.qualityOfContributionToSchoolLife}
                />
              </SectionBlock>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <Icon name="xmark" className="text-xs" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBMIT PREVIEW MODAL
// ─────────────────────────────────────────────
function SubmitPreviewModal({
  formType,
  formData,
  ratingLabels,
  schoolYearLabel,
  onClose,
  onConfirm,
}) {
  const getRatingLabel = (val) =>
    val
      ? `${val} – ${ratingLabels?.[val] ?? RATING_DESCRIPTORS[val]?.short ?? val}`
      : "—";

  const formatDateValue = (value) => {
    if (!value) return "—";
    try {
      return format(new Date(value), "MMM dd, yyyy");
    } catch {
      return value;
    }
  };

  const displayValue = (value) => (value === "" || value == null ? "—" : value);

  const PreviewRow = ({ label, value, rating = false, multiline = false }) => (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      {rating ? (
        <div className="mt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Icon name="star" className="text-[9px]" />
            {getRatingLabel(value)}
          </span>
        </div>
      ) : (
        <p
          className={`mt-1 text-sm text-slate-800 ${multiline ? "whitespace-pre-wrap" : ""}`}
        >
          {displayValue(value)}
        </p>
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
      }}
      className="flex items-start justify-center overflow-y-auto px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-green-700 to-green-500" />

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Review Before Saving
            </p>
            <h3 className="text-lg font-bold text-slate-800">
              {formType === "observation"
                ? "Teacher Observation Preview"
                : "Teacher Survey Preview"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Please review the entered information carefully before submitting.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <Icon name="xmark" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Form Type
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formType === "observation"
                ? "Teacher Observation"
                : "Teacher Survey"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Teacher
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {displayValue(formData.teacherName)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Academic Term
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {schoolYearLabel}
            </p>
          </div>
        </div>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto p-6">
          {formType === "observation" ? (
            <>
              <Section title="General Information">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Joint Observer"
                    value={formData.jointObserverName}
                  />
                  <PreviewRow
                    label="Date of Observation"
                    value={formatDateValue(formData.observationDate)}
                  />
                  <PreviewRow
                    label="Observer Name"
                    value={formData.observerName}
                  />
                  <PreviewRow
                    label="Teacher Being Observed"
                    value={formData.teacherName}
                  />
                  <PreviewRow
                    label="Lesson Number"
                    value={formData.lessonNumber}
                  />
                  <PreviewRow
                    label="Year Group / Section"
                    value={formData.yearGroupSection}
                  />
                  <PreviewRow label="Subject" value={formData.subject} />
                  <PreviewRow label="Topic" value={formData.topic} />
                  <PreviewRow
                    label="No. of Students"
                    value={formData.noOfStudents}
                  />
                  <PreviewRow
                    label="No. of G&T Students"
                    value={formData.noOfGT}
                  />
                  <PreviewRow label="No. of SODs" value={formData.noOfSOD} />
                  <PreviewRow
                    label="No. of Emirati Students"
                    value={formData.noOfEmirati}
                  />
                </div>
                <PreviewRow
                  label="Learning Objective"
                  value={formData.learningObjective}
                  multiline
                />
              </Section>

              <Section title="Teaching Skills">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Subject knowledge / how students learn"
                    value={formData.tS_SubjectKnowledge}
                    rating
                  />
                  <PreviewRow
                    label="Lesson planning / use of time and resources"
                    value={formData.tS_LessonPlanning}
                    rating
                  />
                  <PreviewRow
                    label="Learning environment"
                    value={formData.tS_LearningEnvironment}
                    rating
                  />
                  <PreviewRow
                    label="Interactions, use of questioning and dialogue"
                    value={formData.tS_Interactions}
                    rating
                  />
                  <PreviewRow
                    label="Meeting students' individual needs"
                    value={formData.tS_IndividualNeeds}
                    rating
                  />
                  <PreviewRow
                    label="Teacher's expectations"
                    value={formData.tS_Expectations}
                    rating
                  />
                  <PreviewRow
                    label="Critical thinking / problem-solving / innovation"
                    value={formData.tS_CriticalThinking}
                    rating
                  />
                  <PreviewRow
                    label="Teachers' knowledge and support for learning"
                    value={formData.teachersKnowledgeSupport}
                    rating
                  />
                </div>
              </Section>

              <Section title="Learning Skills">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Students take responsibility for own learning"
                    value={formData.lS_Responsibility}
                    rating
                  />
                  <PreviewRow
                    label="Students' knowledge of strengths and weaknesses"
                    value={formData.lS_StrengthsWeaknesses}
                    rating
                  />
                  <PreviewRow
                    label="Students' interaction and collaboration"
                    value={formData.lS_Interaction}
                    rating
                  />
                  <PreviewRow
                    label="Students' communication of learning"
                    value={formData.lS_Communication}
                    rating
                  />
                  <PreviewRow
                    label="Making connections with other learning & real world"
                    value={formData.lS_Connections}
                    rating
                  />
                  <PreviewRow
                    label="Innovation, enquiry & research"
                    value={formData.lS_Innovation}
                    rating
                  />
                  <PreviewRow
                    label="Students' use of technology"
                    value={formData.lS_Technology}
                    rating
                  />
                  <PreviewRow
                    label="Critical thinking & problem solving"
                    value={formData.lS_CriticalThinking}
                    rating
                  />
                </div>
              </Section>

              <Section title="Internal Assessment Processes">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Internal Assessment Processes"
                    value={formData.internalAssessment}
                    rating
                  />
                  <PreviewRow
                    label="Use of assessment information to influence teaching"
                    value={formData.assessmentInfluence}
                    rating
                  />
                  <PreviewRow
                    label="Analysis of assessment data to monitor progress"
                    value={formData.assessmentAnalysis}
                    rating
                  />
                </div>
              </Section>

              <Section title="Quantitative Terms">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Attainment"
                    value={formData.qT_Attainment}
                    rating
                  />
                  <PreviewRow
                    label="Progress of students in lesson"
                    value={formData.qT_ProgressInLesson}
                    rating
                  />
                  <PreviewRow
                    label="Progress of different groups"
                    value={formData.qT_ProgressGroups}
                    rating
                  />
                </div>
              </Section>

              <Section title="Wellbeing & Benchmarking">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Students' Wellbeing Experiences"
                    value={formData.wellbeing}
                    rating
                  />
                  <PreviewRow
                    label="External, national and international benchmarking"
                    value={formData.benchmarking}
                    rating
                  />
                </div>
              </Section>

              <Section title="Post Lesson Review">
                <PreviewRow
                  label="Teacher Reflection"
                  value={formData.teacherReflection}
                  multiline
                />
                <PreviewRow
                  label="Needs for Improvement"
                  value={formData.needsForImprovement}
                  multiline
                />
                <PreviewRow
                  label="Overall Strengths Observed"
                  value={formData.overallStrengths}
                  multiline
                />
              </Section>

              <Section title="Final Ratings">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Overall Rating"
                    value={formData.overallRating}
                    rating
                  />
                  <PreviewRow
                    label="Clear Progress Demonstrated"
                    value={formData.clearProgress}
                    rating
                  />
                  <PreviewRow
                    label="Demand Placed on Students"
                    value={formData.demandOnStudents}
                    rating
                  />
                  <PreviewRow
                    label="Effective Plenary"
                    value={formData.effectivePlenary}
                    rating
                  />
                </div>
              </Section>
            </>
          ) : (
            <>
              <Section title="Survey Information">
                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <PreviewRow
                    label="Survey Date"
                    value={formatDateValue(formData.surveyDate)}
                  />
                  <PreviewRow
                    label="Performance Manager Name"
                    value={formData.performanceManagerName}
                  />
                  <PreviewRow
                    label="Teacher Name"
                    value={formData.teacherName}
                  />
                </div>
              </Section>

              <Section title="Observations & Contributions">
                <PreviewRow
                  label="General Observations on Teaching Quality"
                  value={formData.generalObservations}
                  multiline
                />
                <PreviewRow
                  label="Quality of Response to Students' Work"
                  value={formData.qualityOfResponseToStudentsWork}
                  multiline
                />
                <PreviewRow
                  label="Quality of Contribution to School Life"
                  value={formData.qualityOfContributionToSchoolLife}
                  multiline
                />
              </Section>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Icon name="arrow-left" className="text-xs" />
            Back to Edit
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
          >
            <Icon name="paper-plane" className="text-xs" />
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TeacherObservationForm() {
  const [activeTab, setActiveTab] = useState("form");
  const [activeForm, setActiveForm] = useState("observation");
  const [observationForm, setObservationForm] = useState(OBSERVATION_INITIAL);
  const [surveyForm, setSurveyForm] = useState(SURVEY_INITIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingStep, setSavingStep] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const hubRef = useRef(null);

  const { canCreate, canDelete } = usePermissions();

  const [refs, setRefs] = useState({
    currentSchoolYear: null,
    teacherList: [],
    jointList: [],
    ratingList: [],
  });
  const [refsLoading, setRefsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTeacherObsFormRef();
        setRefs({
          currentSchoolYear: data.currentSchoolYear ?? null,
          teacherList: data.teacherObservationSelection ?? [],
          jointList: data.jointObservationSelection ?? [],
          ratingList: data.ratingListSelection ?? [],
        });
      } catch (e) {
        console.error("Failed to load form references", e);
      } finally {
        setRefsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const data = await getTeacherFilledFormListAsync();
        if (Array.isArray(data)) setSubmissions(data);
      } catch (e) {
        console.error("Failed to load submitted forms", e);
      }
    };
    loadSubmissions();
  }, []);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE ?? "";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBase}/teachersformHub`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveNewRecord", (newRecord) => {
      console.log(newRecord);
      setSubmissions((prev) => {
        if (prev.some((s) => s.idx === newRecord.idx)) return prev;
        return [newRecord, ...prev];
      });
    });

    const start = async () => {
      try {
        await connection.start();
        console.log("SignalR connected to TeachersFormHub");
      } catch (e) {
        console.warn("SignalR connection failed:", e);
      }
    };

    start();
    hubRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const ratingLabels = useMemo(() => {
    if (!refs.ratingList.length) {
      return Object.fromEntries(
        Object.entries(RATING_DESCRIPTORS).map(([k, v]) => [k, v.short]),
      );
    }
    return Object.fromEntries(
      refs.ratingList.map((r) => [r.ratingValue, r.ratingName]),
    );
  }, [refs.ratingList]);

  const currentForm =
    activeForm === "observation" ? observationForm : surveyForm;
  const requiredFields =
    activeForm === "observation" ? OBSERVATION_REQUIRED : SURVEY_REQUIRED;

  const answered = useMemo(
    () => requiredFields.filter((k) => currentForm[k] !== "").length,
    [currentForm, requiredFields],
  );
  const progress = Math.round((answered / requiredFields.length) * 100);

  const setField = (key, value) => {
    if (activeForm === "observation") {
      setObservationForm((p) => ({ ...p, [key]: value }));
    } else {
      setSurveyForm((p) => ({ ...p, [key]: value }));
    }

    if (fieldErrors[key]) {
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
    }
  };

  const validateForm = () => {
    const missing = requiredFields.filter((k) => !currentForm[k]);
    if (missing.length) {
      const errorMap = {};
      missing.forEach((k) => (errorMap[k] = true));
      setFieldErrors(errorMap);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleOpenPreview = () => {
    if (!validateForm()) {
      ToastError(
        `Please complete all required fields. (${requiredFields.filter((k) => !currentForm[k]).length} remaining)`,
      );
      return;
    }

    setPreviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!validateForm()) {
      setPreviewOpen(false);
      ToastError(
        `Please complete all required fields. (${requiredFields.filter((k) => !currentForm[k]).length} remaining)`,
      );
      return;
    }

    setPreviewOpen(false);

    try {
      setSavingStep("validating");

      const formData =
        activeForm === "observation"
          ? toObservationFormData(observationForm, refs.currentSchoolYear)
          : toSurveyFormData(surveyForm, refs.currentSchoolYear);

      let validationResult;
      if (activeForm === "observation") {
        validationResult = await createTeacherObsFormValidation(formData);
      } else {
        validationResult = await createLessonSurveyFormValidation(formData);
      }

      if (!validationResult?.isSuccessful) {
        setSavingStep(null);
        SwalError(
          "Validation Failed",
          validationResult?.title ?? "Please check your form and try again.",
        );
        return;
      }

      setSavingStep("submitting");

      const submitData =
        activeForm === "observation"
          ? toObservationFormData(observationForm, refs.currentSchoolYear)
          : toSurveyFormData(surveyForm, refs.currentSchoolYear);

      if (activeForm === "observation") {
        await CreateTeacherObsFormAsync(submitData);
      } else {
        await createLessonSurveyFormAsync(submitData);
      }

      setSavingStep("notifying");
      await new Promise((r) => setTimeout(r, 700));

      setSavingStep("done");
      await new Promise((r) => setTimeout(r, 500));

      setSavingStep(null);
      SwalSuccess(
        "Form Submitted!",
        "The form has been recorded successfully.",
      );

      if (activeForm === "observation") {
        setObservationForm(OBSERVATION_INITIAL);
      } else {
        setSurveyForm(SURVEY_INITIAL);
      }

      setFieldErrors({});
      setActiveTab("list");
    } catch (e) {
      setSavingStep(null);
      SwalError("Submission Failed", "Something went wrong. Please try again.");
    }
  };

  const handleReset = async () => {
    const ok = await SwalConfirm(
      "Clear Form",
      "This will clear all your answers. Continue?",
    );
    if (!ok) return;

    if (activeForm === "observation") setObservationForm(OBSERVATION_INITIAL);
    else setSurveyForm(SURVEY_INITIAL);

    setFieldErrors({});
  };

  const handleDelete = async (id) => {
    const ok = await SwalConfirm("Delete Record", "Delete this record?");
    if (!ok) return;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchType = filterType === "all" || s.type === filterType;
    const matchSearch = [s.teacherName, s.subject, s.classSection].some((v) =>
      v?.toLowerCase().includes(searchText.toLowerCase()),
    );
    return matchType && matchSearch;
  });

  const sy = refs.currentSchoolYear;
  const syLabel = sy
    ? `Academic Year ${sy.currentAcadYear} / ${sy.currentAcadYear + 1} — TERM ${sy.currentTerm}`
    : "Loading academic year...";

  return (
    <>
      {savingStep && <SavingOverlay currentStep={savingStep} />}

      {viewRecord && (
        <ViewDetailsModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          ratingLabels={ratingLabels}
        />
      )}

      {previewOpen && (
        <SubmitPreviewModal
          formType={activeForm}
          formData={currentForm}
          ratingLabels={ratingLabels}
          schoolYearLabel={syLabel}
          onClose={() => setPreviewOpen(false)}
          onConfirm={handleConfirmSubmit}
        />
      )}

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Teacher Evaluation Forms
            </h2>
            <p className="mt-1 text-slate-600">
              Complete a joint observation or survey using a structured academic
              review format
            </p>
          </div>

          <div className="mb-6 flex gap-0 border-b-2 border-slate-200">
            {[
              { key: "form", label: "Submit a Form", icon: "pen-to-square" },
              {
                key: "list",
                label: "Submitted Records",
                icon: "list-check",
                badge: submissions.length || null,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-0.5 flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon name={tab.icon} className="text-xs" />
                {tab.label}
                {tab.badge && (
                  <span className="flex min-w-[18px] items-center justify-center rounded-full bg-green-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "form" && (
            <>
              {canCreate ? (
                <>
                  <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1">
                    {[
                      {
                        key: "observation",
                        label: "Teacher Observation",
                        icon: "clipboard-check",
                      },
                      {
                        key: "survey",
                        label: "Teacher Survey",
                        icon: "square-poll-vertical",
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveForm(tab.key);
                          setFieldErrors({});
                        }}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                          activeForm === tab.key
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Icon name={tab.icon} className="text-xs" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-1 bg-gradient-to-r from-green-700 to-green-500" />
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {activeForm === "observation"
                          ? "Teacher Observation Form"
                          : "Teacher Survey Form"}
                      </p>
                      <h3 className="text-xl font-bold text-slate-800">
                        {activeForm === "observation"
                          ? `Teacher Observation ( ${syLabel} )`
                          : `Teacher Performance Survey ( ${syLabel} )`}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Fields marked{" "}
                        <span className="font-semibold text-red-500">*</span>{" "}
                        are required — all fields must be completed
                      </p>
                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Form completion</span>
                          <span>
                            {answered} / {requiredFields.length} required fields
                            answered
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-green-700 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      {Object.keys(fieldErrors).length > 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          <Icon
                            name="circle-exclamation"
                            className="text-red-500"
                          />
                          {Object.keys(fieldErrors).length} field(s) need
                          attention — highlighted below
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {activeForm === "observation" ? (
                        <ObservationFields
                          form={observationForm}
                          setField={setField}
                          teacherList={refs.teacherList}
                          jointList={refs.jointList}
                          ratingLabels={ratingLabels}
                          refsLoading={refsLoading}
                          fieldErrors={fieldErrors}
                        />
                      ) : (
                        <SurveyFields
                          form={surveyForm}
                          setField={setField}
                          teacherList={refs.teacherList}
                          refsLoading={refsLoading}
                          fieldErrors={fieldErrors}
                        />
                      )}

                      <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleOpenPreview}
                          disabled={!!savingStep}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <Icon name="eye" className="text-sm" /> Review &
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                        >
                          Clear form
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-400">
                    <Icon name="lock" className="text-xl" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700">
                    Access Restricted
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You don't have permission to submit forms.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "list" && (
            <SubmissionList
              submissions={filteredSubmissions}
              allCount={submissions.length}
              searchText={searchText}
              setSearchText={setSearchText}
              filterType={filterType}
              setFilterType={setFilterType}
              onDelete={handleDelete}
              canDelete={canDelete}
              onNewForm={() => setActiveTab("form")}
              canCreate={canCreate}
              onView={(record) => setViewRecord(record)}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// SEARCHABLE COMBOBOX
// ─────────────────────────────────────────────
function SearchableSelect({
  id,
  options,
  value,
  nameValue,
  onChange,
  onIdChange,
  placeholder,
  hasError,
}) {
  const [inputVal, setInputVal] = useState(nameValue || "");

  useEffect(() => {
    setInputVal(nameValue || "");
  }, [nameValue]);

  const findMatch = (text) =>
    options.find(
      (o) => o.teacherName.toLowerCase() === text.trim().toLowerCase(),
    );

  const handleChange = (e) => {
    const typed = e.target.value;
    setInputVal(typed);
    const match = findMatch(typed);
    if (match) {
      onChange(match.teacherName);
      onIdChange(match.teacherID);
    } else {
      onChange(typed);
      onIdChange("");
    }
  };

  const handleBlur = () => {
    const match = findMatch(inputVal);
    if (!match) {
      setInputVal("");
      onChange("");
      onIdChange("");
    }
  };

  return (
    <>
      <input
        type="text"
        list={id}
        value={inputVal}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={hasError ? errorInputClass : inputClass}
        autoComplete="off"
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o.teacherID} value={o.teacherName} />
        ))}
      </datalist>
    </>
  );
}

// ─────────────────────────────────────────────
// OBSERVATION FIELDS
// ─────────────────────────────────────────────
function ObservationFields({
  form,
  setField,
  teacherList,
  jointList,
  ratingLabels,
  refsLoading,
  fieldErrors,
}) {
  const err = (key) => fieldErrors?.[key];
  const ic = (key) => (err(key) ? errorInputClass : inputClass);
  const tc = (key) =>
    err(key)
      ? "min-h-[100px] w-full resize-y rounded-lg border border-red-400 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
      : textareaClass;

  return (
    <div className="space-y-8">
      <FormSection
        title="General Information"
        description="Basic details about the observation session."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Joint Observation"
            required
            error={err("jointObserverID")}
          >
            {refsLoading ? (
              <SkeletonInput />
            ) : (
              <SearchableSelect
                id="joint-observer-list"
                options={jointList}
                nameValue={form.jointObserverName}
                onChange={(name) => setField("jointObserverName", name)}
                onIdChange={(id) => setField("jointObserverID", id)}
                placeholder="Search joint observer..."
                hasError={err("jointObserverID")}
              />
            )}
          </FormField>
          <FormField
            label="Date of Observation"
            required
            error={err("observationDate")}
          >
            <input
              type="date"
              value={form.observationDate}
              onChange={(e) => setField("observationDate", e.target.value)}
              className={ic("observationDate")}
            />
          </FormField>
          <FormField label="Observer Name" required error={err("observerName")}>
            <input
              type="text"
              placeholder="Enter observer name"
              value={form.observerName}
              onChange={(e) => setField("observerName", e.target.value)}
              className={ic("observerName")}
            />
          </FormField>
          <FormField
            label="Teacher Being Observed"
            required
            error={err("teacherID")}
          >
            {refsLoading ? (
              <SkeletonInput />
            ) : (
              <SearchableSelect
                id="teacher-observed-list"
                options={teacherList}
                nameValue={form.teacherName}
                onChange={(name) => setField("teacherName", name)}
                onIdChange={(id) => setField("teacherID", id)}
                placeholder="Search teacher..."
                hasError={err("teacherID")}
              />
            )}
          </FormField>
          <FormField label="Lesson Number" required error={err("lessonNumber")}>
            <input
              type="text"
              placeholder="e.g. Lesson 3"
              value={form.lessonNumber}
              onChange={(e) => setField("lessonNumber", e.target.value)}
              className={ic("lessonNumber")}
            />
          </FormField>
          <FormField
            label="Year Group / Section"
            required
            error={err("yearGroupSection")}
          >
            <input
              type="text"
              placeholder="e.g. Grade 5 — Section A"
              value={form.yearGroupSection}
              onChange={(e) => setField("yearGroupSection", e.target.value)}
              className={ic("yearGroupSection")}
            />
          </FormField>
          <FormField label="Subject" required error={err("subject")}>
            <input
              type="text"
              placeholder="Enter subject"
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              className={ic("subject")}
            />
          </FormField>
          <FormField label="Topic" required error={err("topic")}>
            <input
              type="text"
              placeholder="Enter lesson topic"
              value={form.topic}
              onChange={(e) => setField("topic", e.target.value)}
              className={ic("topic")}
            />
          </FormField>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { key: "noOfStudents", label: "No. of Students (All)" },
            { key: "noOfGT", label: "No. of G&T Students" },
            { key: "noOfSOD", label: "No. of SODs" },
            { key: "noOfEmirati", label: "No. of Emirati Students" },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                className={ic(key)}
              />
            </FormField>
          ))}
        </div>

        <div className="mt-4">
          <FormField
            label="Learning Objective"
            required
            error={err("learningObjective")}
          >
            <textarea
              rows={3}
              placeholder="State the learning objective for this lesson..."
              value={form.learningObjective}
              onChange={(e) => setField("learningObjective", e.target.value)}
              className={tc("learningObjective")}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Teaching Skills"
        description="Rate each teaching skill from 1 (Weak) to 5 (Outstanding)."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            {
              key: "ts_subjectKnowledge",
              label: "Subject knowledge / how students learn",
            },
            {
              key: "ts_lessonPlanning",
              label: "How good is lesson planning / use of time and resources",
            },
            { key: "ts_learningEnvironment", label: "Learning environment" },
            {
              key: "ts_interactions",
              label: "Interactions, use of questioning and dialogue",
            },
            {
              key: "ts_individualNeeds",
              label: "Meeting students' individual needs",
            },
            {
              key: "ts_expectations",
              label: "How high are teacher's expectations?",
            },
            {
              key: "ts_criticalThinking",
              label:
                "Development of critical thinking, problem-solving, innovation and independent learning skills",
            },
            {
              key: "teachersKnowledgeSupport",
              label:
                "Teachers' knowledge of and support for students' learning",
            },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Learning Skills"
        description="Rate each student learning skill from 1 (Weak) to 5 (Outstanding)."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            {
              key: "ls_responsibility",
              label: "Students take responsibility for their own learning",
            },
            {
              key: "ls_strengthsWeaknesses",
              label: "Students' knowledge of their strengths and weaknesses",
            },
            {
              key: "ls_interaction",
              label: "Students' interaction and collaboration",
            },
            {
              key: "ls_communication",
              label: "Students' communication of their learning",
            },
            {
              key: "ls_connections",
              label:
                "Students making connections with other learning & the real world",
            },
            {
              key: "ls_innovation",
              label: "Innovation & enterprise, enquiry & research",
            },
            { key: "ls_technology", label: "Students' use of technology" },
            {
              key: "ls_criticalThinking",
              label: "Critical thinking & problem solving skills",
            },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Internal Assessment Processes"
        description="Rate the use of assessment data and its influence on teaching."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            {
              key: "internalAssessment",
              label: "Internal Assessment Processes",
            },
            {
              key: "assessmentInfluence",
              label:
                "Use of assessment information to influence teaching, curriculum and students' progress",
            },
            {
              key: "assessmentAnalysis",
              label:
                "Analysis of assessment data to monitor students' progress",
            },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Quantitative Terms"
        description="Rate attainment and progress levels observed during the lesson."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            {
              key: "qt_attainment",
              label:
                "Attainment — Knowledge, skills and understanding in key subjects",
              hint: "In lessons and recent work, students demonstrate levels of knowledge, skills and understanding",
            },
            {
              key: "qt_progressInLesson",
              label:
                "Progress of students in lesson in relation to appropriate learning objectives aligned with the expected curriculum standards",
            },
            {
              key: "qt_progressGroups",
              label:
                "Progress of different groups of students (LA, MA, HA, SOD, G&T)",
            },
          ].map(({ key, label, hint }) => (
            <FormField
              key={key}
              label={label}
              required
              hint={hint}
              error={err(key)}
            >
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Wellbeing & Benchmarking"
        description="Rate student wellbeing experiences and external benchmarking."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            { key: "wellbeing", label: "Students' Wellbeing Experiences" },
            {
              key: "benchmarking",
              label: "External, national and international benchmarking",
            },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Post Lesson Review"
        description="Teacher reflection and observer summary following the lesson."
      >
        <div className="space-y-5">
          {[
            {
              key: "teacherReflection",
              label: "Teacher Reflection Post Lesson Observation",
              placeholder: "Teacher's own reflection on the lesson...",
            },
            {
              key: "needsForImprovement",
              label: "Needs for Improvement",
              placeholder: "Areas identified for improvement...",
            },
            {
              key: "overallStrengths",
              label: "Overall Strengths Observed",
              placeholder: "Key strengths observed during the lesson...",
            },
          ].map(({ key, label, placeholder }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <textarea
                rows={4}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                className={tc(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Final Ratings"
        description="Provide a final overall assessment across key dimensions."
      >
        <RatingLegend />
        <div className="mt-4 space-y-6">
          {[
            { key: "overallRating", label: "Overall Rating" },
            { key: "clearProgress", label: "Clear Progress Demonstrated" },
            { key: "demandOnStudents", label: "Demand Placed on Students" },
            { key: "effectivePlenary", label: "Effective Plenary" },
          ].map(({ key, label }) => (
            <FormField key={key} label={label} required error={err(key)}>
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(v) => setField(key, v)}
                ratingLabels={ratingLabels}
                hasError={err(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

// ─────────────────────────────────────────────
// SURVEY FIELDS
// ─────────────────────────────────────────────
function SurveyFields({
  form,
  setField,
  teacherList,
  refsLoading,
  fieldErrors,
}) {
  const err = (key) => fieldErrors?.[key];
  const ic = (key) => (err(key) ? errorInputClass : inputClass);
  const tc = (key) =>
    err(key)
      ? "min-h-[100px] w-full resize-y rounded-lg border border-red-400 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
      : textareaClass;

  return (
    <div className="space-y-8">
      <FormSection
        title="Survey Information"
        description="Fill in the performance manager and teacher details before completing the survey."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Survey Date" required error={err("surveyDate")}>
            <input
              type="date"
              value={form.surveyDate}
              onChange={(e) => setField("surveyDate", e.target.value)}
              className={ic("surveyDate")}
            />
          </FormField>

          <FormField
            label="Performance Manager Name"
            required
            error={err("performanceManagerName")}
          >
            <input
              type="text"
              placeholder="Enter performance manager name"
              value={form.performanceManagerName}
              onChange={(e) =>
                setField("performanceManagerName", e.target.value)
              }
              className={ic("performanceManagerName")}
            />
          </FormField>

          <FormField
            label="Teacher Name"
            required
            error={err("teacherID") || err("teacherName")}
          >
            {refsLoading ? (
              <SkeletonInput />
            ) : (
              <SearchableSelect
                id="survey-teacher-list"
                options={teacherList}
                nameValue={form.teacherName}
                onChange={(name) => setField("teacherName", name)}
                onIdChange={(id) => setField("teacherID", id)}
                placeholder="Search teacher..."
                hasError={err("teacherID") || err("teacherName")}
              />
            )}
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Observations & Contributions"
        description="Provide qualitative observations across the three areas below."
      >
        <div className="space-y-5">
          {[
            {
              key: "generalObservations",
              label: "General Observations on Teaching Quality",
              hint: "Based on Learning Walks, classroom visits, etc.",
              placeholder: "Enter general observations on teaching quality...",
            },
            {
              key: "qualityOfResponseToStudentsWork",
              label: "Quality of Response to Students' Work",
              placeholder:
                "Describe the quality of the teacher's response to students' work...",
            },
            {
              key: "qualityOfContributionToSchoolLife",
              label: "Quality of Contribution to School Life",
              placeholder:
                "Describe the teacher's contributions to school life beyond the classroom...",
            },
          ].map(({ key, label, hint, placeholder }) => (
            <FormField
              key={key}
              label={label}
              required
              hint={hint}
              error={err(key)}
            >
              <textarea
                rows={5}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                className={tc(key)}
              />
            </FormField>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBMISSION LIST
// ─────────────────────────────────────────────
function SubmissionList({
  submissions,
  allCount,
  searchText,
  setSearchText,
  filterType,
  setFilterType,
  onDelete,
  canDelete,
  onNewForm,
  canCreate,
  onView,
}) {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Icon
            name="magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
          />
          <input
            type="text"
            placeholder="Search teacher, subject, class..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-green-600"
          >
            <option value="all">All types</option>
            <option value="observation">Observation</option>
            <option value="survey">Survey</option>
          </select>

          {canCreate && (
            <button
              type="button"
              onClick={onNewForm}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              <Icon name="plus" className="text-xs" /> New Form
            </button>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="list-check" className="text-xl" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">
            No submissions yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchText || filterType !== "all"
              ? "No records match your filters."
              : "Submit your first form to see it listed here."}
          </p>

          {!searchText && filterType === "all" && canCreate && (
            <button
              type="button"
              onClick={onNewForm}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              <Icon name="plus" className="text-xs" /> Submit a form
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-xs font-medium text-slate-500">
              {submissions.length} record{submissions.length !== 1 ? "s" : ""}
              {filterType !== "all" && ` · ${filterType}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Type",
                    "Teacher Name",
                    "Date Filled",
                    "Term",
                    "Academic Year",
                    "Actions",
                  ].map((col, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {submissions.map((record, idx) => (
                  <tr
                    key={record.id ?? record.idx ?? idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          record.type === "observation"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        <Icon
                          name={
                            record.formType === "Lesson Observation"
                              ? "clipboard-check"
                              : "square-poll-vertical"
                          }
                          className="text-[10px]"
                        />
                        {record.formType === "Lesson Observation"
                          ? "Observation"
                          : "Survey"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {record.teacherName || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {record.dateFilled
                        ? format(new Date(record.dateFilled), "MMM dd, yyyy")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {record.term || "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {record.acadYear || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onView(record)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <Icon name="eye" className="text-[9px]" /> View
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => onDelete(record.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100"
                          >
                            <Icon name="trash" className="text-[9px]" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────
function FormSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-5 border-b border-slate-200 pb-3">
        <h4 className="text-base font-bold text-slate-800">{title}</h4>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function FormField({ label, required, hint, children, error }) {
  return (
    <div>
      <label
        className={`mb-1.5 block text-sm font-medium ${
          error ? "text-red-600" : "text-slate-700"
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}

      {children}

      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <Icon name="circle-exclamation" className="text-[10px]" /> This field
          is required
        </p>
      )}
    </div>
  );
}

function RatingLegend() {
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
      {[5, 4, 3, 2, 1].map((num) => (
        <span key={num} className="text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {num} – {RATING_DESCRIPTORS[num].short}:
          </span>{" "}
          {RATING_DESCRIPTORS[num].detail}
        </span>
      ))}
    </div>
  );
}

function RatingScale({ name, value, onChange, ratingLabels, hasError }) {
  return (
    <div
      className={`grid grid-cols-5 gap-2 sm:gap-3 ${
        hasError ? "rounded-xl bg-red-50/30 p-1 ring-2 ring-red-200" : ""
      }`}
    >
      {[1, 2, 3, 4, 5].map((num) => {
        const active = value === String(num);
        const label =
          ratingLabels?.[num] ?? RATING_DESCRIPTORS[num]?.short ?? String(num);
        const detail = RATING_DESCRIPTORS[num]?.detail ?? "";

        return (
          <button
            key={`${name}-${num}`}
            type="button"
            onClick={() => onChange(String(num))}
            title={detail}
            className={`rounded-xl border p-3 text-center transition-all ${
              active
                ? "border-green-700 bg-green-50 shadow-sm"
                : hasError
                  ? "border-red-200 bg-white hover:border-green-400 hover:bg-slate-50"
                  : "border-slate-200 bg-white hover:border-green-400 hover:bg-slate-50"
            }`}
          >
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                active
                  ? "bg-green-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {num}
            </div>

            <div className="mt-2 truncate text-[11px] leading-tight text-slate-500">
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SkeletonInput() {
  return <div className="h-9 animate-pulse rounded-lg bg-slate-200" />;
}
