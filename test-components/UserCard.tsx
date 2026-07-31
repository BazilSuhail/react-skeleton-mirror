'use client';

import { Badge } from './Badge';

interface UserCardProps {
  user: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <img
        src={user.avatar}
        alt={user.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
        <p className="text-sm text-gray-500">{user.role}</p>
        <p className="text-sm text-gray-700">{user.bio}</p>
      </div>
      <div className="ml-auto">
        <Badge text="Active" />
        <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg">
          Follow
        </button>
      </div>
    </div>
  );
}
