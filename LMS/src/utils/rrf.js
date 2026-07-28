export function combineResultsRRF(mysqlResults, vectorCourseIds, k = 60) {
  const scoreMap = new Map();

  // 1. Chấm điểm kết quả từ MySQL
  mysqlResults.forEach((item, index) => {
    const rank = index + 1;
    scoreMap.set(item.id, {
      data: item,
      score: 1 / (k + rank)
    });
  });

  // 2. Chấm điểm kết quả từ Vector Search
  vectorCourseIds.forEach((id, index) => {
    const rank = index + 1;
    const rrfScore = 1 / (k + rank);

    if (scoreMap.has(id)) {
      scoreMap.get(id).score += rrfScore; // Trùng cả 2 bên -> Cộng điểm ưu tiên
    }
  });

  // 3. Sắp xếp danh sách theo điểm từ cao xuống thấp
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.data);
}