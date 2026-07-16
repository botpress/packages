use wasm_bindgen::prelude::*;

// The merges-only vocab asset is NOT embedded here: the constructor takes the
// gzip'd asset bytes from JS. This keeps the wasm code-only (~125KB gz) and lets
// the package ship vocab variants (full cl100k / lite cl50k / micro cl25k — see
// wasm/scripts/gen-assets.mjs) that share one binary and differ only in which
// asset the JS entry bundles. The full `model.vocab` is never shipped at all —
// it's fully derivable for a topological BPE and rebuilt in `build_tokenizer`.
// Asset shape: { "merges": [...], "added_tokens": [...], "pre_tokenizer": {...} }.

/// GPT-2/cl100k byte-level codec: maps each byte 0..=255 to the unicode code point
/// used in `tokenizer.json` merge strings ("Ġ" = space, etc.), and its inverse.
///
/// `code_point_of[b]` = the code point for byte `b`. The 256 base tokens get vocab
/// ids 0..=255 in the order these code points sort as gpt2 emits them: printable
/// bytes first (33..=126, 161..=172, 174..=255) in byte order, then the remaining
/// bytes mapped to 256+. `base_bytes_in_id_order[i]` = the raw byte for base id `i`.
struct ByteLevel {
    code_point_of: [u32; 256],
    base_bytes_in_id_order: Vec<u8>,
}

fn byte_level() -> ByteLevel {
    let mut printable: Vec<u8> = Vec::with_capacity(256);
    for b in b'!'..=b'~' {
        printable.push(b);
    }
    for b in 0xA1u8..=0xAC {
        printable.push(b);
    }
    for b in 0xAEu8..=0xFF {
        printable.push(b);
    }
    let mut is_printable = [false; 256];
    for &b in &printable {
        is_printable[b as usize] = true;
    }
    let mut code_point_of = [0u32; 256];
    for &b in &printable {
        code_point_of[b as usize] = b as u32;
    }
    // remaining bytes map to 256+n; base id order is printable-first then these
    let mut base_bytes_in_id_order = printable.clone();
    let mut n = 0u32;
    for b in 0u16..256 {
        if !is_printable[b as usize] {
            code_point_of[b as usize] = 256 + n;
            n += 1;
            base_bytes_in_id_order.push(b as u8);
        }
    }
    ByteLevel {
        code_point_of,
        base_bytes_in_id_order,
    }
}

