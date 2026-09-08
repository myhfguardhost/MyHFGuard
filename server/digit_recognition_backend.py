"""Command-line adapter for the local BP scanner."""
import sys,json,base64
import cv2
from local_bp import recognize

def process_image(path):
    image=cv2.imread(path)
    if image is None:return {'error':'Could not open image.'}
    candidates,preview=recognize(image)
    if not candidates:return {'error':'No complete BP reading detected. Please retake a clear photo of the complete display.'}
    if len(candidates)>1 and len(candidates[0][1])<=len(candidates[1][1]):
        return {'error':'Conflicting digit readings. Please retake the photo.'}
    values,observations=candidates[0]
    rows=observations[0]
    for label,(_,boxes) in zip(('SYS','DIA','Pulse'),rows):
        x=min(b[0] for b in boxes); y=min(b[1] for b in boxes)
        right=max(b[0]+b[2] for b in boxes); bottom=max(b[1]+b[3] for b in boxes)
        cv2.rectangle(preview,(x-3,y-3),(right+3,bottom+3),(0,0,220),2)
        cv2.putText(preview,label,(x,max(15,y-8)),cv2.FONT_HERSHEY_SIMPLEX,.5,(0,0,220),1)
    encoded=cv2.imencode('.jpg',preview)[1]
    return dict(zip(('sys','dia','pulse'),map(str,values)),annotatedImage=base64.b64encode(encoded).decode(),method='local-segment-v2')

if __name__=='__main__':
    try: result=process_image(sys.argv[1]) if len(sys.argv)==2 else {'error':'One image path is required.'}
    except Exception as error:
        print(type(error).__name__+': '+str(error),file=sys.stderr)
        result={'error':'Image processing failed. Please retake the photo.'}
    print(json.dumps(result))
