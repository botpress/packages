#[cfg(test)]
use crate::umap::fuzzy::*;
use crate::umap::knn::*;
use crate::umap::rand::Rng;

// Builds the graph from raw points: knn -> directed edges -> symmetrize.
fn build_graph(mut data: Vec<f32>, n: usize, dim: usize, k: usize) -> Vec<(usize, usize, f32)> {
    let mut rng = Rng::seed_from_u64(42);
    let g: Knn = knn(&mut data, n, dim, k, &mut rng);
    let directed = compute_edges(&g);
    symmetrize(&directed)
}

// 5 points in 3D: {0,1,2} point mostly +x, {3,4} point mostly +y.
// Cosine distance puts the two groups far apart.
fn toy() -> (Vec<f32>, usize, usize) {
    let data = vec![
        1.0, 0.0, 0.0, // 0
        0.9, 0.1, 0.0, // 1
        0.8, 0.2, 0.0, // 2
        0.0, 1.0, 0.0, // 3
        0.1, 0.9, 0.0, // 4
        -0.3, 0.2, 0.0, // 5
        -0.4, 0.1, 0.0, // 6
        -0.6, 0.0, 0.0, // 7
    ];
    (data, 8, 3)
}

#[test]
fn edges_are_sane() {
    let (data, n, dim) = toy();
    let edges = build_graph(data, n, dim, 2);

    assert!(!edges.is_empty(), "graph should have edges");

    for &(i, j, w) in &edges {
        assert!(i < j, "edges must be canonical (i < j), got ({i},{j})");
        assert!(i < n && j < n, "index out of range: ({i},{j})");
        assert!(w > 0.0 && w <= 1.0 + 1e-6, "weight out of (0,1]: {w}");
    }

    // No duplicate pairs after symmetrization.
    let mut pairs: Vec<(usize, usize)> = edges.iter().map(|&(i, j, _)| (i, j)).collect();
    let before = pairs.len();
    pairs.sort();
    pairs.dedup();
    assert_eq!(before, pairs.len(), "duplicate edges found");
}

#[test]
fn clusters_bind_tighter_than_bridges() {
    let (data, n, dim) = toy();
    let edges = build_graph(data, n, dim, 2);

    let same_cluster = |a: usize, b: usize| {
        let g = |x: usize| if x <= 2 { 0 } else { 1 };
        g(a) == g(b)
    };

    let mut within = vec![];
    let mut across = vec![];
    for &(i, j, w) in &edges {
        if same_cluster(i, j) {
            within.push(w)
        } else {
            across.push(w)
        }
    }

    println!("within: {:?}", within);
    println!("across: {:?}", across);

    assert!(
        !within.is_empty(),
        "expected at least one within-cluster edge"
    );
    let max_across = across.iter().cloned().fold(0.0_f32, f32::max);
    let min_within = within.iter().cloned().fold(f32::INFINITY, f32::min);
    assert!(
        min_within > max_across,
        "within-cluster edges ({min_within}) should outweigh bridges ({max_across})"
    );
}

#[test]
fn deterministic_across_runs() {
    let (data, n, dim) = toy();
    let a = build_graph(data.clone(), n, dim, 2);
    let b = build_graph(data, n, dim, 2);
    assert_eq!(a, b, "same input must produce identical graph");
}

// Stage-2-only check: feed a hand-built Knn so the graph math is tested
// without depending on the KNN step. The nearest neighbor (dist = rho)
// must get weight 1.0.
#[test]
fn nearest_neighbor_gets_full_weight() {
    let g = Knn {
        indices: vec![1, 2, /*pt0*/ 0, 2, /*pt1*/ 0, 1 /*pt2*/],
        dists: vec![0.1, 0.4, 0.1, 0.5, 0.4, 0.5],
        k: 2,
    };
    let edges = symmetrize(&compute_edges(&g));
    // edge (0,1) has a directed weight of 1.0 in at least one direction
    // (it's the nearest neighbor for both), so the union weight is 1.0.
    let w01 = edges
        .iter()
        .find(|&&(i, j, _)| i == 0 && j == 1)
        .map(|&(_, _, w)| w);
    assert!(w01.is_some(), "expected edge (0,1)");
    assert!(
        (w01.unwrap() - 1.0).abs() < 1e-6,
        "nearest pair should be ~1.0, got {:?}",
        w01
    );
}
