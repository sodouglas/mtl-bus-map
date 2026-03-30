export function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 3) return points;

  // Find the lowest point (max lat = most south in screen coords, but we use min lat for geographic)
  let lowest = 0;
  for (let i = 1; i < points.length; i++) {
    if (
      points[i][0] < points[lowest][0] ||
      (points[i][0] === points[lowest][0] && points[i][1] < points[lowest][1])
    ) {
      lowest = i;
    }
  }

  const pivot = points[lowest];
  const sorted = points
    .filter((_, i) => i !== lowest)
    .sort((a, b) => {
      const angleA = Math.atan2(a[0] - pivot[0], a[1] - pivot[1]);
      const angleB = Math.atan2(b[0] - pivot[0], b[1] - pivot[1]);
      if (angleA !== angleB) return angleA - angleB;
      const distA = (a[0] - pivot[0]) ** 2 + (a[1] - pivot[1]) ** 2;
      const distB = (b[0] - pivot[0]) ** 2 + (b[1] - pivot[1]) ** 2;
      return distA - distB;
    });

  const stack: [number, number][] = [pivot];

  for (const point of sorted) {
    while (stack.length > 1) {
      const a = stack[stack.length - 2];
      const b = stack[stack.length - 1];
      const cross = (b[1] - a[1]) * (point[0] - b[0]) - (b[0] - a[0]) * (point[1] - b[1]);
      if (cross > 0) break;
      stack.pop();
    }
    stack.push(point);
  }

  return stack;
}
