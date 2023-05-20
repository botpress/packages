use serde::ser::{Serialize, SerializeStruct, Serializer};

struct Color {
    r: u8,
    g: u8,
    b: u8,
}

#[derive(Clone)]
struct Token {
    value: String,
    is_word: bool,
    is_space: bool,
    start_char: usize,
    end_char: usize,
    start_token: usize,
    end_token: usize,
}

impl Serialize for Color {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // 3 is the number of fields in the struct.
        let mut state = serializer.serialize_struct("Color", 3)?;
        state.serialize_field("r", &self.r)?;
        state.serialize_field("g", &self.g)?;
        state.serialize_field("b", &self.b)?;
        state.end()
    }
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
        state.serialize_field("start_char", &self.start_char)?;
        state.serialize_field("end_char", &self.end_char)?;
        state.serialize_field("start_token", &self.start_token)?;
        state.serialize_field("end_token", &self.end_token)?;
        state.end()
    }
}
