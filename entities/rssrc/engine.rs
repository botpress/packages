use std::cmp::Ordering;
use std::collections::HashMap;

use crate::lodash;
use crate::strings;

/**
 * #####################
 * ###   2. tokens   ###
 * #####################
 */

#[derive(Clone)]
struct Token {
    value: String,
    is_space: bool,
    char_start: usize,
    char_end: usize,
}

fn is_space(str: String) -> bool {
    str.chars().all(|c| c == ' ')
}

fn to_tokens(str_tokens: &Vec<String>) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut char_index = 0;

    for i in 0..str_tokens.len() {
        let str_token = &str_tokens[i];
        let token = Token {
            value: str_token.to_string(),
            is_space: is_space(str_token.to_string()),
            char_start: char_index,
            char_end: char_index + str_token.len(),
        };

        tokens.push(token);
        char_index += str_token.len();
    }

    tokens
}

/**
 * #####################
 * ###   3. parser   ###
 * #####################
 */

const ENTITY_SCORE_THRESHOLD: f64 = 0.6;

fn take_until(arr: &[Token], start: usize, desired_length: usize) -> Vec<Token> {
    let mut total = 0;
    let mut result: Vec<Token> = arr[start..]
        .iter()
        .take_while(|t| {
            let to_add: i32 = t.value.len() as i32;
            let current: i32 = total as i32;
            let des_len: i32 = desired_length as i32;
            if current > 0
                && lodash::abs(des_len - current) < lodash::abs(des_len - current - to_add)
            {
                // better off as-is
                return false;
            } else {
                // we're closed to desired if we add a new token
                total += to_add;
                return current < des_len;
            }
        })
        .cloned()
        .collect();

    if let Some(last_token) = result.last() {
        if last_token.is_space {
            result.pop();
        }
    }

    result
}

