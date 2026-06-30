use std::collections::HashMap;

use super::knn::Knn;

const SIGMA_SEARCH_ITER: u8 = 64;
const SIGMA_SEARCH_TOLERANCE: f32 = 1e-6;
const MIN_K_DIST_SCALE: f32 = 1e-3;

fn smooth_knn_sigma_floored(
    neighbor_dists: &[f32],
    rho: f32,
    target: f32,
    global_mean_dist: f32,
) -> f32 {
    let sigma = smooth_knn_sigma(neighbor_dists, rho, target);

    // we don't want too small of a sigma, otherwise all the points past the nearest
    // one will be conceptually very far away so we clamp it
    let local_mean_dist: f32 = neighbor_dists.iter().sum::<f32>() / neighbor_dists.len() as f32;
    let floor = if rho > 0.0 {
        MIN_K_DIST_SCALE * local_mean_dist
    } else {
        MIN_K_DIST_SCALE * global_mean_dist
    };
    sigma.max(floor)
}

fn smooth_knn_sigma(neighbor_dists: &[f32], rho: f32, target: f32) -> f32 {
    let mut lo = 0.0;
    let mut hi = f32::INFINITY;
    let mut mid = 1.0; // aka sigma

    // through binary search, find a sigma that is within the tolerance of target
    for _ in 0..SIGMA_SEARCH_ITER {
        let psum: f32 = neighbor_dists
            .iter()
            .map(|d_j| compute_weight(*d_j, rho, mid))
            .sum();

        if (psum - target).abs() < SIGMA_SEARCH_TOLERANCE {
            break;
        }

        match (psum > target, hi) {
            (true, _) => {
                hi = mid;
                mid = (lo + hi) / 2.0;
            }
            (false, h) if h.is_infinite() => {
                lo = mid;
                mid *= 2.0;
            }
            (false, _) => {
                lo = mid;
                mid = (lo + hi) / 2.0;
            }
        }
    }

    mid
}

fn compute_weight(d_j: f32, rho: f32, sigma: f32) -> f32 {
    // rho is the distance to the closest neighbor
    (-(d_j - rho).max(0.0) / sigma).exp()
}

fn compute_rho(neighbor_dists: &[f32]) -> f32 {
    for &d in neighbor_dists {
        if d > 0.0 {
            return d;
        }
    }
    0.0
}

pub(crate) fn compute_edges(knn: &Knn) -> Vec<(usize, usize, f32)> {
    let k = knn.k;
    let n = knn.n();

    // no neighbors, no graph
    if k == 0 {
        return Vec::new();
    }

    let target = (k as f32).log2();

    // for the degenerate-point floor only, i.e. if all points are at the same distance
    let global_mean_dist = knn.dists.iter().sum::<f32>() / knn.dists.len() as f32;

    let mut edges = Vec::with_capacity(n * k);

    for i in 0..n {
        let neighbor_dists = &knn.dists[i * k..i * k + k];

        let rho = compute_rho(neighbor_dists);
        let sigma = smooth_knn_sigma_floored(neighbor_dists, rho, target, global_mean_dist);

        // we go through each neighbor and calculate the one-side weights
        for p in 0..k {
            let point_idx = i * k + p;

            let j = knn.indices[point_idx]; // neighbor index
            let d = knn.dists[point_idx]; // neighbor distance
            let w = compute_weight(d, rho, sigma); // edge weight

            edges.push((i, j, w));
        }
    }

    edges
}

pub(crate) fn symmetrize(directed: &[(usize, usize, f32)]) -> Vec<(usize, usize, f32)> {
    let mut map: HashMap<(usize, usize), f32> = HashMap::new();

    for &(i, j, w) in directed {
        let key = (i.min(j), i.max(j));

        // co-normalizing through probability combination
        map.entry(key)
            .and_modify(|e| *e = *e + w - *e * w)
            .or_insert(w);
    }

    let mut edges: Vec<(usize, usize, f32)> =
        map.into_iter().map(|((i, j), w)| (i, j, w)).collect();

    // sort the edges by i, then by j if conflicting; not strictly necessary, simplifies the mental model later
    edges.sort_by(|a, b| {
        let i1 = a.0;
        let i2 = b.0;

        let j1 = a.1;
        let j2 = b.1;

        i1.cmp(&i2).then(j1.cmp(&j2))
    });

    edges
}

#[cfg(test)]
#[path = "fuzzy_tests.rs"]
mod tests;
