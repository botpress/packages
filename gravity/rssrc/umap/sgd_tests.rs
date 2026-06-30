#[cfg(test)]
use super::super::init::random_init;
use super::*;

// fitted a,b for min_dist=0.1, spread=1.0 (matches scipy)
const A: f32 = 1.577;
const B: f32 = 0.895;

// --- helpers ---

fn dist(emb: &[f32], i: usize, j: usize, nc: usize) -> f32 {
    let mut s = 0.0;
    for d in 0..nc {
        let x = emb[i * nc + d] - emb[j * nc + d];
        s += x * x;
    }
    s.sqrt()
}

fn mean_pair_dist(emb: &[f32], group: &[usize], nc: usize) -> f32 {
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

fn mean_cross_dist(emb: &[f32], g1: &[usize], g2: &[usize], nc: usize) -> f32 {
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

// Two fully-connected groups of 5, no edges between them.
// The optimizer consumes directed sparse entries, matching umap-learn's layout path.
fn two_cliques() -> (Vec<(usize, usize, f32)>, usize) {
    let mut edges = Vec::new();
    for i in 0..5 {
        for j in 0..5 {
            if i == j {
                continue;
            }
            edges.push((i, j, 1.0));
        }
    }
    for i in 5..10 {
        for j in 5..10 {
            if i == j {
                continue;
            }
            edges.push((i, j, 1.0));
        }
    }
    (edges, 10)
}

// Full run: init then optimize, from a single seed (as fit() would).
fn run_optimize(edges: &[(usize, usize, f32)], n: usize, nc: usize, seed: u64) -> Vec<f32> {
    let mut rng = Rng::seed_from_u64(seed);
    let mut emb = random_init(n, nc, &mut rng);
    optimize(&mut emb, edges, n, nc, A, B, 500, 5.0, &mut rng);
    emb
}

// --- scheduling helpers ---

#[test]
fn epochs_per_sample_maps_weight_to_frequency() {
    let edges = vec![(0, 1, 1.0), (0, 2, 0.5), (0, 3, 0.25)];
    let eps = epochs_per_sample(&edges);
    // strongest edge fires every epoch; half-weight every 2; quarter every 4.
    assert!(
        (eps[0] - 1.0).abs() < 1e-6,
        "strongest -> 1.0, got {}",
        eps[0]
    );
    assert!((eps[1] - 2.0).abs() < 1e-6, "half -> 2.0, got {}", eps[1]);
    assert!(
        (eps[2] - 4.0).abs() < 1e-6,
        "quarter -> 4.0, got {}",
        eps[2]
    );
}

#[test]
fn epochs_per_negative_sample_scales_by_rate() {
    let eps = vec![1.0, 2.0, 5.0];
    let neg = epochs_per_negative_sample(&eps, 5.0);
    assert!((neg[0] - 0.2).abs() < 1e-6);
    assert!((neg[1] - 0.4).abs() < 1e-6);
    assert!((neg[2] - 1.0).abs() < 1e-6);
}

// --- the optimizer ---

#[test]
fn output_is_finite() {
    // gradient clipping + the d_2>0 guards must prevent NaN/Inf.
    let (edges, n) = two_cliques();
    let emb = run_optimize(&edges, n, 2, 1);
    for (idx, &x) in emb.iter().enumerate() {
        assert!(x.is_finite(), "embedding[{idx}] not finite: {x}");
    }
}

#[test]
fn connected_points_contract() {
    // attraction should pull a clique tighter than its random start.
    let (edges, n) = two_cliques();
    let nc = 2;
    let mut rng = Rng::seed_from_u64(42);
    let mut emb = random_init(n, nc, &mut rng);

    let before = mean_pair_dist(&emb, &[0, 1, 2, 3, 4], nc);
    optimize(&mut emb, &edges, n, nc, A, B, 500, 5.0, &mut rng);
    let after = mean_pair_dist(&emb, &[0, 1, 2, 3, 4], nc);

    assert!(
        after < before,
        "clique should contract: before {before}, after {after}"
    );
}

#[test]
fn clusters_separate() {
    // two disconnected cliques should end up as two separated clumps:
    // within-clique distance < between-clique distance.
    let (edges, n) = two_cliques();
    let nc = 2;
    let emb = run_optimize(&edges, n, nc, 7);

    let a = [0, 1, 2, 3, 4];
    let b = [5, 6, 7, 8, 9];
    let within_a = mean_pair_dist(&emb, &a, nc);
    let within_b = mean_pair_dist(&emb, &b, nc);
    let between = mean_cross_dist(&emb, &a, &b, nc);

    assert!(
        within_a < between,
        "clique A ({within_a}) should be tighter than the gap ({between})"
    );
    assert!(
        within_b < between,
        "clique B ({within_b}) should be tighter than the gap ({between})"
    );
}

#[test]
fn deterministic() {
    let (edges, n) = two_cliques();
    let a = run_optimize(&edges, n, 2, 99);
    let b = run_optimize(&edges, n, 2, 99);
    assert_eq!(a, b, "same seed must produce identical embedding");
}
