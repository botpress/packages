use crate::lodash;

/**
 * Returns the jaro-winkler similarity between two strings
 * @param s1 String A
 * @param s2 String B
 * @returns A number between 0 and 1, where 1 means very similar
 */
pub fn jaro_winkler_similarity(s1: &str, s2: &str, case_sensitive: Option<bool>) -> f64 {
    let case_sensitive = case_sensitive.unwrap_or(true);

    // Exit early if either are empty.
    if s1.is_empty() || s2.is_empty() {
        return 0.0;
    }

    // Convert to upper if case-sensitive is false.
    let (s1, s2) = if !case_sensitive {
        (s1.to_uppercase(), s2.to_uppercase())
    } else {
        (s1.to_string(), s2.to_string())
    };

    // Exit early if they're an exact match.
    if s1 == s2 {
        return 1.0;
    }

    let s1_chars: Vec<char> = s1.chars().collect();
    let s2_chars: Vec<char> = s2.chars().collect();
    let mut m: i32 = 0;
    let max_len = core::cmp::max(s1_chars.len(), s2_chars.len());
    let range = (max_len / 2) - 1;
    let mut s1_matches = vec![false; s1_chars.len()];
    let mut s2_matches = vec![false; s2_chars.len()];

    for i in 0..s1_chars.len() {
        let low = if i >= range { i - range } else { 0 };
        let high = if i + range <= s2_chars.len() - 1 {
            i + range
        } else {
            s2_chars.len() - 1
        };

        for j in low..=high {
            if !s1_matches[i] && !s2_matches[j] && s1_chars[i] == s2_chars[j] {
                m += 1;
                s1_matches[i] = true;
                s2_matches[j] = true;
                break;
            }
        }
    }

    // Exit early if no matches were found.
    if m == 0 {
        return 0.0;
    }

    // Count the transpositions.
    let mut k = 0;
    let mut num_trans = 0;

    for i in 0..s1_matches.len() {
        let is_match = s1_matches[i];

        if !is_match {
            continue;
        }

        let mut j = k;
        while j < s2_matches.len() {
            if s2_matches[j] {
                k = j + 1;
                break;
            }
            j += 1;
        }

        if s1_chars[i] != s2_chars[j] {
            num_trans += 1;
        }
    }

    let weight = (m as f64 / s1_chars.len() as f64
        + m as f64 / s2_chars.len() as f64
        + (m - num_trans / 2) as f64 / m as f64)
        / 3.0;

    let p = 0.1;

    if weight > 0.7 {
        let mut l = 0;
        while s1_chars.get(l) == s2_chars.get(l) && l < 4 {
            l += 1;
        }

        return weight + (l as f64) * p * (1.0 - weight);
    }

    weight
}

/**
* Returns the levenshtein similarity between two strings
* sim(a, b) = (|b| - dist(a, b)) / |b| where |a| < |b|
* sim(a, b) ∈ [0, 1]
* @returns the proximity between 0 and 1, where 1 is very close
*/
pub fn levenshtein_similarity(a: &str, b: &str) -> f64 {
    let len = a.len().max(b.len());
    let dist = levenshtein_distance(a, b);
    (len - dist) as f64 / len as f64
}

