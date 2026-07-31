export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="col-span-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your dashboard</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">12,345</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">$45,678</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">New user signed up</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">Payment received</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
        </div>
        <button className="mt-4 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
          View All
        </button>
      </div>
    </div>
  );
}
