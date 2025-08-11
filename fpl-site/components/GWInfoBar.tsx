import useGWDeadline from '@/public/hooks/useGWDeadline';

export default function GWInfoBar() {
  const { gwInfo, loading: gwLoading, error: gwError } = useGWDeadline();

  if (gwLoading) {
    return (
      <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
        <p>Loading Gameweek Info...</p>
      </div>
    );
  }

  if (gwError) {
    return (
      <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
        <p>{gwError}</p>
      </div>
    );
  }

  if (!gwInfo) return null;

  return (
    <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
      <p>GW{gwInfo.gwNumber} Deadline: {gwInfo.deadline} PST</p>
    </div>
  );
}