/**
* Returns the levenshtein distance two strings, i.e. the # of operations required to go from a to b
* dist(a, b) ∈ [0, max(|a|, |b|)]
*/
pub fn levenshtein_distance(a: &str, b: &str) -> usize {
    if a.is_empty() || b.is_empty() {
        // BUG: should return the length of the non-empty string, but we keep this behavior for compatibility
        return 0;
    }

    let (a, b) = if a.len() > b.len() { (b, a) } else { (a, b) };

    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();

    let alen = a_chars.len();
    let blen = b_chars.len();

    let mut row = (0..alen + 1).collect::<Vec<usize>>();
    let mut res: usize = 0;

    // j == lines, i == columns
    for j in 1..=blen {
        res = j;

        for i in 1..=alen {
            let tmp = row[i - 1];
            row[i - 1] = res;

            // tmp    = D[i - 1, j - 1] (previous row, previous column)
            // res    = D[i - 1, j    ] (current row, previous column)
            // row[i] = D[i    , j - 1] (previous row, current column)

            let bj = b_chars[j - 1];
            let ai = a_chars[i - 1];

            let substitition_cost = if bj == ai { 0 } else { 1 };

            res = lodash::min(&[
                tmp + substitition_cost, // substitution
                res + 1,                 // insertion
                row[i] + 1,              // deletion
            ])
        }

        // BUG: this line should be uncommented, but we keep this behavior for compatibility
        // row[alen] = res;
    }

    res
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_eq_rounded(a: f64, b: f64) {
        let rounded_a = (a * 1000.0).round() / 1000.0;
        let rounded_b = (b * 1000.0).round() / 1000.0;
        assert_eq!(rounded_a, rounded_b);
    }

    #[test]
    fn levenshtein() {
        assert_eq!(levenshtein_distance("testing", "tesing"), 1); // 1 x suppression
        assert_eq!(levenshtein_distance("testting", "testing"), 1); // 1 x addition
        assert_eq!(levenshtein_distance("tasting", "testing"), 1); // 1 x substitution
        assert_eq!(levenshtein_distance("teing", "testing"), 2); // 2 x suppression
        assert_eq!(levenshtein_distance("tesstting", "testing"), 2); // 2 x addition
        assert_eq!(levenshtein_distance("teasing", "testing"), 2); // 1 x suppression + 1 x addition
        assert_eq!(levenshtein_distance("teasing", "testing"), 2); // 1 x suppression + 1 x addition
        assert_eq!(levenshtein_distance("tastting", "testing"), 2); // 1 x substitution + 1 x addition
        assert_eq!(levenshtein_distance("tetsng", "testing"), 2); // 1 x suppression + 1 x substitution
        assert_eq!(levenshtein_distance("tetsing", "testing"), 2); // letterSwap (1 sup + 1 add)
        assert_eq!(levenshtein_distance("tetsig", "testing"), 3); // 1 x suppression + 1 x letterSwap (1 sup + 1 add)
        assert_eq!(levenshtein_distance("tetsinng", "testing"), 3); // 1 x letterSwap (1 sup + 1 add) + 1 x addition
        assert_eq!(levenshtein_distance("tetsinng", "testing"), 3); // 1 x letterSwap (1 sup + 1 add) + 1 x addition
        assert_eq!(levenshtein_distance("tetsong", "testing"), 3); // 1 x letterSwap (1 sup + 1 add) + 1 x substitution
    }

    #[test]
    fn new_york() {
        // this is a bug, but we have to keep it for backward compatibility (it should be 3)
        assert_eq!(levenshtein_distance("new-york", "new-yorkers"), 4);
    }

    #[test]
    fn jaro_winkler() {
        assert_eq_rounded(jaro_winkler_similarity("testing", "tesing", None), 0.967);
        assert_eq_rounded(jaro_winkler_similarity("testting", "testing", None), 0.975);
        assert_eq_rounded(jaro_winkler_similarity("tasting", "testing", None), 0.914);
        assert_eq_rounded(jaro_winkler_similarity("teing", "testing", None), 0.924);
        assert_eq_rounded(jaro_winkler_similarity("tesstting", "testing", None), 0.948);
        assert_eq_rounded(jaro_winkler_similarity("teasing", "testing", None), 0.924);
        assert_eq_rounded(jaro_winkler_similarity("teasing", "testing", None), 0.924);
        assert_eq_rounded(jaro_winkler_similarity("tastting", "testing", None), 0.882);
        assert_eq_rounded(jaro_winkler_similarity("tetsing", "testing", None), 0.962);
        assert_eq_rounded(jaro_winkler_similarity("tetsng", "testing", None), 0.917);
        assert_eq_rounded(jaro_winkler_similarity("tetsiing", "testing", None), 0.929);
        assert_eq_rounded(jaro_winkler_similarity("tetsiing", "testing", None), 0.929);
        assert_eq_rounded(jaro_winkler_similarity("tetsong", "testing", None), 0.879);
    }
}
