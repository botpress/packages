use crate::umap::rand::Rng;

const GRADIENT_CLAMP_MIN: f32 = -4.0;
const GRADIENT_CLAMP_MAX: f32 = 4.0;

fn attractive_force(a: f32, b: f32, d_2: f32) -> f32 {
    (-2.0 * a * b * d_2.powf(b - 1.0)) / (1.0 + a * d_2.powf(b))
}

fn repulsive_force(a: f32, b: f32, d_2: f32) -> f32 {
    (2.0 * b) / ((0.001 + d_2) * (1.0 + a * d_2.powf(b)))
}

fn epochs_per_sample(edges: &[(usize, usize, f32)]) -> Vec<f32> {
    let max_w = edges.iter().map(|&(_, _, w)| w).fold(0.0_f32, f32::max);

    let mut result = Vec::with_capacity(edges.len());
    for &(_, _, w) in edges {
        result.push(max_w / w);
    }

    result
}

fn epochs_per_negative_sample(eps: &[f32], neg_rate: f32) -> Vec<f32> {
    eps.iter().map(|&e| e / neg_rate).collect()
}

fn clip_gradient(x: f32) -> f32 {
    x.clamp(GRADIENT_CLAMP_MIN, GRADIENT_CLAMP_MAX)
}

fn dist_sq(embedding: &[f32], i: usize, j: usize, n_components: usize) -> f32 {
    let mut sum = 0.0;
    for d in 0..n_components {
        let diff = embedding[i * n_components + d] - embedding[j * n_components + d];
        sum += diff * diff;
    }
    sum
}

fn process_edge(
    embedding: &mut [f32],
    i: usize,            // edge head
    j: usize,            // edge tail
    n: usize,            // point count
    n_components: usize, // component count
    a: f32,
    b: f32,
    alpha: f32, // current learning rate
    epoch: f32,
    epochs_per_neg: f32,
    next_neg: &mut f32,
    rng: &mut Rng,
) {
    // 0: ATTRACTION
    let d_2 = dist_sq(embedding, i, j, n_components);

    let attractive_coeff = if d_2 > 0.0 {
        attractive_force(a, b, d_2)
    } else {
        0.0
    };

    let off_i = i * n_components;
    let off_j = j * n_components;
    for c in 0..n_components {
        let diff = embedding[off_i + c] - embedding[off_j + c];
        let grad = clip_gradient(attractive_coeff * diff);

        embedding[off_i + c] += alpha * grad;
        embedding[off_j + c] -= alpha * grad;
    }

    // 1: REPULSION
    let neg_samples = ((epoch - *next_neg) / epochs_per_neg).floor() as usize;
    for _ in 0..neg_samples {
        let r = rng.gen_range(n);

        if r == i {
            continue;
        }

        let d_2 = dist_sq(embedding, i, r, n_components);

        let repulsive_coeff = if d_2 > 0.0 {
            repulsive_force(a, b, d_2)
        } else {
            0.0
        };

        let off_r = r * n_components;
        for c in 0..n_components {
            let diff = embedding[off_i + c] - embedding[off_r + c];
            let grad = clip_gradient(repulsive_coeff * diff);

            embedding[off_i + c] += alpha * grad;
        }
    }
    *next_neg += neg_samples as f32 * epochs_per_neg;
}

pub fn optimize(
    embedding: &mut [f32],
    edges: &[(usize, usize, f32)],
    n: usize,
    n_components: usize,
    a: f32,
    b: f32,
    n_epochs: usize,
    neg_rate: f32,
    rng: &mut Rng,
) {
    let eps = epochs_per_sample(edges);
    let eps_neg = epochs_per_negative_sample(&eps, neg_rate);
    let mut next_sample = eps.clone(); // first due
    let mut next_sample_neg = eps_neg.clone();

    let mut alpha = 1.0;
    for epoch in 0..n_epochs {
        let epoch_f = epoch as f32;

        for e in 0..edges.len() {
            if next_sample[e] > epoch_f {
                continue; // this edge is not due yet
            }

            let (i, j, _) = edges[e];
            process_edge(
                embedding,
                i,
                j,
                n,
                n_components,
                a,
                b,
                alpha,
                epoch_f,
                eps_neg[e],
                &mut next_sample_neg[e],
                rng,
            );

            next_sample[e] += eps[e];
        }

        alpha = 1.0 - (epoch as f32 / n_epochs as f32); // matches umap-learn's update timing
    }
}

#[cfg(test)]
#[path = "sgd_tests.rs"]
mod tests;
