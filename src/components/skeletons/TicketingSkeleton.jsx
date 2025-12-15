import SkeletonBox from "./SkeletonBox";

export default function TicketingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="h-[10vh] bg-gray-300 animate-pulse" />

      {/* CONTENT */}
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-xl p-6 space-y-6 bg-white shadow rounded-xl">
          {/* Title */}
          <SkeletonBox className="w-2/3 h-6" />

          {/* Subtitle */}
          <SkeletonBox className="w-full h-4" />
          <SkeletonBox className="w-5/6 h-4" />

          {/* Inputs */}
          <SkeletonBox className="w-full h-10 mt-4" />
          <SkeletonBox className="w-full h-10" />
          <SkeletonBox className="w-full h-24" />

          {/* Button */}
          <SkeletonBox className="w-full h-10 mt-4" />
        </div>
      </div>
    </div>
  );
}