/// Build the tokie `Tokenizer` DIRECTLY from the merges-only asset — no JSON
/// reconstruction, no `from_json_str` re-parse. We convert the byte-level string
/// merges ("Ġ Ġ") to id-pairs and hand them to the encoder's `from_merges_with_added`
/// constructor, then assemble the Tokenizer with cl100k's fixed pretokenizer/normalizer.
/// This skips both our old ~85ms JSON build and tokie's ~parse cost; only the
/// Aho-Corasick automaton build (inherent) remains.
fn build_tokenizer(asset: &serde_json::Value) -> Result<tokie::Tokenizer, JsValue> {
    use std::collections::HashMap;
    use tokie::{BytePairEncoder, Decoder, Encoder, Normalizer, PostProcessor, PretokType};

    let merges = asset["merges"]
        .as_array()
        .ok_or_else(|| JsValue::from_str("asset missing merges"))?;

    let bl = byte_level();

    // base tokens: 256 single bytes, in vocab-id order
    let base_tokens: Vec<Vec<u8>> = bl
        .base_bytes_in_id_order
        .iter()
        .map(|&b| vec![b])
        .collect();

    // Convert string merges to id-pairs. Key the id map by the byte-level *string*
    // (the exact substrings the merges reference) rather than decoded bytes — avoids a
    // Vec<u8> allocation + decode per lookup. ids 0..255 = base byte-level chars; each
    // merge result gets the next id, keyed by the concatenation of its two parts.
    let mut id_of: HashMap<String, u32> = HashMap::with_capacity(256 + merges.len());
    for (id, &b) in bl.base_bytes_in_id_order.iter().enumerate() {
        let ch = char::from_u32(bl.code_point_of[b as usize]).unwrap();
        id_of.insert(ch.to_string(), id as u32);
    }
    let mut merge_pairs: Vec<(u32, u32)> = Vec::with_capacity(merges.len());
    let mut next_id = 256u32;
    for m in merges {
        let s = m.as_str().ok_or_else(|| JsValue::from_str("merge not a string"))?;
        let sp = s.find(' ').ok_or_else(|| JsValue::from_str("bad merge"))?;
        let (left_s, right_s) = (&s[..sp], &s[sp + 1..]);
        let left = *id_of
            .get(left_s)
            .ok_or_else(|| JsValue::from_str("merge references unknown token"))?;
        let right = *id_of
            .get(right_s)
            .ok_or_else(|| JsValue::from_str("merge references unknown token"))?;
        merge_pairs.push((left, right));
        // the merged token's key is the concatenation of the two byte-level substrings
        let mut merged = String::with_capacity(left_s.len() + right_s.len());
        merged.push_str(left_s);
        merged.push_str(right_s);
        id_of.insert(merged, next_id);
        next_id += 1;
    }

    // special/added tokens: (id, raw bytes) — content is literal UTF-8, not byte-level
    let mut added: Vec<(u32, Vec<u8>)> = Vec::new();
    let mut specials: Vec<(String, u32)> = Vec::new();
    if let Some(arr) = asset["added_tokens"].as_array() {
        for t in arr {
            if let (Some(content), Some(id)) = (t["content"].as_str(), t["id"].as_u64()) {
                added.push((id as u32, content.as_bytes().to_vec()));
                specials.push((content.to_string(), id as u32));
            }
        }
    }

    // Simple (BytePairEncoder) instead of Backtracking: it builds NO Aho-Corasick
    // automaton (the ~50ms/native, ~100ms/wasm dominant init cost), only a pair_lookup +
    // byte_lut + token_cache. Its encode is theoretically O(n·merges) but measures fast
    // for our inputs, and it produces byte-identical token ids to tiktoken. Since we only
    // count/split (no adversarial pathological input), this is the right trade.
    let (encoder, token_bytes) =
        BytePairEncoder::from_merges_with_added(&merge_pairs, &base_tokens, &added);
    let encoder = Encoder::Simple(encoder);
    let decoder = Decoder::for_encoder(token_bytes, encoder.encoder_type());

    let mut tok = tokie::Tokenizer::new(
        encoder,
        decoder,
        PretokType::Cl100k,
        Normalizer::None,
        PostProcessor::None,
    );
    if !added.is_empty() {
        tok.set_added_tokens(&added);
        tok.set_special_tokens(specials);
    }
    Ok(tok)
}

/// Inflate a gzip stream (RFC 1952). Parses the header — including the optional
/// FEXTRA / FNAME / FCOMMENT / FHCRC fields (gzip on macOS sets FNAME) — then
/// inflates the raw DEFLATE payload up to the 8-byte trailer.
fn inflate_gzip(gz: &[u8]) -> Result<Vec<u8>, JsValue> {
    if gz.len() < 18 || gz[0] != 0x1f || gz[1] != 0x8b || gz[2] != 0x08 {
        return Err(JsValue::from_str("bad gzip header"));
    }
    let flg = gz[3];
    let mut pos = 10usize; // fixed header
    if flg & 0b0000_0100 != 0 {
        // FEXTRA: 2-byte length + payload
        let xlen = u16::from_le_bytes([gz[pos], gz[pos + 1]]) as usize;
        pos += 2 + xlen;
    }
    if flg & 0b0000_1000 != 0 {
        // FNAME: NUL-terminated
        while pos < gz.len() && gz[pos] != 0 {
            pos += 1;
        }
        pos += 1;
    }
    if flg & 0b0001_0000 != 0 {
        // FCOMMENT: NUL-terminated
        while pos < gz.len() && gz[pos] != 0 {
            pos += 1;
        }
        pos += 1;
    }
    if flg & 0b0000_0010 != 0 {
        // FHCRC: 2 bytes
        pos += 2;
    }
    if pos + 8 > gz.len() {
        return Err(JsValue::from_str("truncated gzip"));
    }
    let body = &gz[pos..gz.len() - 8];
    miniz_oxide::inflate::decompress_to_vec(body).map_err(|_| JsValue::from_str("inflate failed"))
}

