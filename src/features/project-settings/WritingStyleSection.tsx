import type { Project, ProjectField } from "../../domain/project/Project";
import { writingStyle } from "../../domain/record/RecordSpec";
import { RetryIcon } from "../../shared/icons";
import { Field } from "./Field";

type WritingStyleSectionProps = {
  project: Project;
  missing: ProjectField[];
  disabled: boolean;
  onChange: (field: keyof Project, value: string | number) => void;
};

/* 문장의 결을 정하는 영역.
   무엇을 쓸지는 기재요령이 정하고(프롬프트에 들어간다), 여기서는 어떤 말투로
   쓸지만 정한다. 두 칸 모두 긴 글이라 나란히 두고 아래 줄을 통째로 쓴다. */
export function WritingStyleSection({
  project,
  missing,
  disabled,
  onChange,
}: WritingStyleSectionProps) {
  /* 빈 칸에서 시작하면 무엇을 적어야 할지 알 수 없다. 항목에 맞는 기본
     문장을 한 번에 넣고 고쳐 쓸 수 있게 한다. */
  function applyPreset() {
    const preset = writingStyle(project.recordType);
    onChange("format", preset.format);
    onChange("example", preset.example);
  }

  return (
    <section className="settingsSection">
      <div className="settingsSectionHead">
        <h3 className="settingsSectionTitle">어떤 말투로 쓸까요</h3>
        <button
          className="btn small"
          type="button"
          disabled={disabled}
          onClick={applyPreset}
        >
          <RetryIcon size={13} />이 항목의 기본 문체 넣기
        </button>
      </div>

      <div className="fieldRow">
        <Field
          label="서술 지침"
          hint="시점, 담을 내용, 문장 수처럼 형식에 관한 지시입니다."
          missing={missing.includes("format")}
        >
          <textarea
            className="textarea styleTextarea"
            value={project.format}
            disabled={disabled}
            onChange={(event) => onChange("format", event.target.value)}
          />
        </Field>

        <Field
          label="예시 글"
          hint="말투와 문장 길이만 참고합니다. 내용은 학생 기록으로 다시 씁니다."
          missing={missing.includes("example")}
        >
          <textarea
            className="textarea styleTextarea"
            value={project.example}
            disabled={disabled}
            onChange={(event) => onChange("example", event.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}
