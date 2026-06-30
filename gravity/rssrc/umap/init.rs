use crate::umap::rand::Rng;

/// We center the data around the origin, as PCA requires
fn center(data: &[f32], n: usize, dim: usize) -> Vec<f32> {
    // 0: compute the mean vector
    let mut mean = vec![0.0_f32; dim];
    for i in 0..n {
        for d in 0..dim {
            mean[d] += data[i * dim + d];
        }
    }
    for d in 0..dim {
        mean[d] /= n as f32;
    }

    let mut centered: Vec<f32> = data.to_vec();
    for i in 0..n {
        for d in 0..dim {
            centered[i * dim + d] -= mean[d];
        }
    }

    centered
}

/// Points aligned with v dominate, so the result is a new direction
/// rotated toward the data's axis of greatest spread.
fn cov_times_vec(centered: &[f32], n: usize, dim: usize, v: &[f32]) -> Vec<f32> {
    // pass 0: project every point onto v
    let mut u = vec![0.0_f32; n];
    for i in 0..n {
        let mut s = 0.0;
        for d in 0..dim {
            s += centered[i * dim + d] * v[d];
        }
        u[i] = s;
    }

    // pass 1: accumulate projections back into dim-space
    let mut result = vec![0.0_f32; dim];
    for i in 0..n {
        for d in 0..dim {
            result[d] += centered[i * dim + d] * u[i]
        }
    }

    result
}

fn normalize_vec(v: &mut [f32]) {
    let norm = v.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-12);
    for x in v.iter_mut() {
        *x /= norm;
    }
}

fn power_iteration(centered: &[f32], n: usize, dim: usize, rng: &mut Rng) -> Vec<f32> {
    let mut v: Vec<f32> = (0..dim).map(|_| rng.next_f32()).collect();
    normalize_vec(&mut v);

    for _ in 0..100 {
        v = cov_times_vec(centered, n, dim, &v);
        normalize_vec(&mut v);
    }

    v
}

fn deflate(centered: &mut [f32], n: usize, dim: usize, v: &[f32] /* an unit vector */) {
    for i in 0..n {
        let mut proj = 0.0_f32;

        for d in 0..dim {
            proj += centered[i * dim + d] * v[d]; // scalar projection onto v
        }
        for d in 0..dim {
            centered[i * dim + d] -= proj * v[d]; // remove the v-component
        }
    }
}

fn dot_slice(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

pub fn random_init(n: usize, n_components: usize, rng: &mut Rng) -> Vec<f32> {
    let mut embedding = Vec::with_capacity(n * n_components);
    for _ in 0..(n * n_components) {
        embedding.push(rng.next_f32() * 20.0 - 10.0);
    }
    embedding
}

pub fn pca_init(
    data: &[f32],
    n: usize,
    dim: usize,
    n_components: usize,
    rng: &mut Rng,
) -> Vec<f32> {
    let mut centered = center(data, n, dim);
    let clean_centered = centered.clone();

    let mut eigenvectors = Vec::new();
    for _ in 0..n_components {
        let v = power_iteration(&centered, n, dim, rng);
        deflate(&mut centered, n, dim, &v);
        eigenvectors.push(v);
    }

    // project onto our eigenvectors
    let mut embeddings = vec![0.0_f32; n * n_components];
    for i in 0..n {
        let row = &clean_centered[i * dim..i * dim + dim];
        for c in 0..n_components {
            embeddings[i * n_components + c] = dot_slice(row, &eigenvectors[c]);
        }
    }

    embeddings
}

pub(crate) fn scale_init(embeddings: &mut [f32], rng: &mut Rng) {
    // 0: find the largest absolute coordinate
    let max_abs = embeddings.iter().fold(0.0_f32, |m, &x| m.max(x.abs()));
    if max_abs == 0.0 {
        // all zeros
        return;
    }

    // 1: scale the spread so that it maps to ~10
    let expansion = 10.0 / max_abs;
    for x in embeddings.iter_mut() {
        *x *= expansion;

        // 2: add a bit of noise to minimize the chance of coincidental points
        *x += (rng.next_f32() - 0.5) * 2.0 * 1e-4;
    }
}

#[cfg(test)]
#[path = "init_tests.rs"]
mod tests;
