export const isValidUrl = (url: string): boolean => {
  try {
    void new URL(url)
    return true
  } catch {
    return false
  }
}
