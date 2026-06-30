use std::collections::BTreeMap;

pub struct GroupedLabels {
    // BTreeMap (not HashMap) so clusters come out in a deterministic, ascending-label
    // order. With a persistent wasm instance, HashMap iteration order is not stable
    // across calls, which would make the output cluster ordering non-deterministic.
    pub groups: BTreeMap<i32, Vec<usize>>,
    pub noise: Vec<usize>,
}

pub fn group_labels(labels: &Vec<i32>) -> GroupedLabels {
    let mut groups: BTreeMap<i32, Vec<usize>> = BTreeMap::new();
    let mut noise = Vec::new();

    for (idx, &l) in labels.iter().enumerate() {
        if l == -1 {
            noise.push(idx);
        } else {
            groups.entry(l).or_default().push(idx);
        }
    }

    GroupedLabels { groups, noise }
}

pub fn centroid(data: &[f32], members: &[usize], dim: usize) -> Vec<f32> {
    let mut centroid = vec![0.0_f32; dim];

    for &m in members {
        for d in 0..dim {
            centroid[d] += data[m * dim + d];
        }
    }

    let count = members.len() as f32;
    for d in 0..dim {
        centroid[d] /= count;
    }

    centroid
}

pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    let mut dot = 0.0;

    assert_eq!(a.len(), b.len(), "vectors must have same length");

    for i in 0..a.len() {
        dot += a[i] * b[i];
    }

    dot
}

fn l2_norm(v: &[f32]) -> f32 {
    dot(v, v).sqrt().max(1e-12)
}

pub fn centroid_cosine_distances(
    data: &[f32],
    centroid: &[f32],
    members: &[usize],
    dim: usize,
) -> Vec<f32> {
    // Cosine distance requires unit-length operands. The centroid is the arithmetic mean
    // of the original (un-normalized) embeddings, so we divide by both magnitudes here
    // rather than assuming the inputs were normalized.
    let centroid_norm = l2_norm(centroid);
    let mut distances = Vec::with_capacity(members.len());

    for m in members {
        let vec = &data[m * dim..m * dim + dim];
        let d = 1.0 - dot(vec, centroid) / (l2_norm(vec) * centroid_norm);
        distances.push(d);
    }

    distances
}

pub fn sort_by_distances(distances: &[f32], members: &[usize]) -> Vec<usize> {
    let mut order: Vec<usize> = (0..members.len()).collect();
    order.sort_by(|&a, &b| {
        distances[a]
            .partial_cmp(&distances[b])
            .unwrap()
            .then(a.cmp(&b))
    });

    order.iter().map(|&i| members[i]).collect()
}
