#[cfg(test)]
use super::rand::Rng;
use super::*;

// Well-separated blobs: cluster c sits near +10 along axis c, with small noise.
// Under cosine distance the clusters are near-orthogonal, so they're far apart;
// points within a cluster are nearly parallel, so they're close.
fn blobs(clusters: usize, per: usize, dim: usize, seed: u64) -> (Vec<f32>, usize) {
    let mut rng = Rng::seed_from_u64(seed);
    let n = clusters * per;
    let mut data = vec![0.0_f32; n * dim];
    for c in 0..clusters {
        for p in 0..per {
            let idx = c * per + p;
            for d in 0..dim {
                let mut v = (rng.next_f32() - 0.5) * 0.5; // small noise
                if d == c % dim {
                    v += 10.0; // dominant axis for this cluster
                }
                data[idx * dim + d] = v;
            }
        }
    }
    (data, n)
}

fn dist(emb: &[f32], i: usize, j: usize, nc: usize) -> f32 {
    let mut s = 0.0;
    for d in 0..nc {
        let x = emb[i * nc + d] - emb[j * nc + d];
        s += x * x;
    }
    s.sqrt()
}

fn mean_within(emb: &[f32], group: &[usize], nc: usize) -> f32 {
    let mut sum = 0.0;
    let mut cnt = 0;
    for a in 0..group.len() {
        for b in (a + 1)..group.len() {
            sum += dist(emb, group[a], group[b], nc);
            cnt += 1;
        }
    }
    sum / cnt as f32
}

fn mean_between(emb: &[f32], g1: &[usize], g2: &[usize], nc: usize) -> f32 {
    let mut sum = 0.0;
    let mut cnt = 0;
    for &a in g1 {
        for &b in g2 {
            sum += dist(emb, a, b, nc);
            cnt += 1;
        }
    }
    sum / cnt as f32
}

// --- the capstone ---

#[test]
fn fit_is_deterministic() {
    let (data, n) = blobs(3, 20, 10, 1);
    let cfg = UmapConfig::default();

    // fit mutates `data` in place (knn normalizes), so each run gets a fresh copy.
    let mut d1 = data.clone();
    let mut d2 = data.clone();
    let a = fit(&mut d1, n, 10, &cfg);
    let b = fit(&mut d2, n, 10, &cfg);

    assert_eq!(
        a, b,
        "same input + same seed must produce an identical embedding"
    );
}

#[test]
fn fit_output_is_finite() {
    let (data, n) = blobs(3, 20, 10, 2);
    let cfg = UmapConfig::default();
    let mut d = data.clone();
    let emb = fit(&mut d, n, 10, &cfg);
    for (i, &x) in emb.iter().enumerate() {
        assert!(x.is_finite(), "embedding[{i}] is not finite: {x}");
    }
}

#[test]
fn fit_preserves_cluster_structure() {
    // three blobs should come out as three separated clumps in the embedding.
    let (data, n) = blobs(3, 20, 10, 3);
    let cfg = UmapConfig::default();
    let mut d = data.clone();
    let emb = fit(&mut d, n, 10, &cfg);
    let nc = cfg.n_components;

    let g0: Vec<usize> = (0..20).collect();
    let g1: Vec<usize> = (20..40).collect();
    let g2: Vec<usize> = (40..60).collect();

    let within =
        (mean_within(&emb, &g0, nc) + mean_within(&emb, &g1, nc) + mean_within(&emb, &g2, nc))
            / 3.0;
    let between = (mean_between(&emb, &g0, &g1, nc)
        + mean_between(&emb, &g0, &g2, nc)
        + mean_between(&emb, &g1, &g2, nc))
        / 3.0;

    assert!(
        within < between,
        "clusters should be tighter within than between: within {within}, between {between}"
    );
}

#[test]
fn fit_random_init_is_deterministic() {
    let (data, n) = blobs(3, 20, 10, 4);
    let cfg = UmapConfig {
        init_type: InitType::Random,
        ..Default::default()
    };
    let mut d1 = data.clone();
    let mut d2 = data.clone();
    let a = fit(&mut d1, n, 10, &cfg);
    let b = fit(&mut d2, n, 10, &cfg);
    assert_eq!(
        a, b,
        "random init must also be fully deterministic under a fixed seed"
    );
}

#[test]
fn fit_different_seeds_differ() {
    // sanity: the seed actually does something. Different seeds, different embedding.
    let (data, n) = blobs(3, 20, 10, 5);
    let mut d1 = data.clone();
    let mut d2 = data.clone();
    let cfg1 = UmapConfig {
        init_type: InitType::Random,
        seed: 1,
        ..Default::default()
    };
    let cfg2 = UmapConfig {
        init_type: InitType::Random,
        seed: 2,
        ..Default::default()
    };
    let a = fit(&mut d1, n, 10, &cfg1);
    let b = fit(&mut d2, n, 10, &cfg2);
    assert_ne!(a, b, "different seeds should produce different embeddings");
}

#[test]
fn fit_handles_tiny_input() {
    // n <= n_components + 1 hits the guard and returns the trivial layout.
    let mut data = vec![1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0]; // 2 points, dim 4
    let cfg = UmapConfig::default();
    let emb = fit(&mut data, 2, 4, &cfg);
    assert_eq!(
        emb.len(),
        2 * cfg.n_components,
        "trivial layout still has the right shape"
    );
    assert!(
        emb.iter().all(|&x| x == 0.0),
        "tiny input returns the zero layout"
    );
}
