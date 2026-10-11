import sys
from PIL import Image, ImageDraw
names=sys.argv[2:]
cols=3; w,h=520,390
rows=(len(names)+cols-1)//cols
s=Image.new('RGB',(cols*w,rows*h),(30,30,30))
for i,n in enumerate(names):
    try: im=Image.open(f'D:/CLAUDE/bathroom/assets/img/{n}.jpg').convert('RGB').resize((w,h))
    except Exception as e: continue
    ImageDraw.Draw(im).text((8,8),n,fill=(255,255,0))
    s.paste(im,((i%cols)*w,(i//cols)*h))
s.save(sys.argv[1],quality=82)
