import {
  isIdentifierColumn,
  type ColumnMapping,
} from "../../domain/student/StudentRecord";
import { SelectField } from "../../shared/forms/SelectField";
import { AlertIcon } from "../../shared/icons";

type ColumnMappingSectionProps = {
  columns: string[];
  mapping: ColumnMapping;
  disabled: boolean;
  onDisplayChange: (column: string) => void;
  onActivityToggle: (column: string) => void;
};

export function ColumnMappingSection({
  columns,
  mapping,
  disabled,
  onDisplayChange,
  onActivityToggle,
}: ColumnMappingSectionProps) {
  const selectedIdentifierColumns = mapping.activityKeys.filter(
    isIdentifierColumn,
  );
  return (
    <section className="settingsSection">
      <h3 className="settingsSectionTitle">어떤 데이터를 보내나요</h3>
      {columns.length === 0 ? (
        <p className="muted">파일을 업로드하면 컬럼이 여기에 표시됩니다.</p>
      ) : (
        <>
          <label className="label">학생 표시용 컬럼</label>
          <p className="fieldHint">화면에서 학생을 구분할 때만 씁니다. AI로 보내지 않습니다.</p>
          <SelectField
            value={mapping.displayKey}
            disabled={disabled}
            onChange={(event) => onDisplayChange(event.target.value)}
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </SelectField>

          <label className="label">AI로 보낼 활동 컬럼</label>
          <p className="fieldHint">고른 컬럼만 전송됩니다. 여러 개를 고를 수 있습니다.</p>
          <div className="pillBox">
            {columns.map((column) => {
              const selected = mapping.activityKeys.includes(column);
              return (
                <button
                  key={column}
                  className={`pill ${selected ? "on" : ""}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onActivityToggle(column)}
                >
                  {column}
                </button>
              );
            })}
          </div>

          <p className="muted">
            선택된 컬럼은 <code>컬럼명: 값</code> 형태로 합쳐서 모델에
            전달됩니다. 이름·학번 등 식별정보 컬럼은 선택하지 않는 것을
            권장합니다.
          </p>
          {selectedIdentifierColumns.length > 0 && (
            <p className="warn privacyWarning">
              <AlertIcon />
              <span>
                식별정보로 추정되는 컬럼이 AI 전송 대상에 포함되어 있습니다:{" "}
                {selectedIdentifierColumns.join(", ")}. 꼭 필요한 경우가
                아니라면 선택을 해제하세요.
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
