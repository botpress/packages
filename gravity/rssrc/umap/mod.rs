use serde::{Deserialize, Serialize};

use crate::umap::rand::Rng;

mod ab;
mod fuzzy;
mod init;
mod knn;
mod rand;
mod sgd;

#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum InitType {
    PCA = 0,
    Random = 1,
}

#[derive(Serialize)]
pub struct UmapConfig {
    pub init_type: InitType,
    pub n_neighbors: usize,
    pub n_components: usize,
    pub min_dist: f32,
    pub spread: f32,
    pub n_epochs: usize,
    pub negative_sample_rate: f32,
    pub seed: u64,
}

impl Default for UmapConfig {
    fn default() -> Self {
        Self {
            init_type: InitType::PCA,
            n_neighbors: 15,
            n_components: 5,
            min_dist: 0.0,
            spread: 1.0,
            n_epochs: 500,
            negative_sample_rate: 5.0,
            seed: 42,
        }
    }
}

pub fn fit(data: &mut [f32], n: usize, dim: usize, cfg: &UmapConfig) -> Vec<f32> {
    if n <= cfg.n_components + 1 {
        return vec![0.0; n * cfg.n_components]; // too few points to do anything useful
    }

    let mut rng = Rng::seed_from_u64(cfg.seed);

    // note: knn normalizes `data` in place, so pca_init runs on unit-normalized vectors
    let symmetric = compute_fuzzy_graph(data, n, dim, cfg, &mut rng);
    let optimizer_edges = directed_optimizer_edges(&symmetric);

    let (a, b) = ab::fit_ab(cfg.min_dist, cfg.spread);

    let mut embeddings = match cfg.init_type {
        InitType::PCA => init::pca_init(data, n, dim, cfg.n_components, &mut rng),
        InitType::Random => init::random_init(n, cfg.n_components, &mut rng),
    };

    init::scale_init(&mut embeddings, &mut rng);

    // the input provided no edges, so there's nothing to optimize
    if !optimizer_edges.is_empty() {
        sgd::optimize(
            &mut embeddings,
            &optimizer_edges,
            n,
            cfg.n_components,
            a,
            b,
            cfg.n_epochs,
            cfg.negative_sample_rate,
            &mut rng,
        );
    }

    embeddings
}

fn compute_fuzzy_graph(
    data: &mut [f32],
    n: usize,
    dim: usize,
    cfg: &UmapConfig,
    rng: &mut Rng,
) -> Vec<(usize, usize, f32)> {
    let graph = knn::knn(data, n, dim, cfg.n_neighbors, rng);
    let directed = fuzzy::compute_edges(&graph);
    fuzzy::symmetrize(&directed)
}

fn directed_optimizer_edges(symmetric: &[(usize, usize, f32)]) -> Vec<(usize, usize, f32)> {
    let mut edges = Vec::with_capacity(symmetric.len() * 2);
    for &(i, j, weight) in symmetric {
        edges.push((i, j, weight));
        edges.push((j, i, weight));
    }
    edges.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));
    edges
}

#[cfg(test)]
#[path = "mod_tests.rs"]
mod tests;
