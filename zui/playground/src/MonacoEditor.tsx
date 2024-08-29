import loader from '@monaco-editor/loader'
import { AutoTypings, LocalStorageCache } from 'monaco-editor-auto-typings/custom-editor.js'
import React, { useRef, useEffect, useCallback } from 'react'

loader.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.38.0/min/vs' } })
const libCache = new LocalStorageCache()

interface MonacoEditorProps {
  value?: string
  language?: 'typescript' | 'javascript' | 'json'
  theme?: 'vs-dark' | 'vs-light'
  height?: string | number
  onChange?: (value: string) => void
  readOnly?: boolean
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = '',
  language = 'typescript',
  theme = 'vs-light',
  height = '200px',
  onChange,
  readOnly,
}) => {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const setupEditor = useCallback(async (monaco: any) => {
    if (editorRef.current) {
      await AutoTypings.create(editorRef.current, {
        monaco,
        sourceCache: libCache,
        onlySpecifiedPackages: true,
        preloadPackages: true,
        fileRootPath: 'inmemory://files/',
        debounceDuration: 0,
      })

      monaco.languages.typescript.typescriptDefaults.setExtraLibs([
        {
          filePath: 'inmemory://files/zui.d.ts',
          content: `
            import '@bpinternal/zui';
            declare global {
              var z: any;
            }`,
        },
      ])
    }
  }, [])

  useEffect(() => {
    void loader.init().then((monaco) => {
      if (!editorRef.current && containerRef.current) {
        editorRef.current = monaco.editor.create(containerRef.current, {
          value: value || '',
          language,
          theme,
          automaticLayout: true,
          minimap: { enabled: false },
          glyphMargin: false,
          readOnly,
        })

        editorRef.current.onDidChangeModelContent(() => {
          const newValue = editorRef.current.getValue()
          if (onChange) {
            onChange(newValue)
          }
        })

        void setupEditor(monaco)
      }
    })
  }, [language, theme, setupEditor, onChange])

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value || '')
    }
  }, [value])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

export default MonacoEditor
