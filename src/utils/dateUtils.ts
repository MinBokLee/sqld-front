/**
 * 날짜를 "방금 전", "N분 전", "N시간 전", "N일 전" 또는 "YYYY.MM.DD" 형식으로 변환합니다.
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // 미래 시간인 경우 (서버-클라이언트 시간차 등)
  if (diffInSeconds < 0) return '방금 전';

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (minutes < 1) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else {
    // 7일 이상인 경우 날짜로 표시
    return past.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  }
};
