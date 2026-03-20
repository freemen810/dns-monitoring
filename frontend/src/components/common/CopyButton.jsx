import { useState } from 'react';

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}
