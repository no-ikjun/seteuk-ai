import {
  isIdentifierColumn,
  type ColumnMapping,
} from "../../domain/student/StudentRecord";
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
    <div className="settingsSection">
      <h3 className="settingsSectionTitle">컬럼 매핑</h3>
      {columns.length === 0 ? (
        <p className="muted">파일을 업로드하면 컬럼이 여기에 표시됩니다.</p>
      ) : (
        <>
          <label className="label">학생 표시용 컬럼(AI 전송 제외)</label>
          <select
            className="select"
            value={mapping.displayKey}
            disabled={disabled}
            onChange={(event) => onDisplayChange(event.target.value)}
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>

          <label className="label">활동 텍스트로 합칠 컬럼(복수 선택)</label>
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
    </div>
  );
}
