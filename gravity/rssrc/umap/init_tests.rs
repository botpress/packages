#[cfg(test)]
use super::super::rand::Rng;
use super::*;

// --- helpers ---

// Generate data where each column has a controlled spread.
// Column d is uniform in [-scales[d], scales[d]], so its variance is
// proportional to scales[d]^2. Deterministic via seeded Rng.
fn spread_data(n: usize, scales: &[f32], seed: u64) -> (Vec<f32>, usize, usize) {
    let dim = scales.len();
    let mut rng = Rng::seed_from_u64(seed);
    let mut data = vec![0.0_f32; n * dim];
    for i in 0..n {
        for d in 0..dim {
            data[i * dim + d] = (rng.next_f32() - 0.5) * 2.0 * scales[d];
        }
    }
    (data, n, dim)
}

// Variance of one column of the embedding.
fn col_var(emb: &[f32], n: usize, ncomp: usize, c: usize) -> f32 {
    let mean: f32 = (0..n).map(|i| emb[i * ncomp + c]).sum::<f32>() / n as f32;
    (0..n)
        .map(|i| {
            let d = emb[i * ncomp + c] - mean;
            d * d
        })
        .sum::<f32>()
        / n as f32
}

fn approx_rel(a: f32, b: f32, tol: f32) -> bool {
    (a - b).abs() <= tol * a.abs().max(1.0)
}

// --- shape ---

#[test]
fn output_has_correct_shape() {
    let (data, n, dim) = spread_data(50, &[10.0, 2.0, 0.5], 1);
    let mut rng = Rng::seed_from_u64(7);
    let emb = pca_init(&data, n, dim, 2, &mut rng);
    assert_eq!(emb.len(), n * 2, "embedding must be n * n_components");
}

// --- the defining PCA property: variance concentrates in early components ---

#[test]
fn variance_decreases_across_components() {
    // spread is biggest on axis 0, then 1, then 2.
    let (data, n, dim) = spread_data(200, &[10.0, 2.0, 0.5], 1);
    let mut rng = Rng::seed_from_u64(7);
    let emb = pca_init(&data, n, dim, 3, &mut rng);

    let v0 = col_var(&emb, n, 3, 0);
    let v1 = col_var(&emb, n, 3, 1);
    let v2 = col_var(&emb, n, 3, 2);
    assert!(
        v0 > v1,
        "component 0 variance ({v0}) should exceed component 1 ({v1})"
    );
    assert!(
        v1 > v2,
        "component 1 variance ({v1}) should exceed component 2 ({v2})"
    );
}

#[test]
fn dominant_axis_concentrates_variance() {
    // one axis far more spread than the rest -> first component dominates.
    let (data, n, dim) = spread_data(200, &[10.0, 1.0, 1.0], 2);
    let mut rng = Rng::seed_from_u64(7);
    let emb = pca_init(&data, n, dim, 2, &mut rng);

    let v0 = col_var(&emb, n, 2, 0);
    let v1 = col_var(&emb, n, 2, 1);
    assert!(
        v0 > 5.0 * v1,
        "first component ({v0}) should dominate second ({v1})"
    );
}

// --- centering: result is invariant to translating the whole cloud ---

#[test]
fn translation_invariant() {
    let (data, n, dim) = spread_data(150, &[8.0, 3.0, 1.0], 3);
    let shifted: Vec<f32> = data
        .iter()
        .enumerate()
        .map(|(idx, x)| x + [5.0, 5.0, 5.0][idx % dim])
        .collect();

    let mut r1 = Rng::seed_from_u64(7);
    let mut r2 = Rng::seed_from_u64(7);
    let a = pca_init(&data, n, dim, 3, &mut r1);
    let b = pca_init(&shifted, n, dim, 3, &mut r2);

    // centering removes the shift, so column variances must match.
    for c in 0..3 {
        let va = col_var(&a, n, 3, c);
        let vb = col_var(&b, n, 3, c);
        assert!(
            approx_rel(va, vb, 0.05),
            "column {c} variance changed under translation: {va} vs {vb}"
        );
    }
}

// --- the project's through-line ---

#[test]
fn deterministic() {
    let (data, n, dim) = spread_data(100, &[10.0, 2.0, 0.5], 4);
    let mut r1 = Rng::seed_from_u64(7);
    let mut r2 = Rng::seed_from_u64(7);
    let a = pca_init(&data, n, dim, 3, &mut r1);
    let b = pca_init(&data, n, dim, 3, &mut r2);
    assert_eq!(a, b, "same data + same seed must give identical embedding");
}

