import { useState } from 'react';
import { X } from 'lucide-react';
import { imageUrl } from '../utils/assetUrl';

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

// Image picker for forms: `value` is a stored file name or a new data URI (the API saves it).
export default function ImageUploadField({ label = 'Image', value, onChange }) {
  const [fileName, setFileName] = useState('No file chosen');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <label className="flex items-center border border-gray-300 rounded overflow-hidden cursor-pointer w-full">
        <span className="bg-white border-r border-gray-300 px-3 py-2 text-xs text-gray-600 whitespace-nowrap hover:bg-gray-50 transition">Choose file</span>
        <span className="px-3 text-xs text-gray-400 flex-1 truncate">{fileName}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;
            setFileName(file.name);
            onChange(await readImageFile(file));
          }}
        />
      </label>
      {value && (
        <div className="relative inline-block mt-2">
          <img src={imageUrl(value)} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-white" />
          <button
            type="button"
            onClick={() => { onChange(''); setFileName('No file chosen'); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            title="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