fn compute_exact_score(a: &[String], b: &[String]) -> f64 {
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

fn compute_fuzzy_score(a: &[String], b: &[String]) -> f64 {
    let str1 = a.join("");
    let str2 = b.join("");
    let d1 = strings::levenshtein_similarity(&str1, &str2);
    let d2 = strings::jaro_winkler_similarity(&str1, &str2, Some(false));
    (d1 + d2) / 2.0
}

fn compute_structural_score(a: &[String], b: &[String]) -> f64 {
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

#[derive(Debug)]
struct Candidate {
    struct_score: f64,
    length_score: f64, // structural score adjusted by the length of the synonym to favor longer matches
    token_start: usize,
    token_end: usize,
    name: String,   // fruit
    value: String,  // Watermelon
    source: String, // water-meln
}

#[derive(Debug)]
pub struct ListEntityModel {
    pub name: String,
    pub fuzzy: f64,
    pub tokens: HashMap<String, Vec<Vec<String>>>,
}

#[derive(Debug)]
struct ListEntitySynonym {
    name: String,
    fuzzy: f64,
    value: String,
    tokens: Vec<String>,
    max_synonym_len: usize,
}

#[derive(Debug)]
pub struct ListEntityExtraction {
    pub name: String,
    pub confidence: f64,
    pub value: String,
    pub source: String,
    pub char_start: usize,
    pub char_end: usize,
}

fn extract_for_synonym(tokens: &[Token], synonym: &ListEntitySynonym) -> Vec<Candidate> {
    let mut candidates: Vec<Candidate> = Vec::new();
    let synonym_str = synonym.tokens.join("");

    for token_idx in 0..tokens.len() {
        if tokens[token_idx].is_space {
            continue;
        }

        let workset: Vec<String> = take_until(tokens, token_idx, synonym_str.len())
            .iter()
            .map(|x| x.value.clone())
            .collect();

        let source = workset.join("");

        let is_fuzzy = synonym.fuzzy < 1.0 && source.len() >= 4;

        let exact_score = compute_exact_score(&workset, &synonym.tokens);
        let exact_factor = if exact_score == 1.0 { 1.0 } else { 0.0 };

        let fuzzy_score = compute_fuzzy_score(
            &workset
                .iter()
                .map(|x| x.to_lowercase())
                .collect::<Vec<String>>(),
            &synonym
                .tokens
                .iter()
                .map(|x| x.to_lowercase())
                .collect::<Vec<String>>(),
        );
        let fuzzy_factor = if fuzzy_score >= synonym.fuzzy {
            fuzzy_score
        } else {
            0.0
        };

        let used_factor = if is_fuzzy { fuzzy_factor } else { exact_factor };
        let struct_score = used_factor * compute_structural_score(&workset, &synonym.tokens);

        let used_length = source.len().min(synonym.max_synonym_len);
        let length_score = struct_score * (used_length as f64).powf(0.2);

        candidates.push(Candidate {
            struct_score,
            length_score,
            name: synonym.name.clone(),
            value: synonym.value.clone(),
            token_start: token_idx,
            token_end: token_idx + workset.len() - 1,
            source,
        });
    }

    candidates
}

fn flatten_synonyms(list_model: ListEntityModel) -> Vec<ListEntitySynonym> {
    let mut flat: Vec<ListEntitySynonym> = vec![];

    for (value, synonyms) in list_model.tokens {
        let max_synonym_len: usize = synonyms.iter().map(|s| s.join("").len()).max().unwrap_or(0);

        for synonym_tokens in synonyms {
            flat.push(ListEntitySynonym {
                name: list_model.name.clone(),
                fuzzy: list_model.fuzzy,
                value: value.clone(),
                tokens: synonym_tokens.clone(),
                max_synonym_len: max_synonym_len,
            });
        }
    }

    flat
}

pub fn extract_for_list_model(
    str_tokens: Vec<String>,
    list_model: ListEntityModel,
) -> Vec<ListEntityExtraction> {
    let utt_tokens = to_tokens(&str_tokens);

    let synonyms: Vec<ListEntitySynonym> = flatten_synonyms(list_model);

    // A) extract all candidates

    let mut candidates: Vec<Candidate> = Vec::new();
    for synonym in &synonyms {
        let new_candidates = extract_for_synonym(&utt_tokens, synonym);
        candidates.extend(new_candidates);
    }

    // B) eliminate overlapping candidates

    let mut eliminated: Vec<bool> = (0..candidates.len()).map(|_| false).collect();

    for token_idx in 0..utt_tokens.len() {
        let token_candidates: Vec<(usize, &Candidate)> = candidates
            .iter()
            .enumerate()
            .filter(|(_, c)| c.token_start <= token_idx && c.token_end >= token_idx)
            .collect();

        let mut active_token_candidates: Vec<&(usize, &Candidate)> = token_candidates
            .iter()
            .filter(|(i, _)| !eliminated[*i])
            .collect();

        // we use length adjusted score to favor longer matches
        active_token_candidates.sort_by(|(_, a), (_, b)| {
            if a.length_score > b.length_score {
                Ordering::Less // reverse order
            } else if a.length_score < b.length_score {
                Ordering::Greater
            } else {
                Ordering::Equal
            }
        });

        if active_token_candidates.len() <= 1 {
            continue;
        }

        let losers = &active_token_candidates[1..];
        for (loser_idx, _) in losers {
            eliminated[*loser_idx] = true;
        }
    }

    let winners: Vec<&Candidate> = candidates
        .iter()
        .enumerate()
        .filter(|(i, _)| !eliminated[*i])
        .map(|(_, c)| c)
        .collect();

    // C) from winners keep only matches with high enough structural score
    let matches: Vec<&Candidate> = winners
        .iter()
        .filter(|x| x.struct_score >= ENTITY_SCORE_THRESHOLD)
        .cloned()
        .collect();

    // D) map to results
    let results: Vec<ListEntityExtraction> = matches
        .iter()
        .map(|match_| ListEntityExtraction {
            name: match_.name.clone(),
            confidence: match_.struct_score,
            char_start: utt_tokens[match_.token_start].char_start,
            char_end: utt_tokens[match_.token_end].char_end,
            value: match_.value.clone(),
            source: match_.source.clone(),
        })
        .collect();

    results
}