// --- isolated checks on the building blocks ---

#[test]
fn power_iteration_finds_top_axis() {
    // data spread almost entirely along axis 0; top eigenvector ~ +/- axis 0.
    let (data, n, dim) = spread_data(200, &[10.0, 0.5, 0.5], 5);
    let centered = center(&data, n, dim);
    let mut rng = Rng::seed_from_u64(7);
    let v = power_iteration(&centered, n, dim, &mut rng);
    // sign is arbitrary, so check magnitude of the axis-0 component.
    assert!(
        v[0].abs() > 0.9,
        "top eigenvector should align with axis 0, got {v:?}"
    );
    assert!(
        v[1].abs() < 0.3 && v[2].abs() < 0.3,
        "other components should be small: {v:?}"
    );
}

#[test]
fn deflate_removes_variance_along_v() {
    let (data, n, dim) = spread_data(200, &[10.0, 2.0, 0.5], 5);
    let mut centered = center(&data, n, dim);
    let mut rng = Rng::seed_from_u64(7);
    let v = power_iteration(&centered, n, dim, &mut rng);
    deflate(&mut centered, n, dim, &v);

    // after deflation, projecting the data onto v should give ~0 everywhere.
    let var_along_v: f32 = (0..n)
        .map(|i| {
            let proj: f32 = (0..dim).map(|d| centered[i * dim + d] * v[d]).sum();
            proj * proj
        })
        .sum::<f32>()
        / n as f32;
    assert!(
        var_along_v < 1e-2,
        "variance along v should vanish after deflation, got {var_along_v}"
    );
}

#[test]
fn normalize_vec_gives_unit_length() {
    let mut v = vec![3.0_f32, 4.0, 0.0]; // length 5
    normalize_vec(&mut v);
    let len: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    assert!(
        (len - 1.0).abs() < 1e-6,
        "normalized length should be 1, got {len}"
    );
}

#[test]
fn scale_init_normalizes_spread() {
    // a deliberately over-spread layout should come back with max-abs ~10.
    let mut emb = vec![-90.0, 30.0, 60.0, -15.0, 93.0, 0.0];
    let mut rng = Rng::seed_from_u64(1);
    scale_init(&mut emb, &mut rng);
    let max_abs = emb.iter().fold(0.0_f32, |m, &x| m.max(x.abs()));
    // 10 from the expansion, plus at most 1e-4 of noise.
    assert!(
        (max_abs - 10.0).abs() < 1e-3,
        "max-abs should be ~10, got {max_abs}"
    );
}

#[test]
fn scale_init_separates_coincident_points() {
    // two identical rows must end up at a tiny but nonzero distance,
    // so the d_2 > 0 guard in the optimizer doesn't strand them.
    let mut emb = vec![1.0, 1.0, 1.0, 1.0]; // two 2D points, both at origin
    let mut rng = Rng::seed_from_u64(1);
    scale_init(&mut emb, &mut rng);
    let dx = emb[0] - emb[2];
    let dy = emb[1] - emb[3];
    let d = (dx * dx + dy * dy).sqrt();
    assert!(d > 0.0, "coincident points must be nudged apart");
    assert!(d < 1e-3, "the nudge should be tiny, got {d}");
}

#[test]
fn scale_init_handles_all_zeros() {
    // the trivial (tiny-input) layout is all zeros; max_abs is 0, so we bail.
    // result stays all zeros (no divide-by-zero, no scaling).
    let mut emb = vec![0.0; 10];
    let mut rng = Rng::seed_from_u64(1);
    scale_init(&mut emb, &mut rng);
    // with the early return on max_abs <= 0, nothing changes.
    assert!(
        emb.iter().all(|&x| x == 0.0),
        "all-zero layout should be left untouched"
    );
}

#[test]
fn scale_init_is_deterministic() {
    let base = vec![5.0, -3.0, 8.0, 1.0, -9.0, 2.0];
    let mut a = base.clone();
    let mut b = base.clone();
    scale_init(&mut a, &mut Rng::seed_from_u64(7));
    scale_init(&mut b, &mut Rng::seed_from_u64(7));
    assert_eq!(a, b, "same seed must give identical scaling+noise");
}
