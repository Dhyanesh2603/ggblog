import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Code,
  Undo,
  Redo
} from 'lucide-react';

interface TipTapEditorProps {
  initialContent: string;
  onUpdate: (html: string, plainText: string, words: number, chars: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  initialContent,
  onUpdate,
  placeholder = 'Begin your prose here. Let the silence of the page guide your sentences...',
  className = '',
  autoFocus = false
}) => {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      CharacterCount
    ],
    content: initialContent || '',
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: `prose prose-stone max-w-none focus:outline-none min-h-[360px] font-editorial-body text-xl sm:text-[22px] leading-[1.8] text-[var(--text)] selection:bg-[var(--text)] selection:text-[var(--bg)] ${className}`
      }
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      const html = editor.getHTML();
      const text = editor.getText();
      const words = editor.storage.characterCount.words();
      const chars = editor.storage.characterCount.characters();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onUpdate(html, text, words, chars);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }, 500);
    }
  });

  // Keep editor content in sync when switching chapters/scenes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || '', { emitUpdate: false });
    }
  }, [initialContent, editor]);

  if (!editor) {
    return (
      <div className="min-h-[300px] flex items-center justify-center font-mono-meta text-xs text-[var(--text-faint)]">
        Initializing editorial typesetter...
      </div>
    );
  }

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();
  const readingTimeMin = Math.max(1, Math.round(words / 225));

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Sticky Minimal Editorial Toolbar */}
      <div className="sticky top-0 z-20 bg-[var(--bg)]/95 backdrop-blur-[2px] border-b border-[var(--border)] py-1.5 px-1 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Formatting Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Heading 3"
          >
            <Heading3 size={15} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1 opacity-50" />

          {/* Bold, Italic, Strikethrough, Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('bold')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('italic')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('strike')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('code')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Inline Code"
          >
            <Code size={15} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1 opacity-50" />

          {/* Blockquote / Epigraph */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Blockquote / Epigraph"
          >
            <Quote size={15} />
          </button>

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-[2px] transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)]'
            }`}
            title="Ordered List"
          >
            <ListOrdered size={15} />
          </button>

          {/* Divider */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-[2px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--paper-tint)] transition-colors"
            title="Section Break / Asterism (※)"
          >
            <Minus size={15} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--border)] mx-1 opacity-50" />

          {/* Undo / Redo */}
          <button
            type="button"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded-[2px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          <button
            type="button"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded-[2px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>
        </div>

        {/* Live Autosave & Indicator */}
        <div className="flex items-center gap-3 font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                saveStatus === 'saving' ? 'bg-amber-600 animate-ping' : 'bg-emerald-600'
              }`}
            />
            <span>{saveStatus === 'saving' ? 'SAVING...' : `SAVED (${lastSavedTime})`}</span>
          </span>
        </div>
      </div>

      {/* Editor Prose Canvas */}
      <div className="p-4 sm:p-8 bg-[var(--paper-tint)]/30 border border-[var(--border)] min-h-[460px] cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Live Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between text-left font-mono-meta text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] pt-2 px-1 border-t border-[var(--border-faint)]">
        <div className="flex items-center gap-4">
          <span>{words.toLocaleString()} WORDS</span>
          <span>·</span>
          <span>{chars.toLocaleString()} CHARACTERS</span>
          <span>·</span>
          <span>~{readingTimeMin} MIN READ (225 WPM)</span>
        </div>
        <div className="text-[var(--text-faint)]">
          TIP: PRESS <kbd className="border border-[var(--border)] px-1 py-0.5 text-[9px]">F</kbd> FOR DISTRACTION-FREE ZEN MODE
        </div>
      </div>
    </div>
  );
};
