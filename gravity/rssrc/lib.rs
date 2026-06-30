use wasm_bindgen::prelude::*;

pub mod clustering;
pub mod pipeline;
pub mod types;
pub mod umap;

use crate::types::{ClusteringOptions, EmbeddingDataset};

/// Clusters a set of high-dimensional embeddings.
///
/// `dataset` is `{ ids, embeddings, dim }` and `options` is a (possibly empty) bag of
/// parameter overrides. Returns the clustering output, or throws if the input is
/// malformed or the clustering fails.
#[wasm_bindgen]
pub fn cluster(dataset: JsValue, options: JsValue) -> Result<JsValue, JsError> {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    let dataset: EmbeddingDataset = serde_wasm_bindgen::from_value(dataset)
        .map_err(|err| JsError::new(&format!("invalid dataset: {err}")))?;
    let options: ClusteringOptions = serde_wasm_bindgen::from_value(options)
        .map_err(|err| JsError::new(&format!("invalid options: {err}")))?;

    let output =
        pipeline::process_embeddings(dataset, &options).map_err(|err| JsError::new(&err))?;

    serde_wasm_bindgen::to_value(&output)
        .map_err(|err| JsError::new(&format!("failed to serialize clustering output: {err}")))
}
