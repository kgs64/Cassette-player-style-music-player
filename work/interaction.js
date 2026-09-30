// Pure hit and detent math shared by pointer handling and domain checks.
export function selectorIndex(pointer,a,b,count){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(length<1)return 0;const t=((pointer.x-a.x)*dx+(pointer.y-a.y)*dy)/length;return Math.round(Math.max(0,Math.min(1,t))*(count-1));}
export function insideTapeZone(point,bounds,wasInside=false){const margin=wasInside?1.24:1;const rx=Math.max(28,(bounds.maxX-bounds.minX)/2)*margin,ry=Math.max(30,(bounds.maxY-bounds.minY)/2)*margin;return ((point.x-(bounds.minX+bounds.maxX)/2)/rx)**2+((point.y-(bounds.minY+bounds.maxY)/2)/ry)**2<=1;}
export function rotatePaperOrder(order){if(order.length<2)return [...order];return [order[1],...order.slice(2),order[0]];}
export const PAPER_STEP=.042, PAPER_THICKNESS=.024, TABLE_TOP=.17;
