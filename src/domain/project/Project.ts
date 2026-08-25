export type Project = {
  subject: string;
  theme: string;
  avgLength: number;
  format: string;
  example: string;
};

export const DEFAULT_PROJECT: Project = {
  subject: "국어",
  theme: "독서 활동 기반 세특",
  avgLength: 420,
  format:
    "교사 관찰자 시점(3인칭). 활동/과정/태도/성장 중심. 구체적 근거를 1~2개 포함. 과장 금지. 문장 3~5개.",
  example:
    "학생은 독서 활동에서 핵심 개념을 스스로 재구성하며 이해를 확장하는 태도를 보임. 작품의 주제 의식을 자신의 경험과 연결해 해석하고, 근거를 들어 의견을 정리함. 토론 과정에서도 타인의 관점을 경청하며 논지를 보완해 나가며, 질문을 통해 논의의 깊이를 더함.",
};

export function isProjectValid(project: Project) {
  return Boolean(
    project.subject.trim() &&
      project.theme.trim() &&
      Number.isFinite(project.avgLength) &&
      project.avgLength > 0 &&
      project.format.trim() &&
      project.example.trim(),
  );
}
