// Keep the occupied front and left edges fixed; trim only the unused right/rear margins.
export function compactPlinth(base){
 if(base.userData.compactLayout)return base.userData.compactLayout;
 const old=base.geometry;old.computeBoundingBox();
 const bounds=old.boundingBox,width=bounds.max.x-bounds.min.x,depth=bounds.max.z-bounds.min.z;
 const trimRight=.9,trimRear=2.6;
 base.geometry=new old.constructor(width-trimRight,.5,depth-trimRear,2,.15);
 base.position.x-=trimRight/2;base.position.z+=trimRear/2;old.dispose();
 base.geometry.computeBoundingBox();
 return base.userData.compactLayout={width:width-trimRight,depth:depth-trimRear,trimRight,trimRear,halfWidth:(width-trimRight)/2,halfDepth:(depth-trimRear)/2};
}