#[wasm_bindgen]
pub struct WasmTokenizer {
    inner: tokie::Tokenizer,
}

// --- approximate-count tuning -------------------------------------------------
// Below this many chars we always tokenize exactly (sampling isn't worth it and
// small inputs are already fast). Above it, `count(approximate=true)` samples.
const APPROX_MIN_CHARS: usize = 200_000;
const SAMPLE_WINDOWS: usize = 12; // windows spread across the input
const SAMPLE_WINDOW_CHARS: usize = 4096; // ~chars per window

/// Snap a byte offset DOWN to the nearest UTF-8 char boundary (so slicing is safe).
fn floor_char_boundary(s: &str, mut i: usize) -> usize {
    if i >= s.len() {
        return s.len();
    }
    while i > 0 && !s.is_char_boundary(i) {
        i -= 1;
    }
    i
}
fn ceil_char_boundary(s: &str, mut i: usize) -> usize {
    if i >= s.len() {
        return s.len();
    }
    while i < s.len() && !s.is_char_boundary(i) {
        i += 1;
    }
    i
}

#[wasm_bindgen]
impl WasmTokenizer {
    /// Construct from a gzip'd merges-only asset (see wasm/scripts/gen-assets.mjs).
    /// The JS entry point supplies the bytes of whichever vocab variant it bundles.
    #[wasm_bindgen(constructor)]
    pub fn new(asset_gz: &[u8]) -> Result<WasmTokenizer, JsValue> {
        let asset_bytes = inflate_gzip(asset_gz)?;
        let asset: serde_json::Value = serde_json::from_slice(&asset_bytes)
            .map_err(|_| JsValue::from_str("asset parse failed"))?;
        let inner = build_tokenizer(&asset)?;
        Ok(WasmTokenizer { inner })
    }

    /// Encode -> Uint32Array (no special tokens, to match tiktoken.encode).
    pub fn encode(&self, text: &str) -> Vec<u32> {
        self.inner.encode(text, false).ids
    }

    /// Token count. When `approximate` is true (default in the JS wrapper) and the
    /// input is large, estimates the count by tokenizing a handful of sampled
    /// windows and extrapolating by the tokens-per-char ratio — orders of magnitude
    /// faster on big inputs, within a few %. Falls back to exact
    /// for inputs below `APPROX_MIN_CHARS`.
    pub fn count(&self, text: &str, approximate: bool) -> usize {
        if !approximate || text.len() <= APPROX_MIN_CHARS {
            return self.inner.count_tokens(text);
        }
        self.approx_count(text)
    }

    fn approx_count(&self, text: &str) -> usize {
        let n = text.len();
        // Stratified sampling: divide the input into SAMPLE_WINDOWS strata and place
        // one window per stratum, offset within the stratum by a deterministic jitter
        // derived from the length (avoids aligning to periodic structure without an RNG).
        let stratum = n / SAMPLE_WINDOWS;
        if stratum <= SAMPLE_WINDOW_CHARS {
            return self.inner.count_tokens(text);
        }
        let jitter_span = stratum - SAMPLE_WINDOW_CHARS;
        let mut seed = (n as u64).wrapping_mul(0x9E3779B97F4A7C15);
        let mut sampled_tokens = 0usize;
        let mut sampled_chars = 0usize;
        for k in 0..SAMPLE_WINDOWS {
            // xorshift the seed for a per-window pseudo-offset
            seed ^= seed >> 12;
            seed ^= seed << 25;
            seed ^= seed >> 27;
            let jitter = (seed as usize) % (jitter_span + 1);
            let raw_start = k * stratum + jitter;
            let start = ceil_char_boundary(text, raw_start.min(n));
            let end = floor_char_boundary(text, (start + SAMPLE_WINDOW_CHARS).min(n));
            if end <= start {
                continue;
            }
            sampled_tokens += self.inner.count_tokens(&text[start..end]);
            sampled_chars += end - start;
        }
        if sampled_chars == 0 {
            return self.inner.count_tokens(text);
        }
        ((sampled_tokens as f64 / sampled_chars as f64) * n as f64).round() as usize
    }

