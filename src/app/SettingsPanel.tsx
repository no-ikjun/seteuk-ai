import { useState } from "react";
import type { GenerationSettings } from "../domain/generation/Generation";
import type { CuratedModel } from "../domain/generation/ModelCatalog";
import type { Project } from "../domain/project/Project";
import {
  isIdentifierColumn,
  type ColumnMapping,
} from "../domain/student/StudentRecord";
import { ColumnMappingSection } from "../features/column-mapping/ColumnMappingSection";
import { FileSettingsSection } from "../features/file-import/FileSettingsSection";
import { AdvancedSettingsSection } from "../features/project-settings/AdvancedSettingsSection";
import { ProjectSettingsSection } from "../features/project-settings/ProjectSettingsSection";
import type { ModelAvailabilityStatus } from "../features/project-settings/useModelCatalog";
import { AlertIcon, ChevronDownIcon } from "../shared/icons";

type SettingsPanelProps = {
  fileName: string;
  studentCount: number;
  columnCount: number;
  generatedCount: number;
  columns: string[];
  project: Project;
  generationSettings: GenerationSettings;
  models: CuratedModel[];
  modelStatus: ModelAvailabilityStatus;
  mapping: ColumnMapping;
  disabled: boolean;
  onUpload: (file: File) => void;
  onDownloadBlankTemplate: () => void;
  onDownloadSample: () => void;
  onProjectChange: (field: keyof Project, value: string | number) => void;
  onGenerationSettingChange: (
    field: keyof GenerationSettings,
    value: string | number,
  ) => void;
  onDisplayChange: (column: string) => void;
  onActivityToggle: (column: string) => void;
};

/* 파일당 한 번 정하는 값을 한곳에 모은 영역.
   학생마다 반복하는 작업이 화면 첫 화면에 오도록 평소에는 접어 두고,
   접힌 줄에 현재 설정을 문장으로 보여준다.

   파일을 새로 열면 펼친 상태로 시작해 과목·컬럼을 확인하게 한다. App이
   파일 세션마다 다른 key를 주므로 이 컴포넌트가 다시 마운트되고, 별도의
   effect 없이 useState 초기값이 그 역할을 한다. */
export function SettingsPanel({
  fileName,
  studentCount,
  columnCount,
  generatedCount,
  columns,
  project,
  generationSettings,
  models,
  modelStatus,
  mapping,
  disabled,
  onUpload,
  onDownloadBlankTemplate,
  onDownloadSample,
  onProjectChange,
  onGenerationSettingChange,
  onDisplayChange,
  onActivityToggle,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(true);

  /* 접혀 있어도 이 경고만은 계속 보여야 한다. 개인정보 안내는 문서와
     화면이 어긋나면 안 되는 항목이다. */
  const identifierColumns = mapping.activityKeys.filter(isIdentifierColumn);

  const summary = [
    fileName,
    `학생 ${studentCount}명`,
    project.subject,
    project.theme,
    `${project.avgLength}자`,
    `활동 컬럼 ${mapping.activityKeys.length}개`,
  ]
    .filter((part) => String(part).trim().length > 0)
    .join(" · ");

  return (
    <section className="settingsPanel" aria-label="작성 설정">
      {/* 줄 전체가 여닫는 버튼이다. 버튼 안에는 phrasing content만 들어갈 수
          있어 요약은 <p>가 아니라 <span>으로 둔다. */}
      <button
        className="settingsBar"
        type="button"
        aria-expanded={open}
        aria-controls="settings-body"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="settingsSummary" title={summary}>
          {summary}
        </span>

        {identifierColumns.length > 0 && (
          <span className="settingsWarnChip">
            <AlertIcon size={13} />
            식별정보 포함: {identifierColumns.join(", ")}
          </span>
        )}

        {/* 줄 전체가 버튼이지만, 쉬고 있을 때도 여닫을 수 있다는 것이 보여야
            한다. 글자로 동작을 직접 말하고 테두리로 조작 대상임을 알린다. */}
        <span className="settingsToggle">
          {open ? "설정 접기" : "설정 펼치기"}
          <ChevronDownIcon
            size={14}
            className={open ? "settingsChevron open" : "settingsChevron"}
          />
        </span>
      </button>

      {open && (
        <div className="settingsBody" id="settings-body">
          <FileSettingsSection
            fileName={fileName}
            studentCount={studentCount}
            columnCount={columnCount}
            generatedCount={generatedCount}
            disabled={disabled}
            onUpload={onUpload}
            onDownloadBlankTemplate={onDownloadBlankTemplate}
            onDownloadSample={onDownloadSample}
          />

          <div className="settingsColumns">
            <ProjectSettingsSection
              project={project}
              disabled={disabled}
              onChange={onProjectChange}
            />
            <div className="settingsColumn">
              <ColumnMappingSection
                columns={columns}
                mapping={mapping}
                disabled={disabled}
                onDisplayChange={onDisplayChange}
                onActivityToggle={onActivityToggle}
              />
              <AdvancedSettingsSection
                generationSettings={generationSettings}
                models={models}
                modelStatus={modelStatus}
                disabled={disabled}
                onChange={onGenerationSettingChange}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
