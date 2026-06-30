pub(crate) fn fit_ab(min_dist: f32, spread: f32) -> (f32, f32) {
    let xs = sample_grid(spread, 300);
    let targets: Vec<f32> = xs.iter().map(|&x| target(x, min_dist, spread)).collect();

    let mut a = 1.0_f32;
    let mut b = 1.0_f32;
    let mut lambda = 1e-3_f32;

    let sse =
        |a: f32, b: f32| -> f32 { residuals(&xs, &targets, a, b).iter().map(|r| r * r).sum() };

    let mut err = sse(a, b);

    for _ in 0..100 {
        // 0: residuals at current a,b
        let r = residuals(&xs, &targets, a, b);

        // 1: Jacobian by finite differences: two columns, da and db
        let eps = 1e-4_f32;
        let r_da = residuals(&xs, &targets, a + eps, b);
        let r_db = residuals(&xs, &targets, a, b + eps);
        // column j_a[i] = (r_da[i] - r[i]) / eps,  j_b[i] likewise

        // 2: accumulate JtJ and Jtr (length 2)
        let (mut jtj00, mut jtj01, mut jtj11) = (0.0, 0.0, 0.0);
        let (mut jtr0, mut jtr1) = (0.0, 0.0);
        for i in 0..xs.len() {
            let ja = (r_da[i] - r[i]) / eps;
            let jb = (r_db[i] - r[i]) / eps;
            jtj00 += ja * ja;
            jtj01 += ja * jb;
            jtj11 += jb * jb;
            jtr0 += ja * r[i];
            jtr1 += jb * r[i];
        }

        // 3: damped system, where we implement the core of LM (Levenber-Marquardt)
        // (JtJ + lambda*diag(JtJ)) * delta = -Jtr
        // solve the 2x2 by hand, then accept/reject
        loop {
            let a00 = jtj00 * (1.0 + lambda);
            let a11 = jtj11 * (1.0 + lambda);
            let a01 = jtj01; // we leave this untouched, essentially building our lever of Gauss-Newton vs Gradient Descent
            let det = a00 * a11 - a01 * a01;

            // delta = inv(A) * (-Jtr)
            let da = (-jtr0 * a11 - (-jtr1) * a01) / det;
            let db = (a00 * (-jtr1) - a01 * (-jtr0)) / det;

            let new_err = sse(a + da, b + db);
            if new_err < err {
                // we moved in the right direction
                a += da;
                b += db;
                err = new_err;
                lambda = (lambda * 0.1).max(1e-12); // let's go faster!
                break; // restart the loop with new a,b
            } else {
                // we moved in the wrong direction
                lambda *= 10.0; // can't stray too far now...

                if lambda > 1e7 {
                    return (a, b);
                } // we've moved in the wrong direction too much, we're stuck at a min
            }
        }
    }

    (a, b)
}

fn model(x: f32, a: f32, b: f32) -> f32 {
    1.0 / (1.0 + a * x.powf(2.0 * b))
}

fn target(x: f32, min_dist: f32, spread: f32) -> f32 {
    if x <= min_dist {
        1.0
    } else {
        (-(x - min_dist) / spread).exp()
    }
}

fn sample_grid(spread: f32, n_samples: usize) -> Vec<f32> {
    // linear space from 0 to 3 times the spread
    let sample_space = (n_samples - 1) as f32;
    (0..n_samples)
        .map(|i| 3.0 * spread * (i as f32) / sample_space)
        .collect()
}

fn residuals(xs: &[f32], targets: &[f32], a: f32, b: f32) -> Vec<f32> {
    xs.iter()
        .zip(targets)
        .map(|(&x, &t)| model(x, a, b) - t)
        .collect()
}

#[cfg(test)]
#[path = "ab_tests.rs"]
mod tests;
