import type { ComplianceFinding } from "../../domain/compliance/ComplianceCheck";
import { AlertIcon } from "../../shared/icons";

type ComplianceNoticeProps = {
  findings: ComplianceFinding[];
};

/* 부모의 사회·경제적 지위처럼 문장 단위로 걸리는 규칙이 있다. 그대로 옮기면
   경고 한 줄이 결과 전체만큼 길어지므로, 어디를 봐야 하는지 알아볼 만큼만
   보여준다. 전체 문장은 바로 위 결과 칸에 그대로 있다. */
const MAX_MATCHED_LENGTH = 32;

function shorten(text: string) {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > MAX_MATCHED_LENGTH
    ? `${single.slice(0, MAX_MATCHED_LENGTH)}…`
    : single;
}

/* 기재요령이 금지한 표현이 결과에 남아 있는지 알린다.
   여기 걸린 것이 곧 위반은 아니다. 문맥에 따라 문제가 없을 수도 있으므로
   '지웠습니다'가 아니라 '확인하세요'라고 말하고 판단은 교사에게 남긴다. */
export function ComplianceNotice({ findings }: ComplianceNoticeProps) {
  if (findings.length === 0) return null;

  /* 같은 규칙에 여러 표현이 걸리면 한 줄로 모아 보여준다. */
  const grouped = new Map<string, { label: string; hint: string; matched: string[] }>();
  for (const finding of findings) {
    const entry = grouped.get(finding.ruleId) ?? {
      label: finding.label,
      hint: finding.hint,
      matched: [],
    };
    entry.matched.push(finding.matched);
    grouped.set(finding.ruleId, entry);
  }

  return (
    <div className="complianceNotice" role="status">
      <p className="complianceNoticeHead">
        <AlertIcon size={13} />
        기재요령에서 금지한 표현이 {grouped.size}건 있습니다. 확인해 주세요.
      </p>
      <ul className="complianceList">
        {[...grouped].map(([ruleId, entry]) => (
          <li key={ruleId}>
            <span className="complianceLabel">{entry.label}</span>
            <span className="complianceMatched">
              {entry.matched.map((text) => `“${shorten(text)}”`).join(", ")}
            </span>
            <span className="complianceHint">{entry.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
