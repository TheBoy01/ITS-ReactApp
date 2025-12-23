export default function SkeletonSmallBoxes() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title */}
      <div className="w-48 h-6 bg-gray-300 rounded" />

      {/* Subtitle */}
      <div className="h-4 bg-gray-200 rounded w-72" />

      {/* ID Number */}
      <div className="space-y-1">
        <div className="w-24 h-4 bg-gray-300 rounded" />
        <div className="w-full h-10 bg-gray-200 rounded-lg" />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <div className="w-48 h-4 bg-gray-300 rounded" />
        <div className="w-full h-10 bg-gray-200 rounded-lg" />
      </div>

      {/* Submit button */}
      <div className="w-full h-10 bg-gray-300 rounded-md" />
    </div>
  );
}
