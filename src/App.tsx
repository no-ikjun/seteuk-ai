import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { parseFile, type Row } from "./lib/parseSheet";
import { generateSeeteuk } from "./lib/api";
import * as XLSX from "xlsx";

type Project = {
  subject: string; // 1) 과목/영역
  theme: string; // 2) 주제
  avgLength: number; // 3) 평균 분량(자)
  format: string; // 4) 형식
  example: string; // 5) 예시 글
};

type ColumnMapping = {
  displayKey: string; // 화면 표시용(서버 전송 안 함)
  activityKeys: string[]; // 활동 텍스트로 합칠 컬럼들
};

function joinActivity(row: Row, keys: string[]) {
  const parts = keys
    .map((k) => {
      const v = (row[k] ?? "").trim();
      if (!v) return "";
      return `${k}: ${v}`;
    })
    .filter(Boolean);
  return parts.join("\n");
}

function clampText(s: string, max = 6000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n...(이하 생략: 입력이 너무 길어 일부만 전송됨)";
}

export default function App() {
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);

  const [project, setProject] = useState<Project>({
    subject: "국어",
    theme: "독서 활동 기반 세특",
    avgLength: 420,
    format:
      "교사 관찰자 시점(3인칭). 활동/과정/태도/성장 중심. 구체적 근거를 1~2개 포함. 과장 금지. 문장 3~5개.",
    example:
      "학생은 독서 활동에서 핵심 개념을 스스로 재구성하며 이해를 확장하는 태도를 보임. 작품의 주제 의식을 자신의 경험과 연결해 해석하고, 근거를 들어 의견을 정리함. 토론 과정에서도 타인의 관점을 경청하며 논지를 보완해 나가며, 질문을 통해 논의의 깊이를 더함.",
  });

  const [mapping, setMapping] = useState<ColumnMapping>({
    displayKey: "",
    activityKeys: [],
  });

  const [idx, setIdx] = useState(0);

  // API Key: 메모리에만 저장 (앱 실행 시마다 입력)
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(true); // 시작 시 모달 표시
  const [apiKeyInput, setApiKeyInput] = useState("");

  // 학생별 입력/결과를 저장 (row index 기준)
  const [extraByIdx, setExtraByIdx] = useState<Record<number, string>>({});
  const [resultByIdx, setResultByIdx] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 일괄 생성 상태
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchDone, setBatchDone] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchFailed, setBatchFailed] = useState(0);
  const cancelBatchRef = useRef(false);

  const currentRow = rows[idx];

  // API Key 입력 확인
  function onConfirmApiKey(inputKey: string) {
    const v = inputKey.trim();
    if (!v) {
      setError("API Key를 입력해주세요.");
      return;
    }
    if (!v.startsWith("sk-")) {
      setError("API Key는 sk- 로 시작해야 합니다.");
      return;
    }
    setApiKey(v);
    setShowApiKeyModal(false);
    setError("");
  }

  const currentDisplay = useMemo(() => {
    if (!currentRow) return "";
    const key = mapping.displayKey;
    if (!key) return `#${idx + 1}`;
    return (currentRow[key] ?? "").trim() || `#${idx + 1}`;
  }, [currentRow, idx, mapping.displayKey]);

  const currentActivityText = useMemo(() => {
    if (!currentRow) return "";
    return joinActivity(currentRow, mapping.activityKeys);
  }, [currentRow, mapping.activityKeys]);

  const canGenerate =
    !!apiKey &&
    !!currentRow &&
    project.subject.trim() &&
    project.theme.trim() &&
    Number.isFinite(project.avgLength) &&
    project.avgLength > 0 &&
    project.format.trim() &&
    project.example.trim() &&
    mapping.activityKeys.length > 0;

  useEffect(() => {
    if (idx >= rows.length) setIdx(Math.max(0, rows.length - 1));
  }, [rows.length, idx]);

  async function onUpload(file: File) {
    setError("");
    setFileName(file.name);

    const parsed = await parseFile(file);
    if (parsed.length === 0) {
      setRows([]);
      setCols([]);
      setMapping({ displayKey: "", activityKeys: [] });
      return;
    }

    const keys = Object.keys(parsed[0]);
    setRows(parsed);
    setCols(keys);

    // 기본 매핑 추정
    const guessDisplay =
      keys.find((k) => /이름|성명|학생명|name/i.test(k)) ?? keys[0] ?? "";
    const activityGuess = keys.filter(
      (k) => !/이름|성명|학번|번호|id/i.test(k)
    );

    setMapping({
      displayKey: guessDisplay,
      activityKeys: activityGuess.length
        ? activityGuess
        : keys.slice(0, Math.min(3, keys.length)),
    });

    setIdx(0);
  }

  function toggleActivityKey(k: string) {
    setMapping((m) => {
      const has = m.activityKeys.includes(k);
      const next = has
        ? m.activityKeys.filter((x) => x !== k)
        : [...m.activityKeys, k];
      return { ...m, activityKeys: next };
    });
  }

  async function onGenerateOne(targetIdx: number) {
    if (!apiKey) {
      throw new Error(
        "API Key가 입력되지 않았습니다. 앱 시작 시 입력한 키를 확인해주세요."
      );
    }
    const { text } = await generateSeeteuk(apiKey, {
      project,
      student: {
        activityText: clampText(
          joinActivity(rows[targetIdx], mapping.activityKeys)
        ),
        extraKeywords: (extraByIdx[targetIdx] ?? "").trim(),
      },
    });

    setResultByIdx((prev) => ({ ...prev, [targetIdx]: text }));
  }

  async function onGenerateCurrent() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    try {
      await onGenerateOne(idx);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    const t = resultByIdx[idx] ?? "";
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      // Tauri에서는 alert가 작동하지 않을 수 있으므로 에러 상태로 성공 표시
      setError(""); // 성공 시 에러 메시지 초기화
    } catch (e) {
      setError("복사 실패: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function exportXLSX() {
    if (rows.length === 0) return;

    const displayKey = mapping.displayKey;
    const base = fileName ? fileName.replace(/\.[^.]+$/, "") : "seeteuk";
    const outName = `${base}_seeteuk_results.xlsx`;

    const sheetRows = rows.map((r, i) => {
      const display = displayKey ? (r[displayKey] ?? "").trim() : `#${i + 1}`;
      const extra = (extraByIdx[i] ?? "").trim();
      const result = (resultByIdx[i] ?? "").trim();

      return {
        index: i + 1,
        display,
        extra_keywords: extra,
        result,
      };
    });

    const generatedCount = Object.values(resultByIdx).filter(
      (v) => (v ?? "").trim().length > 0
    ).length;

    const metaRows = [
      { key: "subject", value: project.subject },
      { key: "theme", value: project.theme },
      { key: "avgLength", value: String(project.avgLength) },
      { key: "format", value: project.format },
      { key: "example", value: project.example },
      { key: "sourceFile", value: fileName },
      { key: "generatedCount", value: `${generatedCount}/${rows.length}` },
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(sheetRows, {
      header: ["index", "display", "extra_keywords", "result"],
    });

    ws1["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 80 }];

    const ws2 = XLSX.utils.json_to_sheet(metaRows, {
      header: ["key", "value"],
    });
    ws2["!cols"] = [{ wch: 16 }, { wch: 90 }];

    XLSX.utils.book_append_sheet(wb, ws1, "results");
    XLSX.utils.book_append_sheet(wb, ws2, "project_meta");

    XLSX.writeFile(wb, outName, { bookType: "xlsx" });
  }

  async function generateAll() {
    if (!canGenerate || rows.length === 0) return;

    // 키 없으면 먼저 막기(UX)
    if (!apiKey) {
      setError(
        "API Key가 입력되지 않았습니다. 앱 시작 시 입력한 키를 확인해주세요."
      );
      setShowApiKeyModal(true);
      return;
    }

    setError("");
    setBatchRunning(true);
    cancelBatchRef.current = false;

    const targets = rows
      .map((_, i) => i)
      .filter((i) => !(resultByIdx[i] ?? "").trim());

    setBatchTotal(targets.length);
    setBatchDone(0);
    setBatchFailed(0);

    let done = 0;
    let failed = 0;

    try {
      for (const i of targets) {
        if (cancelBatchRef.current) break;

        try {
          await onGenerateOne(i);
        } catch {
          failed += 1;
          setBatchFailed(failed);
        } finally {
          done += 1;
          setBatchDone(done);
          await new Promise((r) => setTimeout(r, 120));
        }
      }
    } finally {
      setBatchRunning(false);
    }
  }

  function cancelBatch() {
    cancelBatchRef.current = true;
  }

  const generatedCount = useMemo(() => {
    return Object.values(resultByIdx).filter((v) => (v ?? "").trim().length > 0)
      .length;
  }, [resultByIdx]);

  const batchProgressText = batchRunning
    ? `일괄 생성 중: ${batchDone}/${batchTotal} (실패 ${batchFailed})`
    : batchTotal > 0
    ? `일괄 생성 완료: ${batchDone}/${batchTotal} (실패 ${batchFailed})`
    : "";

  return (
    <div className="wrap">
      {/* API Key 입력 모달 */}
      {showApiKeyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "500px",
              width: "90%",
              padding: "24px",
            }}
          >
            <h2>OpenAI API Key 입력</h2>
            <p className="muted" style={{ marginBottom: "16px" }}>
              앱 사용을 위해 OpenAI API Key를 입력해주세요. (이 PC에 저장되지
              않습니다)
            </p>
            <input
              className="input"
              type="password"
              placeholder="OpenAI API Key (sk-...)"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onConfirmApiKey(apiKeyInput);
                }
              }}
              autoFocus
            />
            {error && (
              <p className="error" style={{ marginTop: "8px" }}>
                {error}
              </p>
            )}
            <div className="row gap" style={{ marginTop: "16px" }}>
              <button
                className="btn primary"
                type="button"
                onClick={() => onConfirmApiKey(apiKeyInput)}
                disabled={!apiKeyInput.trim()}
              >
                확인
              </button>
              {apiKey && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setApiKeyInput("");
                    setError("");
                  }}
                >
                  취소
                </button>
              )}
            </div>
            {!apiKey && (
              <p className="mutedSmall" style={{ marginTop: "12px" }}>
                ⚠️ API Key는 이 PC에 저장되지 않습니다. 앱을 종료하면 다시
                입력해야 합니다.
              </p>
            )}
          </div>
        </div>
      )}

      <header className="header">
        {/* 👇 이 블록만 드래그 가능 */}
        <div className="headerLeft" data-tauri-drag-region>
          <h1>세특 자동 작성기 (로컬)</h1>
          <p className="sub">
            엑셀 업로드 → 프로젝트 입력(5항목) → 학생별/일괄 생성 → 엑셀(.xlsx)
            저장
          </p>
        </div>

        {/* 👇 이 블록은 무조건 클릭 가능 */}
        <div className="headerRight">
          <div className="row gap">
            <span className="badge">
              {apiKey ? "API Key 입력됨 ✅" : "API Key 필요"}
            </span>

            {apiKey && (
              <button
                className="btn"
                type="button"
                onClick={() => setShowApiKeyModal(true)}
              >
                API Key 변경
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="card">
        <h2>1. 파일 업로드</h2>
        <div className="row">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
          {fileName ? (
            <span className="badge">{fileName}</span>
          ) : (
            <span className="muted">.xlsx/.csv</span>
          )}
          {rows.length > 0 && (
            <span className="badge">
              생성됨 {generatedCount}/{rows.length}
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <p className="muted">
            총 <b>{rows.length}</b>명 · 컬럼 <b>{cols.length}</b>개
          </p>
        )}
        {rows.length === 0 && (
          <p className="muted">
            ※ 업로드한 원본 데이터는 PC에 저장되지 않습니다. 앱을 종료하면 모든
            데이터가 초기화됩니다.
          </p>
        )}
      </section>

      <section className="grid">
        <div className="card">
          <h2>2. 프로젝트 입력 (교사 입력 5가지)</h2>

          <label className="label">1. 과목/영역</label>
          <input
            className="input"
            value={project.subject}
            onChange={(e) =>
              setProject((p) => ({ ...p, subject: e.target.value }))
            }
          />

          <label className="label">2. 주제</label>
          <input
            className="input"
            value={project.theme}
            onChange={(e) =>
              setProject((p) => ({ ...p, theme: e.target.value }))
            }
          />

          <label className="label">3. 평균 분량(자)</label>
          <input
            className="input"
            type="number"
            min={50}
            step={10}
            value={project.avgLength}
            onChange={(e) =>
              setProject((p) => ({ ...p, avgLength: Number(e.target.value) }))
            }
          />

          <label className="label">4. 형식</label>
          <textarea
            className="textarea"
            rows={4}
            value={project.format}
            onChange={(e) =>
              setProject((p) => ({ ...p, format: e.target.value }))
            }
          />

          <label className="label">5. 예시 글</label>
          <textarea
            className="textarea"
            rows={6}
            value={project.example}
            onChange={(e) =>
              setProject((p) => ({ ...p, example: e.target.value }))
            }
          />

          <p className="muted">
            예시 글은 “문장감/톤/구성” 참고용입니다. 실제 내용은 학생 기록
            기반으로 재작성되도록 프롬프트에서 강제합니다.
          </p>
        </div>

        <div className="card">
          <h2>3. 컬럼 매핑</h2>
          {cols.length === 0 ? (
            <p className="muted">파일을 업로드하면 컬럼이 여기에 표시됨.</p>
          ) : (
            <>
              <label className="label">학생 표시용 컬럼(서버 전송 안 함)</label>
              <select
                className="select"
                value={mapping.displayKey}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, displayKey: e.target.value }))
                }
              >
                {cols.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="label">
                활동 텍스트로 합칠 컬럼(복수 선택)
              </label>
              <div className="pillBox">
                {cols.map((c) => {
                  const on = mapping.activityKeys.includes(c);
                  return (
                    <button
                      key={c}
                      className={`pill ${on ? "on" : ""}`}
                      type="button"
                      onClick={() => toggleActivityKey(c)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <p className="muted">
                선택된 컬럼은 <code>컬럼명: 값</code> 형태로 합쳐서 모델에
                전달됨.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h2>4. 학생별 생성 / 일괄 생성 / 내보내기</h2>

        {rows.length === 0 ? (
          <p className="muted">먼저 엑셀 파일을 업로드하세요.</p>
        ) : (
          <>
            <div className="row gap">
              <button
                className="btn"
                type="button"
                onClick={() => exportXLSX()}
                disabled={rows.length === 0}
              >
                엑셀(.xlsx)로 저장
              </button>

              <button
                className="btn primary"
                type="button"
                onClick={() => void generateAll()}
                disabled={!canGenerate || batchRunning}
              >
                {batchRunning
                  ? "일괄 생성 중..."
                  : "결과 없는 학생만 일괄 생성"}
              </button>

              {batchRunning && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => cancelBatch()}
                >
                  일괄 생성 중단
                </button>
              )}

              {batchProgressText && (
                <span className="badge">{batchProgressText}</span>
              )}
            </div>

            <div className="nav">
              <button
                className="btn"
                type="button"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0 || batchRunning}
              >
                ← 이전
              </button>

              <div className="navCenter">
                <div className="title">
                  {currentDisplay}{" "}
                  <span className="mutedSmall">
                    ({idx + 1}/{rows.length})
                  </span>
                </div>
              </div>

              <button
                className="btn"
                type="button"
                onClick={() => setIdx((i) => Math.min(rows.length - 1, i + 1))}
                disabled={idx === rows.length - 1 || batchRunning}
              >
                다음 →
              </button>
            </div>

            <div className="twoCol">
              <div>
                <label className="label">학생 활동 기록(미리보기)</label>
                <textarea
                  className="textarea mono"
                  rows={10}
                  value={currentActivityText}
                  readOnly
                />
                {mapping.activityKeys.length === 0 && (
                  <p className="warn">
                    활동 컬럼을 1개 이상 선택해야 생성할 수 있음.
                  </p>
                )}
              </div>

              <div>
                <label className="label">교사 추가 키워드(선택)</label>
                <textarea
                  className="textarea"
                  rows={5}
                  placeholder="예: 발표 주도, 질문이 많음, 근거 제시 우수, 토론 태도 성실, 자기주도 탐구"
                  value={extraByIdx[idx] ?? ""}
                  onChange={(e) =>
                    setExtraByIdx((prev) => ({
                      ...prev,
                      [idx]: e.target.value,
                    }))
                  }
                  disabled={batchRunning}
                />

                <div className="row gap">
                  <button
                    className="btn primary"
                    type="button"
                    disabled={!canGenerate || loading || batchRunning}
                    onClick={() => void onGenerateCurrent()}
                  >
                    {loading ? "생성 중..." : "현재 학생 생성"}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => void copyResult()}
                    disabled={!resultByIdx[idx]}
                  >
                    결과 복사
                  </button>
                </div>

                {error && <p className="error">에러: {error}</p>}

                <label className="label">생성 결과</label>
                <textarea
                  className="textarea"
                  rows={10}
                  value={resultByIdx[idx] ?? ""}
                  readOnly
                />
              </div>
            </div>
          </>
        )}
      </section>

      <footer className="foot">
        <span className="mutedSmall" style={{ marginRight: 10 }}>
          ⚠️ 권장: 이름/학번 등 식별정보 컬럼은 “활동 컬럼”에서 제외할 것.
        </span>
      </footer>
    </div>
  );
}
