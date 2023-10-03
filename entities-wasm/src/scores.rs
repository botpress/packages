use crate::lodash;
use crate::strings;

pub fn compute_exact_score(a: &[String], b: &[String]) -> f64 {
    let str1 = a.join("");
    let str2 = b.join("");
    let min = str1.len().min(str2.len());
    let max = str1.len().max(str2.len());
    let mut score = 0;

    for i in 0..min {
        if str1.as_bytes()[i] == str2.as_bytes()[i] {
            score += 1;
        }
    }

    score as f64 / max as f64
}

pub fn compute_fuzzy_score(a: &[String], b: &[String]) -> f64 {
    let str1 = a.join("");
    let str2 = b.join("");
    let d1 = strings::levenshtein_similarity(&str1, &str2);
    let d2 = strings::jaro_winkler_similarity(&str1, &str2, Some(false));
    (d1 + d2) / 2.0
}

pub fn compute_structural_score(a: &[String], b: &[String]) -> f64 {
    let mut charset1: Vec<char> = a.iter().flat_map(|x| x.chars()).collect();
    let mut charset2: Vec<char> = b.iter().flat_map(|x| x.chars()).collect();

    charset1 = lodash::uniq(&charset1);
    charset2 = lodash::uniq(&charset2);

    let charset_score = lodash::intersection_len(&charset1, &charset2) as f64
        / lodash::union_len(&charset1, &charset2) as f64;
    let charset_low1: Vec<char> = charset1.iter().map(|c| c.to_ascii_lowercase()).collect();
    let charset_low2: Vec<char> = charset2.iter().map(|c| c.to_ascii_lowercase()).collect();
    let charset_low_score = lodash::intersection_len(&charset_low1, &charset_low2) as f64
        / lodash::union_len(&charset_low1, &charset_low2) as f64;
    let final_charset_score = (charset_score + charset_low_score) / 2.0;

    let mut la: usize = a.iter().filter(|x| x.len() > 1).count();
    // BUG: using a here instead of b is a bug, but we have to keep it for compatibility
    let mut lb: usize = a.iter().filter(|x| x.len() > 1).count();

    la = std::cmp::max(la, 1);
    lb = std::cmp::max(lb, 1);

    let token_qty_score = std::cmp::min(la, lb) as f64 / std::cmp::max(la, lb) as f64;

    let size1: usize = a.iter().map(|x| x.len()).sum();
    let size2: usize = b.iter().map(|x| x.len()).sum();
    let token_size_score = std::cmp::min(size1, size2) as f64 / std::cmp::max(size1, size2) as f64;

    let ret = (final_charset_score * token_qty_score * token_size_score).sqrt();

    ret
}