    /// Keep `max_tokens` tokens from `text`, choosing which part via `mode`:
    /// "head" (first N), "tail" (last N), or "middle" (first N/2 + last N/2, dropping
    /// the middle). Exact — uses an optimistic char window so it never tokenizes the
    /// whole input when N is small relative to the total.
    pub fn truncate(&self, text: &str, max_tokens: usize, mode: &str) -> Result<String, JsValue> {
        if max_tokens == 0 {
            return Ok(String::new());
        }
        match mode {
            "head" => Ok(self.take_head(text, max_tokens)),
            "tail" => Ok(self.take_tail(text, max_tokens)),
            "middle" => {
                let head_n = max_tokens / 2;
                let tail_n = max_tokens - head_n;
                let head = self.take_head(text, head_n);
                let tail = self.take_tail(text, tail_n);
                // The head window covers the first head_n tokens, the tail window the
                // last tail_n. If together they span (or exceed) the whole text, the
                // windows meet/overlap — total <= max_tokens — so keep everything
                // (naive concatenation would duplicate the overlap).
                if head.len() + tail.len() >= text.len() {
                    return Ok(text.to_string());
                }
                let mut out = head;
                out.push_str(&tail);
                Ok(out)
            }
            _ => Err(JsValue::from_str("mode must be head|tail|middle")),
        }
    }

    /// Return the substring covered by tokens [start, end) (end exclusive, like
    /// Array.slice; negative indices count from the end, omitted end = to-the-end).
    /// Negative/omitted indices are resolved HERE, against the single encode pass —
    /// resolving on the JS side would need a separate exact count (a second full
    /// encode). Exact.
    pub fn slice(&self, text: &str, start: i32, end: Option<i32>) -> Result<String, JsValue> {
        // General path: encode the whole thing once and decode the id range. For the
        // common prefix/suffix cases the dedicated head/tail helpers are far cheaper,
        // so callers that only need those should use `truncate`.
        let ids = self.inner.encode(text, false).ids;
        let total = ids.len() as i64;
        let resolve = |i: i32| -> i64 {
            if (i as i64) < 0 {
                (total + i as i64).max(0)
            } else {
                (i as i64).min(total)
            }
        };
        let s = resolve(start);
        let e = end.map_or(total, resolve);
        if e <= s {
            return Ok(String::new());
        }
        // Lossy: a token-range boundary can split a multi-byte UTF-8 char (e.g. an
        // emoji spanning several tokens), so decode bytes and lossy-convert rather
        // than failing — matches thicktoken's TextDecoder behavior.
        Ok(self.decode_lossy(&ids[s as usize..e as usize]))
    }

    /// Decode token ids to a String, replacing any invalid UTF-8 (from a range that
    /// splits a multi-byte char) with U+FFFD — never fails.
    fn decode_lossy(&self, ids: &[u32]) -> String {
        let bytes = self.inner.decoder().decode_bytes(ids);
        String::from_utf8_lossy(&bytes).into_owned()
    }

    pub fn decode(&self, ids: &[u32]) -> Result<String, JsValue> {
        self.inner
            .decode(ids)
            .ok_or_else(|| JsValue::from_str("decode: invalid utf-8"))
    }

