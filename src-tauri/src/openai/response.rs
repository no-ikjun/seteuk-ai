pub(super) fn extract_output_text(json: &serde_json::Value) -> Option<String> {
    json.get("output_text")
        .and_then(|value| value.as_str())
        .or_else(|| {
            json.get("output")
                .and_then(|value| value.as_array())
                .and_then(|outputs| {
                    outputs.iter().find_map(|output| {
                        output
                            .get("content")
                            .and_then(|value| value.as_array())
                            .and_then(|contents| {
                                contents.iter().find_map(|content| {
                                    content.get("text").and_then(|value| value.as_str())
                                })
                            })
                    })
                })
        })
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_supported_response_shapes_and_rejects_empty_text() {
        let direct = serde_json::json!({ "output_text": " 결과 " });
        let nested = serde_json::json!({
          "output": [{ "content": [{ "text": "중첩 결과" }] }]
        });
        let after_reasoning = serde_json::json!({
          "output": [
            { "type": "reasoning", "content": [] },
            { "type": "message", "content": [{ "type": "output_text", "text": "최종 결과" }] }
          ]
        });
        let empty = serde_json::json!({ "output_text": "   " });

        assert_eq!(extract_output_text(&direct).as_deref(), Some("결과"));
        assert_eq!(extract_output_text(&nested).as_deref(), Some("중첩 결과"));
        assert_eq!(
            extract_output_text(&after_reasoning).as_deref(),
            Some("최종 결과")
        );
        assert_eq!(extract_output_text(&empty), None);
    }
}
