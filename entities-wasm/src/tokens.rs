use crate::lodash;

#[derive(Clone, Debug)]
pub struct Token {
    pub value: String,
    pub is_space: bool,
    pub char_start: usize,
    pub char_end: usize,
}

fn is_space(str: String) -> bool {
    str.chars().all(|c| c == ' ')
}

pub fn to_tokens(str_tokens: &Vec<String>) -> Vec<Token> {
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

pub fn take_until(arr: &[Token], start: usize, desired_length: usize) -> Vec<Token> {
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
