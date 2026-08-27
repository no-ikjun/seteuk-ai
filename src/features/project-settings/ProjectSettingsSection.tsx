import type { ProjectField, Project } from "../../domain/project/Project";
import {
  recordOptions,
  SCHOOL_LEVELS,
  subjectField,
  type RecordType,
  type SchoolLevel,
} from "../../domain/record/RecordSpec";
import {
  hangulCharsFor,
  recordByteLimit,
} from "../../domain/record/NeisBytes";
import { SelectField } from "../../shared/forms/SelectField";
import { AlertIcon } from "../../shared/icons";
import { Field } from "./Field";

type ProjectSettingsSectionProps = {
  project: Project;
  missing: ProjectField[];
  disabled: boolean;
  onChange: (field: keyof Project, value: string | number) => void;
};

/* 무엇에 대한 기록을 쓰는지 정하는 영역.
   학교급과 항목이 기재요령의 작성 기준과 금지 사항을 가르므로 맨 위에 둔다.
   그 아래 칸들은 학교급·항목에 따라 묻는 말이 달라진다. */
export function ProjectSettingsSection({
  project,
  missing,
  disabled,
  onChange,
}: ProjectSettingsSectionProps) {
  const records = recordOptions(project.schoolLevel);
  const selectedRecord = records.find(
    (record) => record.value === project.recordType,
  );
  const subject = subjectField(project.recordType);
  const limit = recordByteLimit(project.schoolLevel, project.recordType);

  return (
    <section className="settingsSection">
      <h3 className="settingsSectionTitle">무엇을 쓰나요</h3>

      <div className="fieldRow">
        <Field label="학교급" hint="기재요령의 기준이 학교급마다 다릅니다.">
          <SelectField
            value={project.schoolLevel}
            disabled={disabled}
            onChange={(event) =>
              onChange("schoolLevel", event.target.value as SchoolLevel)
            }
          >
            {SCHOOL_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </SelectField>
        </Field>

        <Field label="기록 항목" hint={selectedRecord?.hint}>
          <SelectField
            value={project.recordType}
            disabled={disabled}
            onChange={(event) =>
              onChange("recordType", event.target.value as RecordType)
            }
          >
            {records.map((record) => (
              <option key={record.value} value={record.value}>
                {record.label}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <div className="fieldRow">
        {/* 행동특성 및 종합의견은 특정 교과나 활동에 매이지 않아 묻지 않는다. */}
        {subject && (
          <Field
            label={subject.label}
            hint={subject.hint}
            missing={missing.includes("subject")}
          >
            <input
              className="input"
              value={project.subject}
              placeholder={subject.placeholder}
              disabled={disabled}
              onChange={(event) => onChange("subject", event.target.value)}
            />
          </Field>
        )}

        <Field
          label="주제"
          hint="이번에 쓰는 기록이 무엇을 다루는지 한 줄로 적습니다."
          missing={missing.includes("theme")}
        >
          <input
            className="input"
            value={project.theme}
            placeholder="예: 독서 활동 기반 탐구"
            disabled={disabled}
            onChange={(event) => onChange("theme", event.target.value)}
          />
        </Field>
      </div>

      <div className="fieldRow">
        <Field
          label="목표 분량(Byte)"
          hint={
            limit === null
              ? `이 학교급의 이 항목에는 글자수 제한이 없습니다. 한글 약 ${hangulCharsFor(project.targetBytes)}자.`
              : `나이스 한도 ${limit.toLocaleString()}Byte(한글 ${hangulCharsFor(limit)}자). 현재 목표는 한글 약 ${hangulCharsFor(project.targetBytes)}자.`
          }
          missing={missing.includes("targetBytes")}
        >
          <input
            className="input"
            type="number"
            min={30}
            step={30}
            value={project.targetBytes}
            disabled={disabled}
            onChange={(event) =>
              onChange("targetBytes", Number(event.target.value))
            }
          />
        </Field>

        {limit !== null && project.targetBytes > limit && (
          <p className="warn">
            <AlertIcon />
            <span>
              목표가 나이스 한도({limit.toLocaleString()}Byte)를 넘습니다.
              이대로 두면 결과를 나이스에 그대로 넣을 수 없습니다.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
