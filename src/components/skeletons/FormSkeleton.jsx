import SkeletonBox from "./SkeletonBox";

export default function FormSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBox className="w-1/4 h-4" />
      <SkeletonBox className="w-full h-10" />
      <SkeletonBox className="w-full h-10" />
      <SkeletonBox className="w-full h-24" />
    </div>
  );
}
