export default function SkeletonLargeBoxes() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="w-64 bg-gray-300 rounded h-7" />
      <div className="h-4 bg-gray-200 rounded w-96" />

      {/* Tabs */}
      <div className="flex justify-center gap-6 mt-6">
        <div className="w-32 h-8 bg-gray-300 rounded" />
        <div className="w-32 h-8 bg-gray-200 rounded" />
      </div>

      {/* Form Card */}
      <div className="max-w-3xl p-6 mx-auto space-y-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded md:col-span-2" />
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <div className="w-full h-10 bg-gray-300 rounded" />
        <div className="w-full h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
