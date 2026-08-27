import type {
  CuratedModel,
  ModelGrade,
} from "../../domain/generation/ModelCatalog";
import type { ModelAvailabilityStatus } from "./useModelCatalog";

const GRADE_STEPS: ModelGrade[] = [1, 2, 3];
const GRADE_WORDS = ["낮음", "보통", "높음"] as const;

type GradeMeterProps = {
  label: string;
  grade: ModelGrade;
  tone: "performance" | "cost";
};

/* 성능과 비용을 숫자 대신 세 칸으로 보여준다. 단가는 수시로 바뀌어 앱에
   금액을 적어 둘 수 없고, 선생님에게 필요한 것도 '무엇이 더 비싼가'라는
   비교이지 정확한 액수가 아니다. */
function GradeMeter({ label, grade, tone }: GradeMeterProps) {
  return (
    <span className="gradeMeter">
      <span className="gradeMeterLabel">{label}</span>
      <span
        className={`gradeMeterBars ${tone}`}
        role="img"
        aria-label={`${label} ${GRADE_WORDS[grade - 1]}`}
      >
        {GRADE_STEPS.map((step) => (
          <span
            key={step}
            className={step <= grade ? "gradeBar filled" : "gradeBar"}
          />
        ))}
      </span>
    </span>
  );
}

type ModelSelectFieldProps = {
  model: string;
  models: CuratedModel[];
  status: ModelAvailabilityStatus;
  disabled: boolean;
  onChange: (model: string) => void;
};

export function ModelSelectField({
  model,
  models,
  status,
  disabled,
  onChange,
}: ModelSelectFieldProps) {
  /* 고른 모델이 목록에서 빠지면 아무 것도 선택되지 않은 채로 보인다.
     보통은 조회 직후 쓸 수 있는 모델로 옮겨 가지만, 그 사이를 비워 두지 않는다. */
  const listed = models.some((item) => item.id === model);

  return (
    <fieldset className="modelField" disabled={disabled}>
      <legend className="label">생성 모델</legend>

      <div className="modelOptions">
        {models.map((item) => (
          <label
            key={item.id}
            className={item.id === model ? "modelOption selected" : "modelOption"}
          >
            <input
              type="radio"
              name="generation-model"
              className="modelOptionRadio"
              value={item.id}
              checked={item.id === model}
              onChange={() => onChange(item.id)}
            />
            <span className="modelOptionBody">
              <span className="modelOptionHead">
                <span className="modelOptionName">{item.name}</span>
                <span className="modelOptionId">{item.id}</span>
              </span>
              <span className="modelOptionMeters">
                <GradeMeter
                  label="품질"
                  grade={item.performance}
                  tone="performance"
                />
                <GradeMeter label="비용" grade={item.cost} tone="cost" />
              </span>
              <span className="modelOptionSummary">{item.summary}</span>
            </span>
          </label>
        ))}
      </div>

      {!listed && (
        <p className="muted">
          선택한 모델({model})을 이 계정에서 쓸 수 없어 목록에서 제외했습니다.
          위에서 다른 모델을 골라 주세요.
        </p>
      )}

      {status === "failed" && (
        <p className="muted">
          이 계정에서 어떤 모델을 쓸 수 있는지 확인하지 못했습니다. 생성할 때
          권한 오류가 나면 다른 모델을 골라 주세요.
        </p>
      )}
    </fieldset>
  );
}
