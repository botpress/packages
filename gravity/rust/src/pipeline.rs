use hdbscan::{Hdbscan, HdbscanHyperParams};

use crate::{
    clustering::{self, GroupedLabels, sort_by_distances},
    types::{Cluster, ClusteringOptions, ClusteringOutput, EmbeddingDataset, HdbscanConfig},
    umap,
};

pub fn process_embeddings(dataset: EmbeddingDataset, options: &ClusteringOptions) -> ClusteringOutput {
    let cfg = options.umap_config();
    let n = dataset.embeddings.len();
    let dim = dataset.dim;
    let data = flatten_embeddings(&dataset);

    let mut d = data.clone(); // we need the originals at the end, for the centroid calcs
    let umap_embeddings = umap::fit(&mut d, n, dim, &cfg);

    let hdbscan_config = options.hdbscan_config();
    let points: Vec<Vec<f32>> = (0..n)
        .map(|i| {
            umap_embeddings[i * cfg.n_components..i * cfg.n_components + cfg.n_components].to_vec()
        })
        .collect();
    let labels = hdbscan_labels(&points, &hdbscan_config);

    let GroupedLabels { groups, noise } = clustering::group_labels(&labels);
    let mut clusters: Vec<Cluster> = Vec::with_capacity(groups.len());

    for (_, group) in groups {
        let centroid = clustering::centroid(&data, &group, dim);
        let distances = clustering::centroid_cosine_distances(&data, &centroid, &group, dim);

        let dists_mean = distances.iter().sum::<f32>() / distances.len() as f32;
        let dists_var = distances
            .iter()
            .map(|d| (d - dists_mean).powi(2))
            .sum::<f32>()
            / distances.len() as f32;
        let dists_std = dists_var.sqrt();

        let assign_radius = (dists_mean + dists_std).clamp(0.25, 0.35);
        let sorted_group = sort_by_distances(&distances, &group);

        clusters.push(Cluster {
            item_ids: sorted_group
                .iter()
                .map(|&i| dataset.ids[i].clone())
                .collect(),
            centroid,
            assign_radius,
        });
    }

    let noise_ids = noise.iter().map(|&i| dataset.ids[i].clone()).collect();

    ClusteringOutput {
        dataset,
        umap_config: cfg,
        hdbscan_config,
        labels,
        clusters,
        noise: noise_ids,
    }
}

pub fn hdbscan_labels(points: &[Vec<f32>], config: &HdbscanConfig) -> Vec<i32> {
    let params = HdbscanHyperParams::builder()
        .min_cluster_size(config.min_cluster_size)
        .min_samples(config.min_samples)
        .build();
    let clusterer = Hdbscan::new(points, params);
    clusterer.cluster().unwrap()
}

fn flatten_embeddings(dataset: &EmbeddingDataset) -> Vec<f32> {
    dataset
        .embeddings
        .iter()
        .flat_map(|embedding| embedding.iter().copied())
        .collect()
}
