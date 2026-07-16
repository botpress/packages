#[cfg(test)]
use crate::umap::ab::*;

fn approx(got: f32, want: f32, eps: f32) -> bool {
    (got - want).abs() < eps
}

// ---- model ----

#[test]
fn model_is_one_at_zero() {
    // 1/(1 + a*0) = 1, for any a,b. Two points on top of each other are maximally similar.
    for (a, b) in [(1.0, 1.0), (1.577, 0.895), (0.5, 1.3)] {
        assert!(
            approx(model(0.0, a, b), 1.0, 1e-6),
            "model(0) should be 1.0"
        );
    }
}

#[test]
fn model_decreases_with_distance() {
    let (a, b) = (1.577, 0.895);
    let mut prev = model(0.0, a, b);
    for i in 1..50 {
        let x = i as f32 * 0.1;
        let cur = model(x, a, b);
        assert!(cur < prev, "model must be strictly decreasing in x");
        assert!(cur > 0.0 && cur <= 1.0, "model must stay in (0,1]");
        prev = cur;
    }
}

// ---- target ----

#[test]
fn target_flat_then_decays() {
    let (min_dist, spread) = (0.1, 1.0);
    // flat at 1.0 up to and including min_dist
    assert!(approx(target(0.0, min_dist, spread), 1.0, 1e-6));
    assert!(approx(target(min_dist, min_dist, spread), 1.0, 1e-6));
    // one spread past min_dist, decay factor is exp(-1)
    let x = min_dist + spread;
    assert!(
        approx(target(x, min_dist, spread), (-1.0_f32).exp(), 1e-5),
        "target at min_dist+spread should be exp(-1)"
    );
}

#[test]
fn target_is_monotone_nonincreasing() {
    let (min_dist, spread) = (0.1, 1.0);
    let mut prev = target(0.0, min_dist, spread);
    for i in 0..100 {
        let x = i as f32 * 0.05;
        let cur = target(x, min_dist, spread);
        assert!(cur <= prev + 1e-6, "target must never increase");
        prev = cur;
    }
}

// ---- sample_grid ----

#[test]
fn grid_spans_zero_to_three_spread() {
    let xs = sample_grid(1.0, 300);
    assert_eq!(xs.len(), 300);
    assert!(approx(xs[0], 0.0, 1e-6), "first sample is 0");
    assert!(
        approx(*xs.last().unwrap(), 3.0, 1e-5),
        "last sample is 3*spread"
    );
    // strictly increasing
    for w in xs.windows(2) {
        assert!(w[1] > w[0], "grid must be increasing");
    }
}

#[test]
fn grid_scales_with_spread() {
    let xs = sample_grid(2.0, 300);
    assert!(
        approx(*xs.last().unwrap(), 6.0, 1e-5),
        "last sample is 3*spread = 6"
    );
}

// ---- residuals ----

#[test]
fn residual_is_zero_when_model_matches_target() {
    // at x=0 the model is exactly 1.0; feed a target of 1.0 there.
    let r = residuals(&[0.0], &[1.0], 1.5, 0.9);
    assert!(
        approx(r[0], 0.0, 1e-6),
        "residual should vanish when model==target"
    );
}

#[test]
fn residuals_length_matches_input() {
    let xs = sample_grid(1.0, 300);
    let targets: Vec<f32> = xs.iter().map(|&x| target(x, 0.1, 1.0)).collect();
    let r = residuals(&xs, &targets, 1.0, 1.0);
    assert_eq!(r.len(), xs.len());
}

// ---- the fit (the real test) ----

#[test]
fn fit_matches_reference_default() {
    let (a, b) = fit_ab(0.1, 1.0);
    // scipy curve_fit lands at a=1.576943, b=0.895061
    assert!(approx(a, 1.576943, 0.1), "a was {a}, expected ~1.577");
    assert!(approx(b, 0.895061, 0.1), "b was {b}, expected ~0.895");
}

#[test]
fn fit_matches_reference_zero_min_dist() {
    let (a, b) = fit_ab(0.0, 1.0);
    // scipy: a=1.932808, b=0.790495
    assert!(approx(a, 1.932808, 0.1), "a was {a}, expected ~1.933");
    assert!(approx(b, 0.790495, 0.1), "b was {b}, expected ~0.790");
}

#[test]
fn fit_matches_reference_other_params() {
    let (a, b) = fit_ab(0.5, 1.0); // scipy: a=0.583030, b=1.334167
    assert!(approx(a, 0.583030, 0.1), "a was {a}, expected ~0.583");
    assert!(approx(b, 1.334167, 0.1), "b was {b}, expected ~1.334");
}

#[test]
fn fit_produces_a_good_curve() {
    // independent of where a,b land, the fitted curve should hug the target.
    let (min_dist, spread) = (0.1, 1.0);
    let (a, b) = fit_ab(min_dist, spread);
    let xs = sample_grid(spread, 300);
    let targets: Vec<f32> = xs.iter().map(|&x| target(x, min_dist, spread)).collect();
    let sse: f32 = residuals(&xs, &targets, a, b).iter().map(|r| r * r).sum();
    assert!(
        sse < 0.0786 + 0.005,
        "sse {sse} should be near the achievable minimum 0.0786"
    );
}

#[test]
fn fit_is_deterministic() {
    assert_eq!(
        fit_ab(0.1, 1.0),
        fit_ab(0.1, 1.0),
        "same input must give identical fit"
    );
}
