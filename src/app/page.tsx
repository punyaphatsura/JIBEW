'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [lastClicked, setLastClicked] = useState(-1);
  const [jsonData, setJsonData] = useState<
    | {
        [fileName: string]: string; // The key is the file name and value is the combined header + base64
      }[]
    | null
  >(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const convertToBase64Images = async () => {
    const base64Images = await Promise.all(
      files.map(async (file) => {
        const base64String = await convertToBase64(file);
        const header = `data:${file.type};base64,`;
        return {
          [file.name]: header + base64String.split(',')[1], // Remove redundant header in base64 string
        };
      })
    );
    setJsonData(base64Images);
  };

  const downloadJson = () => {
    if (!jsonData) return;

    const jsonBlob = new Blob(
      [JSON.stringify(Object.assign({}, ...jsonData), null, 2)],
      {
        type: 'application/json',
      }
    );
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'images.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      console.log(content);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Upload and Convert Images to Base64
      </h1>
      <div
        {...getRootProps()}
        className={`w-full max-w-lg p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-100'
            : 'border-gray-300 bg-white'
        }`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-blue-500">Drop the files here ...</p>
        ) : (
          <p className="text-center text-gray-500">
            Drag & drop files here, or click to select files
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md mt-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Selected Files
          </h2>
          <ul className="mb-4">
            {files.map((file, index) => (
              <li key={index} className="text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
          <button
            onClick={convertToBase64Images}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Convert & Download JSON
          </button>
        </div>
      )}

      {jsonData && <div className="border"></div>}

      {jsonData && (
        <div className="w-full max-w-lg bg-white p-4 mt-6 rounded-lg shadow-md">
          <div className="mb-6 flex justify-end">
            <button
              onClick={downloadJson}
              className="w-full max-w-[100px] bg-slate-300 py-2 rounded-lg text-slate-600 hover:bg-slate-400 transition-colors mt-4">
              Download JSON
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Converted Data (Preview)
          </h2>
          {jsonData.map((data, index) => {
            const fileName = Object.keys(data)[0];
            const base64Content = Object.values(data)[0];
            return (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-800">{fileName}</span>
                  <button
                    onClick={() => {
                      handleCopy(base64Content);
                      setLastClicked(index);
                    }}
                    className={`text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors ${
                      lastClicked === index ? 'bg-blue-400' : 'bg-green-500'
                    }`}>
                    {lastClicked === index ? 'Copied' : 'Copy Content'}
                  </button>
                </div>
                <pre className="bg-gray-100 p-2 rounded-lg text-black text-sm overflow-auto max-h-32">
                  {base64Content}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
