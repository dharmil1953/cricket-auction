"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import Image from "next/image";

import { CirclePlus, CircleX, Loader2 } from "lucide-react";
import useSupabase from "@/utils/hooks/useSupabase";
import useUser from "@/utils/hooks/useUser";
import { uploadImage } from "@/lib/uploadImage";
interface Props {
  onFileSelect?: (url: string) => void | undefined;
  url?: string;
}
const FileUpload: React.FC<Props> = ({ onFileSelect, url }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = useSupabase();
  const user = useUser();
  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (acceptedFiles.length) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }

      if (rejections.length) {
        setRejectedFiles(rejections);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 1024 * 1000,
    maxFiles: 1,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleRemoveFile = async () => {
    setFile(null);
    setPreviewUrl(null);
    const fileName = `${user.user?.id}/-${file?.name}`;
    const { data, error } = await supabase.storage
      .from("uploads")
      .remove([`${fileName}`]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const { error, url } = await uploadImage(file as File);
      onFileSelect?.(url as string);
      if (error) {
        handleRemoveFile();
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative ">
      <div
        {...getRootProps()}
        className="border border-dashed rounded pt-2 flex flex-col items-center justify-center cursor-pointer w-[40%]"
      >
        {url ? (
          <>
            <Image src={url} alt="image" width={40} height={40} />
          </>
        ) : (
          <>
            <input {...getInputProps()} />

            {isUploading ? (
              <Loader2 className="animate-spin" />
            ) : previewUrl ? (
              <div className="relative w-40 h-40">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md shadow-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <CircleX />
                </button>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center">
                <div className="w-fit">
                  <CirclePlus />
                </div>
                <div className="mt-2 text-gray-500">
                  {isDragActive
                    ? "Drop the files here..."
                    : "Drag & drop or click to select files"}
                </div>
              </div>
            )}
            {file && !isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                className="w-full"
              >
                Upload
              </button>
            )}
          </>
        )}
      </div>
      {rejectedFiles.length > 0 && (
        <div className="mt-4 text-red-500">
          <p>Rejected files:</p>
          <ul>
            {rejectedFiles?.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}
                <ul>
                  {errors?.map((error:any) => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
