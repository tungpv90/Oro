'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users().then((r) => r.data),
  });

  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: () => adminApi.media().then((r) => r.data),
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Media deleted');
    },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Users', value: stats?.totalUsers ?? '-' },
            { label: 'Active Users', value: stats?.activeUsers ?? '-' },
            { label: 'Total Media', value: mediaData?.total ?? '-' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersLoading ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : (
                  usersData?.users?.map((user: Record<string, string | boolean>) => (
                    <tr key={user.id as string}>
                      <td className="px-6 py-4 text-sm">{user.email as string}</td>
                      <td className="px-6 py-4 text-sm">{(user.name as string) || '-'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{user.role as string}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          size="sm"
                          variant={user.isActive ? 'danger' : 'secondary'}
                          onClick={() =>
                            toggleUserMutation.mutate({
                              id: user.id as string,
                              isActive: !user.isActive,
                            })
                          }
                        >
                          {user.isActive ? 'Ban' : 'Unban'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Media Table */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">All Media</h2>
          <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mediaLoading ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : (
                  mediaData?.items?.map((media: Record<string, unknown>) => (
                    <tr key={media.id as string}>
                      <td className="px-6 py-4 text-sm truncate max-w-xs">{(media.originalFilename as string) || 'Untitled'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{media.type as string}</td>
                      <td className="px-6 py-4 text-sm">{(media.user as Record<string, string>)?.email || '-'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{media.status as string}</td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteMediaMutation.mutate(media.id as string)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
