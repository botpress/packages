use std::cmp::Ordering;

use super::rand::Rng;

const EPS: f32 = 1e-6;
const MAX_CANDIDATES: usize = 60;
const MIN_LEAF_SIZE: usize = 60;
const MAX_LEAF_SIZE: usize = 256;
const MAX_RP_TREE_DEPTH: usize = 200;
const DELTA: f32 = 0.001;

pub struct Knn {
    pub indices: Vec<usize>, // n * k, row-major: point i's neighbors at i*k .. i*k+k
    pub dists: Vec<f32>,     // n * k, same layout as above
    pub k: usize,
}

impl Knn {
    pub fn n(&self) -> usize {
        if self.k == 0 {
            return 0;
        }

        self.indices.len() / self.k
    }
}

#[derive(Clone)]
struct Neighbor {
    index: usize,
    dist: f32,
    fresh: bool,
}

fn dot(data: &[f32], i: usize, j: usize, dim: usize) -> f32 {
    let mut acc = 0.0;
    for d in 0..dim {
        acc += data[i * dim + d] * data[j * dim + d];
    }
    acc
}

fn normalize(data: &mut [f32], n: usize, dim: usize) {
    for i in 0..n {
        let len = dot(data, i, i, dim).sqrt().max(1e-12);
        let inv = 1.0 / len;

        for d in 0..dim {
            data[i * dim + d] *= inv;
        }
    }
}

pub fn knn(data: &mut [f32], n: usize, dim: usize, k: usize, rng: &mut Rng) -> Knn {
    normalize(data, n, dim);

    let k = k.min(n.saturating_sub(1)); // avoids differing shapes + more neighbors than points
    if k == 0 {
        return Knn {
            indices: Vec::new(),
            dists: Vec::new(),
            k,
        };
    }

    let mut graph = vec![Vec::with_capacity(k); n];

    init_from_rp_forest(data, n, dim, k, &mut graph, rng);
    init_random(data, n, dim, k, &mut graph, rng);
    nn_descent(data, n, dim, k, &mut graph, rng);

    let mut indices = Vec::with_capacity(n * k);
    let mut dists = Vec::with_capacity(n * k);

    for row in graph {
        debug_assert_eq!(row.len(), k);
        indices.extend(row.iter().map(|neighbor| neighbor.index));
        dists.extend(row.iter().map(|neighbor| neighbor.dist));
    }

    Knn { indices, dists, k }
}

fn init_from_rp_forest(
    data: &[f32],
    n: usize,
    dim: usize,
    k: usize,
    graph: &mut [Vec<Neighbor>],
    rng: &mut Rng,
) {
    let n_trees = n_trees(n);
    let leaf_size = leaf_size(k);

    for _ in 0..n_trees {
        let indices: Vec<usize> = (0..n).collect();
        for leaf in angular_tree_leaves(data, dim, indices, leaf_size, MAX_RP_TREE_DEPTH, rng) {
            connect_leaf(data, dim, k, graph, &leaf);
        }
    }
}

fn init_random(
    data: &[f32],
    n: usize,
    dim: usize,
    k: usize,
    graph: &mut [Vec<Neighbor>],
    rng: &mut Rng,
) {
    for i in 0..n {
        let mut attempts = 0;
        while graph[i].len() < k && attempts < n * 2 {
            let j = rng.gen_range(n);
            let dist = cosine_dist(data, i, j, dim);
            insert_neighbor(graph, i, j, dist, k);
            attempts += 1;
        }

        if graph[i].len() < k {
            for j in 0..n {
                if graph[i].len() == k {
                    break;
                }
                let dist = cosine_dist(data, i, j, dim);
                insert_neighbor(graph, i, j, dist, k);
            }
        }
    }
}

