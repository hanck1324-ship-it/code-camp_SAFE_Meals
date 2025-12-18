// src/hooks/useHaccp.ts
import { useState, useEffect } from 'react';

export function useHaccp() {
  const [haccpList, setHaccpList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API 호출 (아까 만든 /api/combined 활용)
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/combined');
        
        if (!res.ok) {
          throw new Error(`API 호출 실패: ${res.status}`);
        }
        
        const data = await res.json();
        
        // 에러 응답 체크
        if (data.error) {
          setError(data.error);
          setHaccpList([]);
          console.warn("HACCP API 에러:", data.error);
        } else {
          // combined API는 { haccp: [...], recipes: [...] } 형태로 반환
          const haccpData = data.haccp || [];
          setHaccpList(haccpData);
          console.log("HACCP 데이터 로드 성공:", haccpData.length, "개");
        }
      } catch (error: any) {
        console.error("HACCP 데이터 로딩 실패:", error);
        setError(error.message || "데이터를 불러오는데 실패했습니다.");
        setHaccpList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { haccpList, loading, error };
}