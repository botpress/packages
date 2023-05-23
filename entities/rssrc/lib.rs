use serde;
use serde::de::{Deserialize, Deserializer, MapAccess, SeqAccess, Visitor};
use serde::ser::{Serialize, SerializeStruct, Serializer};
use serde_wasm_bindgen;

use std::cmp::Ordering;
use std::collections::HashMap;
use std::fmt;
use wasm_bindgen::prelude::*;

extern crate console_error_panic_hook;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn init() {
    console_error_panic_hook::set_once();
}

/**
 * #######################
 * ###    0. lodash    ###
 * #######################
 */

fn intersection<T: PartialEq + Clone>(arr1: &[T], arr2: &[T]) -> Vec<T> {
    let mut res = vec![];
    for x in arr1 {
        if arr2.contains(x) {
            res.push(x.clone());
        }
    }
    res
}

fn union<T: PartialEq + Clone>(arr1: &[T], arr2: &[T]) -> Vec<T> {
    let mut res = vec![];
    for x in arr1 {
        if !res.contains(x) {
            res.push(x.clone());
        }
    }
    for x in arr2 {
        if !res.contains(x) {
            res.push(x.clone());
        }
    }
    res
}

fn uniq<T: PartialEq + Clone>(arr: &[T]) -> Vec<T> {
    let mut res = vec![];
    for x in arr {
        if !res.contains(x) {
            res.push(x.clone());
        }
    }
    res
}

fn min(arr: &[usize]) -> usize {
    let mut min = arr[0];
    for x in arr {
        if *x < min {
            min = *x;
        }
    }
    min
}

fn max(arr: &[usize]) -> usize {
    let mut max = arr[0];
    for x in arr {
        if *x > max {
            max = *x;
        }
    }
    max
}

fn abs(n: i32) -> i32 {
    if n < 0 {
        -n
    } else {
        n
    }
}

// fn orderBy<T>(arr: &[T], key: &str, order: &str) -> Vec<T> {
//     let mut res = arr.to_vec();
//     res.sort_by(|a, b| {
//         let a = a.as_ref();
//         let b = b.as_ref();
//         if order == "asc" {
//             a[key].cmp(&b[key])
//         } else {
//             b[key].cmp(&a[key])
//         }
//     });
//     res
// }

/**
 * ########################
 * ###    1. strings    ###
 * ########################
 */

/**
 * Returns the jaro-winkler similarity between two strings
 * @param s1 String A
 * @param s2 String B
 * @returns A number between 0 and 1, where 1 means very similar
 */