fn nn_descent(
    data: &[f32],
    n: usize,
    dim: usize,
    k: usize,
    graph: &mut [Vec<Neighbor>],
    rng: &mut Rng,
) {
    let n_iters = n_iters(n);
    let max_candidates = MAX_CANDIDATES.max(k);

    for _ in 0..n_iters {
        let (new_candidates, old_candidates) = build_candidates(graph, n, max_candidates, rng);
        let mut updates = 0;

        for i in 0..n {
            updates += process_candidate_pairs(
                data,
                dim,
                k,
                graph,
                &new_candidates[i],
                &new_candidates[i],
                true,
            );
            updates += process_candidate_pairs(
                data,
                dim,
                k,
                graph,
                &new_candidates[i],
                &old_candidates[i],
                false,
            );
        }

        if updates as f32 <= DELTA * k as f32 * n as f32 {
            break;
        }
    }
}

fn build_candidates(
    graph: &mut [Vec<Neighbor>],
    n: usize,
    max_candidates: usize,
    rng: &mut Rng,
) -> (Vec<Vec<usize>>, Vec<Vec<usize>>) {
    let mut new_candidates = vec![Vec::new(); n];
    let mut old_candidates = vec![Vec::new(); n];

    for i in 0..n {
        for neighbor_idx in 0..graph[i].len() {
            let neighbor = &mut graph[i][neighbor_idx];
            let target = if neighbor.fresh {
                &mut new_candidates
            } else {
                &mut old_candidates
            };

            push_candidate(&mut target[i], neighbor.index, max_candidates, rng);
            push_candidate(&mut target[neighbor.index], i, max_candidates, rng);
            neighbor.fresh = false;
        }
    }

    (new_candidates, old_candidates)
}

fn process_candidate_pairs(
    data: &[f32],
    dim: usize,
    k: usize,
    graph: &mut [Vec<Neighbor>],
    left: &[usize],
    right: &[usize],
    skip_symmetric: bool,
) -> usize {
    let mut updates = 0;

    for left_idx in 0..left.len() {
        let a = left[left_idx];
        let right_start = if skip_symmetric { left_idx + 1 } else { 0 };

        for &b in &right[right_start..] {
            if a == b {
                continue;
            }

            let dist = cosine_dist(data, a, b, dim);
            if insert_neighbor(graph, a, b, dist, k) {
                updates += 1;
            }
            if insert_neighbor(graph, b, a, dist, k) {
                updates += 1;
            }
        }
    }

    updates
}

fn angular_tree_leaves(
    data: &[f32],
    dim: usize,
    indices: Vec<usize>,
    leaf_size: usize,
    depth: usize,
    rng: &mut Rng,
) -> Vec<Vec<usize>> {
    if indices.len() <= leaf_size || depth == 0 {
        return vec![indices];
    }

    let (left, right) = angular_split(data, dim, indices, rng);
    let mut leaves = angular_tree_leaves(data, dim, left, leaf_size, depth - 1, rng);
    leaves.extend(angular_tree_leaves(
        data,
        dim,
        right,
        leaf_size,
        depth - 1,
        rng,
    ));
    leaves
}

fn angular_split(
    data: &[f32],
    dim: usize,
    indices: Vec<usize>,
    rng: &mut Rng,
) -> (Vec<usize>, Vec<usize>) {
    let left_pos = rng.gen_range(indices.len());
    let mut right_pos = rng.gen_range(indices.len());
    if left_pos == right_pos {
        right_pos = (right_pos + 1) % indices.len();
    }

    let left_idx = indices[left_pos];
    let right_idx = indices[right_pos];
    let mut hyperplane = vec![0.0_f32; dim];
    let mut hyperplane_norm = 0.0;

    for d in 0..dim {
        let v = data[left_idx * dim + d] - data[right_idx * dim + d];
        hyperplane[d] = v;
        hyperplane_norm += v * v;
    }

    let inv_norm = 1.0 / hyperplane_norm.sqrt().max(1e-12);
    for v in &mut hyperplane {
        *v *= inv_norm;
    }

    let mut left = Vec::with_capacity(indices.len());
    let mut right = Vec::with_capacity(indices.len());

    for idx in indices {
        let mut margin = 0.0;
        for d in 0..dim {
            margin += hyperplane[d] * data[idx * dim + d];
        }

        if margin.abs() < EPS {
            if rng.gen_range(2) == 0 {
                left.push(idx);
            } else {
                right.push(idx);
            }
        } else if margin > 0.0 {
            left.push(idx);
        } else {
            right.push(idx);
        }
    }

    if left.is_empty() || right.is_empty() {
        rebalance_split(&mut left, &mut right);
    }

    (left, right)
}

