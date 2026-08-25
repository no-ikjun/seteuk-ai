type ExportButtonProps = {
  disabled: boolean;
  onExport: () => void;
};

export function ExportButton({ disabled, onExport }: ExportButtonProps) {
  return (
    <button className="btn" type="button" onClick={onExport} disabled={disabled}>
      엑셀(.xlsx)로 저장
    </button>
  );
}
