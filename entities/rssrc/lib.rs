use std::collections::HashMap;
use wasm_bindgen::prelude::*;

mod engine;
mod lodash;
mod strings;

extern crate console_error_panic_hook;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn jaro_winkler_sim(a: String, b: String) -> f64 {
    init();
    strings::jaro_winkler_similarity(&a, &b, None)
}

#[wasm_bindgen]
pub fn levenshtein_sim(a: String, b: String) -> f64 {
    init();
    strings::levenshtein_similarity(&a, &b)
}

#[wasm_bindgen]
pub fn levenshtein_dist(a: String, b: String) -> usize {
    init();
    strings::levenshtein_distance(&a, &b)
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct ValueDefinition {
    name: String,
    synonyms: SynonymArray,
}
#[wasm_bindgen]
impl ValueDefinition {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, synonyms: SynonymArray) -> Self {
        Self { name, synonyms }
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct SynonymDefinition {
    tokens: StringArray,
}
#[wasm_bindgen]
impl SynonymDefinition {
    #[wasm_bindgen(constructor)]
    pub fn new(tokens: StringArray) -> Self {
        Self { tokens }
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct EntityDefinition {
    name: String,
    fuzzy: f64,
    values: ValueArray,
}
#[wasm_bindgen]
impl EntityDefinition {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, fuzzy: f64, values: ValueArray) -> Self {
        Self {
            name,
            fuzzy,
            values,
        }
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct EntityExtraction {
    name: String,
    pub confidence: f64,
    pub char_start: usize,
    pub char_end: usize,
    value: String,
    source: String,
}
#[wasm_bindgen]
impl EntityExtraction {
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn value(&self) -> String {
        self.value.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn source(&self) -> String {
        self.source.clone()
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct StringArray(Vec<String>);
#[wasm_bindgen]
impl StringArray {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StringArray {
        StringArray(Vec::new())
    }

    #[wasm_bindgen]
    pub fn push(&mut self, s: String) {
        self.0.push(s);
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct SynonymArray(Vec<SynonymDefinition>);
#[wasm_bindgen]
impl SynonymArray {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SynonymArray {
        SynonymArray(Vec::new())
    }

    #[wasm_bindgen]
    pub fn push(&mut self, s: SynonymDefinition) {
        self.0.push(s);
    }
}

#[derive(Clone)]
#[wasm_bindgen]
pub struct ValueArray(Vec<ValueDefinition>);
#[wasm_bindgen]
impl ValueArray {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ValueArray {
        ValueArray(Vec::new())
    }

    #[wasm_bindgen]
    pub fn push(&mut self, s: ValueDefinition) {
        self.0.push(s);
    }
}

#[wasm_bindgen]
pub struct ExtractionArray(Vec<EntityExtraction>);
#[wasm_bindgen]
impl ExtractionArray {
    fn from(x: Vec<EntityExtraction>) -> Self {
        Self(x)
    }

    #[wasm_bindgen]
    pub fn get(&self, idx: usize) -> EntityExtraction {
        self.0.get(idx).unwrap().clone()
    }
    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.0.len()
    }
}

#[wasm_bindgen]
pub fn extract(arg0: StringArray, arg1: EntityDefinition) -> ExtractionArray {
    init();
    let str_tokens: Vec<String> = arg0.0;

    let mut tokens: HashMap<String, Vec<Vec<String>>> = HashMap::new();
    for value in arg1.values.0 {
        let mut synonyms: Vec<Vec<String>> = Vec::new();
        for synonym in value.synonyms.0 {
            synonyms.push(synonym.tokens.0);
        }
        tokens.insert(value.name, synonyms);
    }

    let list_model: engine::ListEntityModel = engine::ListEntityModel {
        name: arg1.name,
        fuzzy: arg1.fuzzy,
        tokens,
    };

    let list_extractions = engine::extract_for_list_model(str_tokens, list_model);

    let extractions: Vec<EntityExtraction> = list_extractions
        .into_iter()
        .map(|match_| EntityExtraction {
            name: match_.name.clone(),
            confidence: match_.confidence,
            char_start: match_.char_start,
            char_end: match_.char_end,
            value: match_.value.clone(),
            source: match_.source.clone(),
        })
        .collect();

    ExtractionArray::from(extractions)
}
