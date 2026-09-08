"""Local LCD digit OCR. No remote image service is used."""
import cv2
import numpy as np
from collections import defaultdict

PATTERNS = ['1110111','0010010','1011101','1011011','0111010','1101011','1101111','1010010','1111111','1111011']

def read_digit(mask, box):
    x,y,w,h=box
    a=mask[y:y+h,x:x+w]
    if w/h<.30:
        return '1', .9
    a=cv2.resize(a,(60,100),interpolation=cv2.INTER_AREA)/255.
    # Sample segment centres, excluding corner junctions.
    regions=[(15,0,45,17),(0,18,20,44),(40,18,60,44),(15,43,45,57),(0,57,20,83),(40,57,60,83),(15,83,45,100)]
    strengths=np.array([a[t:b,l:r].mean() for l,t,r,b in regions])
    strengths=np.clip(strengths/.70,0,1)
    costs=[]
    for digit,pattern in enumerate(PATTERNS):
        bits=np.array([int(v) for v in pattern])
        costs.append((float(np.mean((strengths-bits)**2)),str(digit)))
    costs.sort()
    if costs[0][0]>.22 or costs[1][0]-costs[0][0]<.015:return None,0
    return costs[0][1],1-costs[0][0]

def recognize(image):
    scale=1000/image.shape[0]
    image=cv2.resize(image,None,fx=scale,fy=scale)
    gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
    votes=defaultdict(list)
    detected=[]
    for kernel in (21,31,41,61,81,101):
      bg=cv2.morphologyEx(gray,cv2.MORPH_CLOSE,np.ones((kernel,kernel),np.uint8))
      contrast=cv2.subtract(bg,gray)
      for threshold in (5,8,12,20,30,45,65):
       binary=cv2.threshold(contrast,threshold,255,cv2.THRESH_BINARY)[1]
       for join in (3,5,9,13):
        mask=cv2.morphologyEx(binary,cv2.MORPH_CLOSE,np.ones((join,3),np.uint8))
        boxes=[]
        for c in cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)[0]:
          x,y,w,h=cv2.boundingRect(c)
          if not (25<h<image.shape[0]*.22 and .08<w/h<.95):continue
          d,score=read_digit(mask,(x,y,w,h))
          if d is not None:
            boxes.append((x,y,w,h,d,score)); detected.append((x,y,w,h,d,score))
        boxes.sort(key=lambda b:b[1])
        rows=[]
        for b in boxes:
          matched=False
          for row in rows:
            a=row[0]
            if abs((a[1]+a[3]/2)-(b[1]+b[3]/2))<min(a[3],b[3])*.25 and .7<a[3]/b[3]<1.4:
              row.append(b);matched=True;break
          if not matched:rows.append([b])
        lines=[]
        for row in rows:
          row.sort()
          if len(row) not in (2,3):continue
          if any(row[i+1][0]-(row[i][0]+row[i][2])>row[i][3]*.65 for i in range(len(row)-1)):continue
          value=''.join(b[4] for b in row)
          lines.append((value,row))
        for i in range(len(lines)-2):
          trio=lines[i:i+3]; vals=tuple(int(t[0]) for t in trio)
          if not (40<=vals[0]<=260 and 25<=vals[1]<=160 and 30<=vals[2]<=240 and vals[0]>vals[1]):continue
          rights=[max(b[0]+b[2] for b in row) for _,row in trio]
          heights=[max(b[3] for b in row) for _,row in trio]
          if max(rights)-min(rights)>max(heights)*.4:continue
          if any(trio[k+1][1][0][1]-trio[k][1][0][1]>heights[k]*2 for k in (0,1)):continue
          votes[vals].append(trio)
    clusters=[]
    for b in detected:
      for cluster in clusters:
        a=cluster[0]
        if abs(a[0]-b[0])<8 and abs(a[1]-b[1])<8 and abs(a[2]-b[2])<12 and abs(a[3]-b[3])<12:
          cluster.append(b);break
      else: clusters.append([b])
    reliable=[]
    for cluster in clusters:
      counts=defaultdict(list)
      for b in cluster: counts[b[4]].append(b)
      ranked=sorted(counts.values(),key=len,reverse=True)
      if len(ranked[0])>=3 and (len(ranked)==1 or len(ranked[0])>=len(ranked[1])*1.5): reliable.append(ranked[0][0])
    reliable.sort(key=lambda b:b[1])
    rows=[]
    for b in reliable:
      for row in rows:
        a=row[0]
        if abs(a[1]+a[3]/2-b[1]-b[3]/2)<min(a[3],b[3])*.3 and .65<a[3]/b[3]<1.5:
          row.append(b);break
      else: rows.append([b])
    lines=[]
    for row in rows:
      row.sort(key=lambda b:b[5],reverse=True)
      kept=[]
      for b in row:
        if any(min(b[0]+b[2],a[0]+a[2])-max(b[0],a[0])>min(b[2],a[2])*.5 for a in kept):continue
        kept.append(b)
      kept.sort()
      for n in (2,3):
       for start in range(len(kept)-n+1):
        sub=kept[start:start+n]
        if any(sub[i+1][0]-sub[i][0]-sub[i][2]>sub[i][3]*.65 for i in range(n-1)):continue
        lines.append((''.join(b[4] for b in sub),sub))
    for a in lines:
     for b in lines:
      for c in lines:
       trio=[a,b,c]; vals=tuple(int(t[0]) for t in trio)
       if not (40<=vals[0]<=260 and 25<=vals[1]<=160 and 30<=vals[2]<=240 and vals[0]>vals[1]):continue
       heights=[max(z[3] for z in row) for _,row in trio]
       rights=[max(z[0]+z[2] for z in row) for _,row in trio]
       if max(rights)-min(rights)>max(heights)*.3:continue
       if any(not heights[k]*.8<trio[k+1][1][0][1]-trio[k][1][0][1]<heights[k]*1.8 for k in (0,1)):continue
       votes[vals].append(trio)
    return sorted(votes.items(),key=lambda item:len(item[1]),reverse=True), image