fn jaro_winkler_similarity(s1: &str, s2: &str, case_sensitive: Option<bool>) -> f64 {
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

    let mut m: i32 = 0;
    let max_len = max(&[s1.len(), s2.len()]);
    let range = (max_len / 2) - 1;
    let mut s1_matches = vec![false; s1.len()];
    let mut s2_matches = vec![false; s2.len()];

    for i in 0..s1.len() {
        let low = if i >= range { i - range } else { 0 };
        let high = if i + range <= s2.len() - 1 {
            i + range
        } else {
            s2.len() - 1
        };

        for j in low..=high {
            if !s1_matches[i] && !s2_matches[j] && s1.chars().nth(i) == s2.chars().nth(j) {
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

        if s1.chars().nth(i) != s2.chars().nth(j) {
            num_trans += 1;
        }
    }

    let mut weight = (m as f64 / s1.len() as f64
        + m as f64 / s2.len() as f64
        + (m - num_trans / 2) as f64 / m as f64)
        / 3.0;

    let p = 0.1;

    if weight > 0.7 {
        let mut l = 0;
        while s1.chars().nth(l) == s2.chars().nth(l) && l < 4 {
            l += 1;
        }

        weight += l as f64 * p * (1.0 - weight);
    }

    weight
}

/**
* Returns the levenshtein similarity between two strings
* sim(a, b) = (|b| - dist(a, b)) / |b| where |a| < |b|
* sim(a, b) ∈ [0, 1]
* @returns the proximity between 0 and 1, where 1 is very close
*/
fn levenshtein_similarity(a: &str, b: &str) -> f64 {
    let len = a.len().max(b.len());
    let dist = levenshtein_distance(a, b);
    (len - dist) as f64 / len as f64
}

/**
* Returns the levenshtein distance two strings, i.e. the # of operations required to go from a to b
* dist(a, b) ∈ [0, max(|a|, |b|)]
*/
fn levenshtein_distance(a: &str, b: &str) -> usize {
    if a.is_empty() || b.is_empty() {
        return 0;
    }

    let (a, b) = if a.len() > b.len() { (b, a) } else { (a, b) };

    let mut res: usize = 0;

    let alen = a.len();
    let blen = b.len();
    let mut row = (0..alen + 1).collect::<Vec<usize>>();

    let mut tmp: usize;

    for i in 1..=blen {
        res = i;

        for j in 1..=alen {
            tmp = row[j - 1];
            row[j - 1] = res;

            if b.chars().nth(i - 1) == a.chars().nth(j - 1) {
                res = tmp;
            } else {
                res = min(&[tmp + 1, res + 1, row[j] + 1])
            }
        }
    }

    res
}

/**
 * #####################
 * ###   2. tokens   ###
 * #####################
 */

#[derive(Clone)]
struct Token {
    value: String,
    is_word: bool,
    is_space: bool,
    char_start: usize,
    char_end: usize,
    start_token: usize,
    end_token: usize,
}

const SPECIAL_CHARSET: [&str; 45] = [
    "¿", "÷", "≥", "≤", "µ", "˜", "∫", "√", "≈", "æ", "…", "¬", "˚", "˙", "©", "+", "-", "_", "!",
    "@", "#", "$", "%", "?", "&", "*", "(", ")", "/", "\\", "[", "]", "{", "}", ":", ";", "<", ">",
    "=", ".", ",", "~", "`", "\"", "'",
];

fn is_word(str: String) -> bool {
    !SPECIAL_CHARSET.iter().any(|c| str.contains(c)) && !has_space(str)
}

fn has_space(str: String) -> bool {
    str.contains(' ')
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
            is_word: is_word(str_token.to_string()),
            is_space: is_space(str_token.to_string()),
            char_start: char_index,
            char_end: char_index + str_token.len(),
            start_token: i,
            end_token: i + 1,
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
            if current > 0 && abs(des_len - current) < abs(des_len - current - to_add) {
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
    let d1 = levenshtein_similarity(&str1, &str2);
    let d2 = jaro_winkler_similarity(&str1, &str2, Some(false));
    (d1 + d2) / 2.0
}

fn compute_structural_score(a: &[String], b: &[String]) -> f64 {
    let mut charset1: Vec<char> = a.iter().flat_map(|x| x.chars()).collect();
    let mut charset2: Vec<char> = b.iter().flat_map(|x| x.chars()).collect();

    charset1 = uniq(&charset1);
    charset2 = uniq(&charset2);

    let charset_score =
        intersection(&charset1, &charset2).len() as f64 / union(&charset1, &charset2).len() as f64;
    let charset_low1: Vec<char> = charset1.iter().map(|c| c.to_ascii_lowercase()).collect();
    let charset_low2: Vec<char> = charset2.iter().map(|c| c.to_ascii_lowercase()).collect();
    let charset_low_score = intersection(&charset_low1, &charset_low2).len() as f64
        / union(&charset_low1, &charset_low2).len() as f64;
    let final_charset_score = (charset_score + charset_low_score) / 2.0;

    let mut la: usize = a.iter().filter(|x| x.len() > 1).count();
    // using a here instead of b is a bug in the original code, but we keep it for compatibility
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
struct ListEntityModel {
    name: String,
    fuzzy: f64,
    tokens: HashMap<String, Vec<Vec<String>>>,
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
struct ListEntityExtraction {
    name: String,
    confidence: f64,
    value: String,
    source: String,
    char_start: usize,
    char_end: usize,
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

fn extract_for_list_model(
    str_tokens: Vec<String>,
    list_model: ListEntityModel,
) -> Vec<ListEntityExtraction> {
    let utt_tokens = to_tokens(&str_tokens);

    let synonyms: Vec<ListEntitySynonym> = flatten_synonyms(list_model);

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

/**
 * ######################
 * ###   4. wasm-io   ###
 * ######################
 */

#[wasm_bindgen]
pub fn jaro_winkler_sim(a: String, b: String) -> f64 {
    init();
    jaro_winkler_similarity(&a, &b, None)
}

#[wasm_bindgen]
pub fn levenshtein_sim(a: String, b: String) -> f64 {
    init();
    levenshtein_similarity(&a, &b)
}

#[wasm_bindgen]
pub fn levenshtein_dist(a: String, b: String) -> usize {
    init();
    levenshtein_distance(&a, &b)
}

impl Serialize for Token {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // 3 is the number of fields in the struct.
        let mut state = serializer.serialize_struct("Token", 7)?;
        state.serialize_field("value", &self.value)?;
        state.serialize_field("is_word", &self.is_word)?;
        state.serialize_field("is_space", &self.is_space)?;
        state.serialize_field("start_char", &self.char_start)?;
        state.serialize_field("end_char", &self.char_end)?;
        state.serialize_field("start_token", &self.start_token)?;
        state.serialize_field("end_token", &self.end_token)?;
        state.end()
    }
}

impl Serialize for ListEntityExtraction {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("ListEntityExtraction", 6)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("confidence", &self.confidence)?;
        state.serialize_field("value", &self.value)?;
        state.serialize_field("source", &self.source)?;
        state.serialize_field("char_start", &self.char_start)?;
        state.serialize_field("char_end", &self.char_end)?;
        state.end()
    }
}

impl<'de> Deserialize<'de> for ListEntityModel {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        enum Field {
            Name,
            Fuzzy,
            Tokens,
        }

        impl<'de> Deserialize<'de> for Field {
            fn deserialize<D>(deserializer: D) -> Result<Field, D::Error>
            where
                D: Deserializer<'de>,
            {
                struct FieldVisitor;

                impl<'de> Visitor<'de> for FieldVisitor {
                    type Value = Field;

                    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                        formatter.write_str("`name`, `fuzzy` or `tokens`")
                    }

                    fn visit_str<E>(self, value: &str) -> Result<Field, E>
                    where
                        E: serde::de::Error,
                    {
                        match value {
                            "name" => Ok(Field::Name),
                            "fuzzy" => Ok(Field::Fuzzy),
                            "tokens" => Ok(Field::Tokens),
                            _ => Err(serde::de::Error::unknown_field(value, FIELDS)),
                        }
                    }
                }

                deserializer.deserialize_identifier(FieldVisitor)
            }
        }

        struct ListEntityModelVisitor;

        impl<'de> Visitor<'de> for ListEntityModelVisitor {
            type Value = ListEntityModel;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("struct Duration")
            }

            fn visit_seq<V>(self, mut seq: V) -> Result<ListEntityModel, V::Error>
            where
                V: SeqAccess<'de>,
            {
                let name = seq
                    .next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(0, &self))?;
                let fuzzy = seq
                    .next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(1, &self))?;
                let tokens = seq
                    .next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(2, &self))?;

                Ok(ListEntityModel {
                    name: name,
                    fuzzy: fuzzy,
                    tokens: tokens,
                })
            }

            fn visit_map<V>(self, mut map: V) -> Result<ListEntityModel, V::Error>
            where
                V: MapAccess<'de>,
            {
                let mut name = None;
                let mut fuzzy = None;
                let mut tokens = None;

                while let Some(key) = map.next_key()? {
                    match key {
                        Field::Name => {
                            if name.is_some() {
                                return Err(serde::de::Error::duplicate_field("name"));
                            }
                            name = Some(map.next_value()?);
                        }
                        Field::Fuzzy => {
                            if fuzzy.is_some() {
                                return Err(serde::de::Error::duplicate_field("fuzzy"));
                            }
                            fuzzy = Some(map.next_value()?);
                        }
                        Field::Tokens => {
                            if tokens.is_some() {
                                return Err(serde::de::Error::duplicate_field("tokens"));
                            }
                            tokens = Some(map.next_value()?);
                        }
                    }
                }
                let name = name.ok_or_else(|| serde::de::Error::missing_field("name"))?;
                let fuzzy = fuzzy.ok_or_else(|| serde::de::Error::missing_field("fuzzy"))?;
                let tokens = tokens.ok_or_else(|| serde::de::Error::missing_field("tokens"))?;
                Ok(ListEntityModel {
                    name: name,
                    fuzzy: fuzzy,
                    tokens: tokens,
                })
            }
        }

        const FIELDS: &'static [&'static str] = &["name", "fuzzy", "tokens"];
        deserializer.deserialize_struct("ListEntityModel", FIELDS, ListEntityModelVisitor)
    }
}

#[wasm_bindgen]
pub fn extract(str_tokens: JsValue, list_model: JsValue) -> JsValue {
    init();
    let str_tokens: Vec<String> = serde_wasm_bindgen::from_value(str_tokens).unwrap();
    let list_model: ListEntityModel = serde_wasm_bindgen::from_value(list_model).unwrap();

    let results = extract_for_list_model(str_tokens, list_model);

    let ret = serde_wasm_bindgen::to_value(&results).unwrap();
    ret
}
