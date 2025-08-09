import { useEffect, useState } from 'react';

const useGWDeadline = () => {
  const [gwInfo, setGwInfo] = useState<{ gwNumber: number; deadline: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGWInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/gwinfo');  // Fetch data from your backend
        const data = await res.json();

        if (data?.gwNumber && data?.deadline) {
          setGwInfo({
            gwNumber: data.gwNumber,
            deadline: data.deadline,
          });
        } else {
          setError('Current gameweek information is not available.');
        }
      } catch (error) {
        console.error('Failed to fetch gameweek info:', error);
        setError('Failed to fetch Gameweek info. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGWInfo();
  }, []);

  return { gwInfo, loading, error };
};

export default useGWDeadline;
