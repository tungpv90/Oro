'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/navbar';
import { feedApi } from '@/lib/api';

const FEED_TABS = [
  { key: 'latest', label: 'Latest' },
  { key: 'hot', label: '🔥 Hot' },
  { key: 'recommended', label: '⭐ Recommended' },
  { key: 'free', label: '🆓 Free' },
  { key: 'best_selling', label: '💰 Best Selling' },
];

export default function ExplorePage() {
  const [activeFeed, setActiveFeed] = useState('latest');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['feed', activeFeed, typeFilter],
    queryFn: () => feedApi.list({ feed: activeFeed, type: typeFilter, limit: 40 }).then((r) => r.data),
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
        <p className="mt-1 text-sm text-gray-500">Discover public images & videos from the community</p>

        {/* Feed tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFeed(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFeed === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${!typeFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('image')}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${typeFilter === 'image' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Images
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${typeFilter === 'video' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Videos
          </button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="mt-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-6 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data?.items?.map((media: Record<string, unknown>) => (
              <div
                key={media.id as string}
                className="group flex flex-col items-center"
              >
                <div className="relative">
                  <div className={`h-28 w-28 rounded-full overflow-hidden shadow-md transition-all ${
                    Number(media.price) > 0 ? 'ring-2 ring-yellow-400' : 'ring-2 ring-green-400'
                  } hover:ring-4`}>
                    {media.type === 'image' ? (
                      <img
                        src={media.originalUrl as string}
                        alt={(media.title as string) || 'Media'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative h-full w-full">
                        <video src={media.originalUrl as string} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="h-8 w-8 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Price badge */}
                  <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    Number(media.price) > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {Number(media.price) > 0 ? `$${Number(media.price).toFixed(2)}` : 'FREE'}
                  </span>
                  {media.isFeatured && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ⭐
                    </span>
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-gray-900 max-w-[8rem] text-center">
                  {(media.title as string) || (media.originalFilename as string) || 'Untitled'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>👁 {media.viewCount as number}</span>
                  {Number(media.purchaseCount) > 0 && <span>🛒 {media.purchaseCount as number}</span>}
                </div>
                {(media.user as Record<string, unknown>)?.name && (
                  <p className="text-[10px] text-gray-400">
                    by {(media.user as Record<string, unknown>).name as string}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {data?.items?.length === 0 && !isLoading && (
          <div className="mt-8 text-center text-gray-500">
            No public media found for this filter.
          </div>
        )}
      </main>
    </>
  );
}
