'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { mediaApi } from '@/lib/api';

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: () => mediaApi.list().then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('File uploaded successfully');
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Media deleted');
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => mediaApi.processAnimation(id, { fps: 10 }),
    onSuccess: () => toast.success('Processing started! Check back soon.'),
    onError: () => toast.error('Processing failed'),
  });

  const onDrop = useCallback(
    (files: File[]) => {
      files.forEach((file) => uploadMutation.mutate(file));
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 100 * 1024 * 1024,
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">My Media</h1>

        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
            isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop files here...' : 'Drag & drop images or videos'}
            </p>
            <p className="mt-1 text-sm text-gray-500">or click to select files (max 100MB)</p>
          </div>
        </div>

        {uploadMutation.isPending && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Uploading...</div>
        )}

        {/* Media Grid */}
        {isLoading ? (
          <div className="mt-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.items?.map((media: Record<string, string>) => (
              <div key={media.id} className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <div className="aspect-video bg-gray-100">
                  {media.type === 'image' ? (
                    <img
                      src={media.originalUrl}
                      alt={media.originalFilename || 'Media'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video src={media.originalUrl} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {media.originalFilename || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{media.type}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => processMutation.mutate(media.id)}
                      loading={processMutation.isPending}
                    >
                      Process
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteMutation.mutate(media.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.items?.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            No media yet. Upload something to get started!
          </div>
        )}
      </main>
    </>
  );
}
