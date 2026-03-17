import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import type { Extension } from '@codemirror/state'
import type { CodeBlockItem } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import styles from './CodeBlockItem.module.css'

const LANGUAGES: { value: string; label: string; ext: () => Extension }[] = [
  { value: 'javascript', label: 'JS',   ext: () => javascript({ jsx: true, typescript: false }) },
  { value: 'typescript', label: 'TS',   ext: () => javascript({ jsx: true, typescript: true }) },
  { value: 'python',     label: 'PY',   ext: python },
  { value: 'css',        label: 'CSS',  ext: css },
  { value: 'html',       label: 'HTML', ext: html },
  { value: 'java',       label: 'JAVA', ext: java },
  { value: 'csharp',     label: 'C#',   ext: () => javascript() },
  { value: 'sql',        label: 'SQL',  ext: () => javascript() },
]

interface Props {
  item: CodeBlockItem
}

export function CodeBlockItemComp({ item }: Props) {
  const updateItem = useBoardStore((s) => s.updateItem)

  const handleChange = useCallback(
    (value: string) => {
      updateItem(item.id, { code: value } as Partial<CodeBlockItem>)
    },
    [item.id, updateItem],
  )

  const langConfig = LANGUAGES.find((l) => l.value === item.language) ?? LANGUAGES[0]!

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <span className={styles.langLabel}>{langConfig.label}</span>
      </div>
      <div
        className={styles.editorWrap}
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <CodeMirror
          value={item.code}
          theme={oneDark}
          extensions={[langConfig.ext()]}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            autocompletion: false,
          }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          }}
        />
      </div>
    </div>
  )
}
