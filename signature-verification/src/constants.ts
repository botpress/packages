const SIGNATURE_HEADER_MIN_HASHES = 1
const SIGNATURE_HEADER_MAX_HASHES = 5

// Signatures are valid if their timestamp is within ±5 minutes of the current time (max skew 5 minutes):
export const SIGNATURE_VALIDATION_WINDOW_MS = 300_000

export const SIGNATURE_HEADER_MIN_PARTS = 1 + SIGNATURE_HEADER_MIN_HASHES
export const SIGNATURE_HEADER_MAX_PARTS = 1 + SIGNATURE_HEADER_MAX_HASHES
export const SIGNATURE_HASH_BASE64_LENGTH = 43

export const SIGNATURE_HEADER_DELIMITER = ','
export const TIMESTAMP_PAYLOAD_DELIMITER = '.'
