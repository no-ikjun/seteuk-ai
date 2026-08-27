use serde::Serialize;

use crate::openai;

use super::generate::GenerateErrorDto;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ModelDto {
    id: String,
    created: i64,
    owned_by: String,
}

/* 모델 목록은 생성과 같은 오류 형태를 쓴다. 화면에서 인증·한도·네트워크
오류를 구분해 안내하는 코드를 그대로 재사용할 수 있다. */
#[tauri::command]
pub(crate) async fn list_models(api_key: String) -> Result<Vec<ModelDto>, GenerateErrorDto> {
    let models = openai::catalog::list_models(&api_key)
        .await
        .map_err(GenerateErrorDto::from)?;
    Ok(models
        .into_iter()
        .map(|model| ModelDto {
            id: model.id,
            created: model.created,
            owned_by: model.owned_by,
        })
        .collect())
}