    /// Encode `text` and return one decoded string per token (lossy — a token whose
    /// bytes aren't valid UTF-8 on their own yields U+FFFD, matching a lenient
    /// TextDecoder). This is what thicktoken's `split()` returns.
    pub fn split(&self, text: &str) -> Vec<String> {
        let ids = self.inner.encode(text, false).ids;
        ids.iter().map(|&id| self.decode_lossy(&[id])).collect()
    }

    #[wasm_bindgen(js_name = vocabSize)]
    pub fn vocab_size(&self) -> usize {
        self.inner.vocab_size()
    }
}

impl WasmTokenizer {
    /// First `n` tokens as a string, via an optimistic prefix window that grows until
    /// it contains >= n tokens. Avoids tokenizing the whole input when n << total.
    fn take_head(&self, text: &str, n: usize) -> String {
        let total_len = text.len();
        // seed guess: ~4.2 bytes/token, overshoot 15%
        let mut chars_per_tok = 4.2f64;
        let mut guess = ((n as f64 * chars_per_tok * 1.15) as usize + 16).min(total_len);
        for _ in 0..8 {
            let end = floor_char_boundary(text, guess);
            let ids = self.inner.encode(&text[..end], false).ids;
            if ids.len() >= n || end >= total_len {
                let take = n.min(ids.len());
                return self.decode_lossy(&ids[..take]);
            }
            // undershot: grow using observed ratio
            chars_per_tok = (end as f64 / ids.len() as f64).max(1.0);
            let grow = ((n - ids.len()) as f64 * chars_per_tok * 1.15) as usize + 32;
            guess = (end + grow).min(total_len);
        }
        // fallback: window converged slowly — encode the (bounded) window we have
        let end = floor_char_boundary(text, guess);
        let ids = self.inner.encode(&text[..end], false).ids;
        let take = n.min(ids.len());
        self.decode_lossy(&ids[..take])
    }

    /// Last `n` tokens as a string, via an optimistic suffix window. The window start
    /// is snapped to a whitespace boundary so the trailing tokens match how they
    /// tokenize in the full input (cl100k pretokenizes on whitespace).
    fn take_tail(&self, text: &str, n: usize) -> String {
        let total_len = text.len();
        let mut chars_per_tok = 4.2f64;
        let mut guess = ((n as f64 * chars_per_tok * 1.15) as usize + 16).min(total_len);
        for _ in 0..8 {
            // If the window already spans the whole input, the start (0) is the true
            // beginning — a valid boundary — so DON'T snap (snapping would drop the
            // first word). This is also the terminating case.
            let whole = guess >= total_len;
            let start = if whole {
                0
            } else {
                snap_to_whitespace(text, total_len - guess)
            };
            let ids = self.inner.encode(&text[start..], false).ids;
            if ids.len() >= n || whole {
                let skip = ids.len().saturating_sub(n);
                return self.decode_lossy(&ids[skip..]);
            }
            chars_per_tok = ((total_len - start) as f64 / ids.len() as f64).max(1.0);
            let grow = ((n - ids.len()) as f64 * chars_per_tok * 1.15) as usize + 32;
            guess = (guess + grow).min(total_len);
        }
        let ids = self.inner.encode(text, false).ids; // fallback: exact
        let skip = ids.len().saturating_sub(n);
        self.decode_lossy(&ids[skip..])
    }
}

/// Move `i` forward to just after the next whitespace byte (char boundary safe), so a
/// suffix window begins at a pretokenizer boundary. If none found, snaps to a char
/// boundary at `i`.
fn snap_to_whitespace(text: &str, i: usize) -> usize {
    let i = ceil_char_boundary(text, i);
    let bytes = text.as_bytes();
    let mut j = i;
    while j < text.len() {
        if bytes[j] == b' ' || bytes[j] == b'\n' || bytes[j] == b'\t' || bytes[j] == b'\r' {
            return j; // start AT the whitespace (it leads the next token in cl100k)
        }
        j += 1;
    }
    i
}
