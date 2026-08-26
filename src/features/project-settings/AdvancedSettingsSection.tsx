import type { GenerationSettings } from "../../domain/generation/Generation";
import { SelectField } from "../../shared/forms/SelectField";
import { ChevronDownIcon } from "../../shared/icons";

type AdvancedSettingsSectionProps = {
  generationSettings: GenerationSettings;
  disabled: boolean;
  onChange: (
    field: keyof GenerationSettings,
    value: string | number,
  ) => void;
};

/* 모델과 재시도 설정. 기본값으로 두는 사용자가 대부분이라 접어 둔다.
   상태를 따로 두지 않으려고 <details>를 그대로 쓴다. */
export function AdvancedSettingsSection({
  generationSettings,
  disabled,
  onChange,
}: AdvancedSettingsSectionProps) {
  return (
    <details className="settingsSection advancedSettings">
      <summary className="settingsSectionTitle advancedSummary">
        <ChevronDownIcon className="advancedChevron" size={14} />
        고급: 모델과 재시도
      </summary>

      <div className="settingsGrid">
        <label>
          <span className="label">OpenAI 모델</span>
          <SelectField
            value={generationSettings.model}
            disabled={disabled}
            onChange={(event) => onChange("model", event.target.value)}
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
          </SelectField>
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
              onChange("requestTimeoutSeconds", Number(event.target.value))
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
              onChange("maxRetries", Number(event.target.value))
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
              onChange("batchDelayMs", Number(event.target.value))
            }
          />
        </label>
      </div>
      <p className="muted">
        네트워크·속도 제한·서버 오류만 제한적으로 재시도합니다. 인증·결제 한도
        오류는 자동 재시도하지 않습니다.
      </p>
    </details>
  );
}
