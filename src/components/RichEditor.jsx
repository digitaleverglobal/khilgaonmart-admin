import { useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';

export default function RichEditor({ label, required, value, onChange, placeholder }) {
  const editor = useRef(null);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: placeholder || 'Enter Your Text Here',
    toolbarAdaptive: false,
    toolbarSticky: false,
    showWordsCounter: false,
    showCharsCounter: false,
    showXPathInStatusbar: false,
    height: 200,
    buttons: [
      'undo', 'redo', '|',
      'bold', 'underline', 'strikethrough', '|',
      'font', 'fontsize', 'brush', '|',
      'ul', 'ol', 'indent', 'outdent', '|',
      'align', '|',
      'table', 'link', 'image', 'video', '|',
      'fullsize', 'source', '|',
      'hr', 'eraser', 'copyformat',
    ],
    uploader: { insertImageAsBase64URI: true },
    style: { fontFamily: 'sans-serif', fontSize: '14px' },
  }), [placeholder]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}{required && ' *'}
        </label>
      )}
      <JoditEditor
        ref={editor}
        value={value || ''}
        config={config}
        onBlur={newContent => onChange && onChange(newContent)}
      />
    </div>
  );
}