fn rebalance_split(left: &mut Vec<usize>, right: &mut Vec<usize>) {
    if left.is_empty() {
        let mut moved = right.split_off(right.len() / 2);
        left.append(&mut moved);
    } else {
        let mut moved = left.split_off(left.len() / 2);
        right.append(&mut moved);
    }
}

fn connect_leaf(data: &[f32], dim: usize, k: usize, graph: &mut [Vec<Neighbor>], leaf: &[usize]) {
    for a_pos in 0..leaf.len() {
        let a = leaf[a_pos];
        for &b in &leaf[a_pos + 1..] {
            let dist = cosine_dist(data, a, b, dim);
            insert_neighbor(graph, a, b, dist, k);
            insert_neighbor(graph, b, a, dist, k);
        }
    }
}

fn insert_neighbor(
    graph: &mut [Vec<Neighbor>],
    point: usize,
    index: usize,
    dist: f32,
    k: usize,
) -> bool {
    if point == index {
        return false;
    }

    let row = &mut graph[point];
    if let Some(existing) = row.iter_mut().find(|neighbor| neighbor.index == index) {
        if cmp_neighbor(dist, index, existing.dist, existing.index) == Ordering::Less {
            existing.dist = dist;
            existing.fresh = true;
            sort_neighbors(row);
            return true;
        }

        return false;
    }

    if row.len() < k {
        row.push(Neighbor {
            index,
            dist,
            fresh: true,
        });
        sort_neighbors(row);
        return true;
    }

    let should_replace = row
        .last()
        .map(|worst| cmp_neighbor(dist, index, worst.dist, worst.index) == Ordering::Less)
        .unwrap_or(true);

    if should_replace {
        row.pop();
        row.push(Neighbor {
            index,
            dist,
            fresh: true,
        });
        sort_neighbors(row);
        return true;
    }

    false
}

fn push_candidate(list: &mut Vec<usize>, index: usize, max_candidates: usize, rng: &mut Rng) {
    if list.contains(&index) {
        return;
    }

    if list.len() < max_candidates {
        list.push(index);
        return;
    }

    let replacement = rng.gen_range(list.len() + 1);
    if replacement < list.len() {
        list[replacement] = index;
    }
}

fn sort_neighbors(row: &mut [Neighbor]) {
    row.sort_by(|a, b| cmp_neighbor(a.dist, a.index, b.dist, b.index));
}

fn cmp_neighbor(a_dist: f32, a_index: usize, b_dist: f32, b_index: usize) -> Ordering {
    match a_dist.partial_cmp(&b_dist) {
        Some(Ordering::Equal) => a_index.cmp(&b_index),
        Some(order) => order,
        None => Ordering::Equal,
    }
}

fn cosine_dist(data: &[f32], i: usize, j: usize, dim: usize) -> f32 {
    if i == j {
        return f32::INFINITY;
    }

    (1.0 - dot(data, i, j, dim)).max(0.0)
}

fn n_trees(n: usize) -> usize {
    (5 + ((n as f64).sqrt() / 20.0).round() as usize).min(64)
}

fn leaf_size(k: usize) -> usize {
    (5 * k).clamp(MIN_LEAF_SIZE, MAX_LEAF_SIZE)
}

fn n_iters(n: usize) -> usize {
    ((n as f64).log2().round() as usize).max(5)
}
