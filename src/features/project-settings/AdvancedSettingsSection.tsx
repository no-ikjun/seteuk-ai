import type { GenerationSettings } from "../../domain/generation/Generation";
import type { CuratedModel } from "../../domain/generation/ModelCatalog";
import { ChevronDownIcon } from "../../shared/icons";
import { ModelSelectField } from "./ModelSelectField";
import type { ModelAvailabilityStatus } from "./useModelCatalog";

type AdvancedSettingsSectionProps = {
  generationSettings: GenerationSettings;
  models: CuratedModel[];
  modelStatus: ModelAvailabilityStatus;
  disabled: boolean;
  onChange: (field: keyof GenerationSettings, value: string | number) => void;
};

/* 모델과 재시도 설정. 재시도 쪽은 기본값으로 두는 사용자가 대부분이라
   접어 두지만, 접힌 줄에 지금 쓰는 모델을 보여 준다. 어떤 모델로
   생성하는지는 접힌 채로도 알 수 있어야 한다.
   상태를 따로 두지 않으려고 <details>를 그대로 쓴다. */
export function AdvancedSettingsSection({
  generationSettings,
  models,
  modelStatus,
  disabled,
  onChange,
}: AdvancedSettingsSectionProps) {
  return (
    <details className="settingsSection advancedSettings">
      <summary className="settingsSectionTitle advancedSummary">
        <ChevronDownIcon className="advancedChevron" size={14} />
        모델: {generationSettings.model || "미선택"} · 고급 설정
      </summary>

      <ModelSelectField
        model={generationSettings.model}
        models={models}
        status={modelStatus}
        disabled={disabled}
        onChange={(model) => onChange("model", model)}
      />

      <div className="settingsGrid">
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
