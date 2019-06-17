export const TestTimer = {
  startTime,
  formattedDiff
};

function startTime(): [number, number] {
  return process.hrtime();
}

function formattedDiff(startTime: [number, number]): string {
  const diffTime = process.hrtime(startTime);
  return `${diffTime[0]}s ${diffTime[1] / 1000000}ms`;
}
