pub struct Rng {
    s: [u64; 4],
}

const GOLDEN_RATIO_64: u64 = 0x9E3779B97F4A7C15;
const MULTIPLIER_1: u64 = 0xBF58476D1CE4E5B9;
const MULTIPLIER_2: u64 = 0x94D049BB133111EB;

impl Rng {
    // splitmix64 seed generator
    pub fn seed_from_u64(seed: u64) -> Self {
        let mut z = seed;
        // get 4 mixed words for our initial state
        let mut next = || {
            z = z.wrapping_add(GOLDEN_RATIO_64);
            let mut x = z;
            x = (x ^ (x >> 30)).wrapping_mul(MULTIPLIER_1);
            x = (x ^ (x >> 27)).wrapping_mul(MULTIPLIER_2);
            x ^ (x >> 31)
        };

        Rng {
            s: [next(), next(), next(), next()],
        }
    }

    fn next_u64(&mut self) -> u64 {
        let result = self.s[1].wrapping_mul(5).rotate_left(7).wrapping_mul(9);

        let t = self.s[1] << 17;
        self.s[2] ^= self.s[0];
        self.s[3] ^= self.s[1];
        self.s[1] ^= self.s[2];
        self.s[0] ^= self.s[3];
        self.s[2] ^= t;
        self.s[3] = self.s[3].rotate_left(45);

        result
    }

    pub fn next_f32(&mut self) -> f32 {
        (self.next_u64() >> 40) as f32 * (1.0 / (1u32 << 24) as f32)
    }

    pub fn gen_range(&mut self, n: usize) -> usize {
        debug_assert!(n > 0, "n must be larger than 0");

        (self.next_u64() % n as u64) as usize
    }
}
