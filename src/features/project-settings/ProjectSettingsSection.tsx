import type { Project } from "../../domain/project/Project";

type ProjectSettingsSectionProps = {
  project: Project;
  disabled: boolean;
  onChange: (field: keyof Project, value: string | number) => void;
};

export function ProjectSettingsSection({
  project,
  disabled,
  onChange,
}: ProjectSettingsSectionProps) {
  return (
    <div className="settingsSection">
      <h3 className="settingsSectionTitle">작성 조건</h3>

      <label className="label">과목/영역</label>
      <input
        className="input"
        value={project.subject}
        disabled={disabled}
        onChange={(event) => onChange("subject", event.target.value)}
      />

      <label className="label">주제</label>
      <input
        className="input"
        value={project.theme}
        disabled={disabled}
        onChange={(event) => onChange("theme", event.target.value)}
      />

      <label className="label">평균 분량(자)</label>
      <input
        className="input"
        type="number"
        min={50}
        step={10}
        value={project.avgLength}
        disabled={disabled}
        onChange={(event) => onChange("avgLength", Number(event.target.value))}
      />

      <label className="label">형식</label>
      <textarea
        className="textarea"
        rows={4}
        value={project.format}
        disabled={disabled}
        onChange={(event) => onChange("format", event.target.value)}
      />

      <label className="label">예시 글</label>
      <textarea
        className="textarea"
        rows={6}
        value={project.example}
        disabled={disabled}
        onChange={(event) => onChange("example", event.target.value)}
      />

      <p className="muted">
        예시 글은 “문장감/톤/구성” 참고용입니다. 실제 내용은 학생 기록 기반으로
        재작성되도록 프롬프트에서 강제합니다.
      </p>

    </div>
  );
}
