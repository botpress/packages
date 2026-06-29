use serde::{Deserialize, Serialize};

use crate::umap::{InitType, UmapConfig};

#[derive(Deserialize, Serialize)]
pub struct EmbeddingDataset {
    pub ids: Vec<String>,
    #[serde(skip_serializing)]
    pub embeddings: Vec<Vec<f32>>,
    pub dim: usize,
}

/// Default HDBSCAN parameters, matching the warmup thresholds of the reference pipeline.
const DEFAULT_MIN_CLUSTER_SIZE: usize = 10;
const DEFAULT_MIN_SAMPLES: usize = 1;

/// Optional, partial overrides for the clustering parameters. Any field left unset falls
/// back to its default. Deserialized from the `options` field of a `ClusteringRequest`.
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ClusteringOptions {
    // UMAP
    pub init_type: Option<InitType>,
    pub n_neighbors: Option<usize>,
    pub n_components: Option<usize>,
    pub min_dist: Option<f32>,
    pub spread: Option<f32>,
    pub n_epochs: Option<usize>,
    pub negative_sample_rate: Option<f32>,
    pub seed: Option<u64>,
    // HDBSCAN
    pub min_cluster_size: Option<usize>,
    pub min_samples: Option<usize>,
}

impl ClusteringOptions {
    pub fn umap_config(&self) -> UmapConfig {
        let d = UmapConfig::default();
        UmapConfig {
            init_type: self.init_type.unwrap_or(d.init_type),
            n_neighbors: self.n_neighbors.unwrap_or(d.n_neighbors),
            n_components: self.n_components.unwrap_or(d.n_components),
            min_dist: self.min_dist.unwrap_or(d.min_dist),
            spread: self.spread.unwrap_or(d.spread),
            n_epochs: self.n_epochs.unwrap_or(d.n_epochs),
            negative_sample_rate: self.negative_sample_rate.unwrap_or(d.negative_sample_rate),
            seed: self.seed.unwrap_or(d.seed),
        }
    }

    pub fn hdbscan_config(&self) -> HdbscanConfig {
        HdbscanConfig {
            min_cluster_size: self.min_cluster_size.unwrap_or(DEFAULT_MIN_CLUSTER_SIZE),
            min_samples: self.min_samples.unwrap_or(DEFAULT_MIN_SAMPLES),
        }
    }
}

/// The full input to the WASM clustering entrypoint: the dataset plus optional overrides.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClusteringRequest {
    pub dataset: EmbeddingDataset,
    #[serde(default)]
    pub options: ClusteringOptions,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cluster {
    pub item_ids: Vec<String>,
    pub centroid: Vec<f32>,
    pub assign_radius: f32,
}

#[derive(Serialize)]
pub struct HdbscanConfig {
    pub min_cluster_size: usize,
    pub min_samples: usize,
}

#[derive(Serialize)]
pub struct ClusteringOutput {
    pub dataset: EmbeddingDataset,

    pub umap_config: UmapConfig,
    pub hdbscan_config: HdbscanConfig,

    pub labels: Vec<i32>,
    pub clusters: Vec<Cluster>,
    pub noise: Vec<String>,
}
