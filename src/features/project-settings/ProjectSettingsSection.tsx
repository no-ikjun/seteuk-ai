import type { GenerationSettings } from "../../domain/generation/Generation";
import type { Project } from "../../domain/project/Project";

type ProjectSettingsSectionProps = {
  project: Project;
  generationSettings: GenerationSettings;
  disabled: boolean;
  onChange: (field: keyof Project, value: string | number) => void;
  onGenerationSettingChange: (
    field: keyof GenerationSettings,
    value: string | number,
  ) => void;
};

export function ProjectSettingsSection({
  project,
  generationSettings,
  disabled,
  onChange,
  onGenerationSettingChange,
}: ProjectSettingsSectionProps) {
  return (
    <div className="card">
      <h2>2. 프로젝트 입력 (교사 입력 5가지)</h2>

      <label className="label">1. 과목/영역</label>
      <input
        className="input"
        value={project.subject}
        disabled={disabled}
        onChange={(event) => onChange("subject", event.target.value)}
      />

      <label className="label">2. 주제</label>
      <input
        className="input"
        value={project.theme}
        disabled={disabled}
        onChange={(event) => onChange("theme", event.target.value)}
      />

      <label className="label">3. 평균 분량(자)</label>
      <input
        className="input"
        type="number"
        min={50}
        step={10}
        value={project.avgLength}
        disabled={disabled}
        onChange={(event) => onChange("avgLength", Number(event.target.value))}
      />

      <label className="label">4. 형식</label>
      <textarea
        className="textarea"
        rows={4}
        value={project.format}
        disabled={disabled}
        onChange={(event) => onChange("format", event.target.value)}
      />

      <label className="label">5. 예시 글</label>
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

      <h3 className="subheading">생성 안정성 설정</h3>
      <div className="settingsGrid">
        <label>
          <span className="label">OpenAI 모델</span>
          <select
            className="select"
            value={generationSettings.model}
            disabled={disabled}
            onChange={(event) =>
              onGenerationSettingChange("model", event.target.value)
            }
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
          </select>
        </label>
        <label>
          <span className="label">요청 제한 시간(초)</span>
          <input
            className="input"
            type="number"
            min={10}
            max={120}
            value={generationSettings.requestTimeoutSeconds}
            disabled={disabled}
            onChange={(event) =>
              onGenerationSettingChange(
                "requestTimeoutSeconds",
                Number(event.target.value),
              )
            }
          />
        </label>
        <label>
          <span className="label">자동 재시도(회)</span>
          <input
            className="input"
            type="number"
            min={0}
            max={3}
            value={generationSettings.maxRetries}
            disabled={disabled}
            onChange={(event) =>
              onGenerationSettingChange("maxRetries", Number(event.target.value))
            }
          />
        </label>
        <label>
          <span className="label">학생 간 요청 간격(ms)</span>
          <input
            className="input"
            type="number"
            min={0}
            max={10000}
            step={100}
            value={generationSettings.batchDelayMs}
            disabled={disabled}
            onChange={(event) =>
              onGenerationSettingChange("batchDelayMs", Number(event.target.value))
            }
          />
        </label>
      </div>
      <p className="muted">
        네트워크·속도 제한·서버 오류만 제한적으로 재시도합니다. 인증·결제 한도
        오류는 자동 재시도하지 않습니다.
      </p>
    </div>
  );
}
