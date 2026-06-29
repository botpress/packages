#[cfg(not(target_arch = "wasm32"))]
use std::{
    fs, io,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use crate::types::ClusteringOutput;

#[cfg(not(target_arch = "wasm32"))]
const ROOT_DIR: &str = env!("CARGO_MANIFEST_DIR");

#[cfg(not(target_arch = "wasm32"))]
pub fn write_clustering_output(output: &ClusteringOutput) -> io::Result<PathBuf> {
    let path = Path::new(ROOT_DIR).join("output");

    write_clustering_output_to(output, &path)
}

#[cfg(not(target_arch = "wasm32"))]
pub fn write_clustering_output_to(
    output: &ClusteringOutput,
    root_dir: &Path,
) -> io::Result<PathBuf> {
    let output_dir = root_dir.join(timestamp_key());
    fs::create_dir_all(&output_dir)?;

    write_embedding_files(output, &output_dir.join("embeddings"))?;

    let json = serde_json::to_string_pretty(output)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    fs::write(output_dir.join("output.json"), json)?;

    Ok(output_dir)
}

pub fn raw_embeddings_text(output: &ClusteringOutput) -> String {
    let mut text = String::new();
    for (idx, embedding) in output.dataset.embeddings.iter().enumerate() {
        let id = output
            .dataset
            .ids
            .get(idx)
            .map(String::as_str)
            .unwrap_or("");
        append_embedding_row(&mut text, id, embedding);
    }

    text
}

pub fn umap_embeddings_text(output: &ClusteringOutput) -> String {
    let mut text = String::new();
    if !output.labels.is_empty() {
        let dim = output.umap_embeddings.len() / output.labels.len();
        for idx in 0..output.labels.len() {
            let start = idx * dim;
            let end = start + dim;
            let id = output
                .dataset
                .ids
                .get(idx)
                .map(String::as_str)
                .unwrap_or("");
            append_embedding_row(&mut text, id, &output.umap_embeddings[start..end]);
        }
    }

    text
}

#[cfg(not(target_arch = "wasm32"))]
fn write_embedding_files(output: &ClusteringOutput, root_dir: &Path) -> io::Result<()> {
    fs::create_dir_all(root_dir)?;

    fs::write(root_dir.join("raw.txt"), raw_embeddings_text(output))?;
    fs::write(root_dir.join("umap.txt"), umap_embeddings_text(output))?;

    Ok(())
}

fn append_embedding_row(text: &mut String, id: &str, embedding: &[f32]) {
    text.push_str(id);
    for value in embedding {
        text.push(' ');
        text.push_str(&value.to_string());
    }
    text.push('\n');
}

#[cfg(not(target_arch = "wasm32"))]
fn timestamp_key() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    format!("{}-{:09}", duration.as_secs(), duration.subsec_nanos())
}
