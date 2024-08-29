import { useReducer, useState, useEffect, SetStateAction } from 'react'

export function useForceUpdate() {
  const [, dispatch] = useReducer(() => ({}), {})
  return dispatch
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | SetStateAction<T>) => void] {
  const getStoredValue = (): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(getStoredValue)

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
