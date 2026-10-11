"""Pretvara Sketchfab GLB (spec-gloss, pečeno osvetljenje) u laganu "unlit" GLB varijantu za web.
Pečene teksture (emissive) već sadrže svetlo, pa se renderuje bez svetala i senki.
Upotreba: python -I tools/build_model.py <ulaz.glb> <izlaz.glb> <max_tekstura_structure> <max_ostale> [jpeg_q]
"""
import sys, json, struct, io
import numpy as np
from PIL import Image

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def load(p):
    d = open(p, 'rb').read()
    off = 12; js = bn = None
    while off < len(d):
        cl, ct = struct.unpack('<II', d[off:off + 8]); c = d[off + 8:off + 8 + cl]; off += 8 + cl
        if ct == 0x4E4F534A: js = json.loads(c)
        elif ct == 0x004E4942: bn = c
    return js, bn

def read_acc(j, b, ai):
    a = j['accessors'][ai]; bv = j['bufferViews'][a['bufferView']]
    n = NC[a['type']]; dt = np.dtype(CT[a['componentType']]); es = dt.itemsize * n
    stride = bv.get('byteStride', es); base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    raw = np.frombuffer(b, dtype=np.uint8, count=stride * (a['count'] - 1) + es, offset=base)
    out = np.lib.stride_tricks.as_strided(raw, shape=(a['count'], es), strides=(stride, 1)).copy()
    return out.view(dt).reshape(a['count'], n)

def main(src, dst, smax, omax, q=82):
    j, b = load(src)
    # materijal -> (indeks slike, uv skup, faktor)
    mats = j['materials']
    out_imgs = []; img_map = {}
    chunks = bytearray()
    views = []
    def add_view(data, target=None):
        while len(chunks) % 4: chunks.append(0)
        views.append({'buffer': 0, 'byteOffset': len(chunks), 'byteLength': len(data), **({'target': target} if target else {})})
        chunks.extend(data)
        return len(views) - 1

    new_mats = []; new_tex = []; uvset = {}
    for mi, m in enumerate(mats):
        sg = m['extensions']['KHR_materials_pbrSpecularGlossiness']
        et = m.get('emissiveTexture'); dt = sg.get('diffuseTexture')
        tex = et['index'] if et else dt['index']
        uv = et.get('texCoord', 0) if et else 0
        src_img = j['textures'][tex]['source']
        isstruct = (src_img == 0)
        lim = smax if isstruct else omax
        key = (src_img, lim)
        if key not in img_map:
            bv = j['bufferViews'][j['images'][src_img]['bufferView']]
            im = Image.open(io.BytesIO(b[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB')
            if im.size[0] > lim: im = im.resize((lim, lim), Image.LANCZOS)
            buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
            vi = add_view(buf.getvalue())
            out_imgs.append({'bufferView': vi, 'mimeType': 'image/jpeg'})
            new_tex.append({'sampler': 0, 'source': len(out_imgs) - 1})
            img_map[key] = len(new_tex) - 1
        ti = img_map[key]
        fac = m.get('emissiveFactor', [1, 1, 1])[0]
        mm = {'name': m['name'], 'doubleSided': m.get('doubleSided', False),
              'pbrMetallicRoughness': {'baseColorTexture': {'index': ti}, 'baseColorFactor': [fac, fac, fac, 1], 'metallicFactor': 0, 'roughnessFactor': 1},
              'extensions': {'KHR_materials_unlit': {}}}
        if m.get('alphaMode') == 'BLEND':
            mm['alphaMode'] = 'BLEND'
            mm['pbrMetallicRoughness']['baseColorFactor'][3] = 0.0
        new_mats.append(mm); uvset[mi] = (int(__import__('os').environ['SUV']) if (mi==0 and 'SUV' in __import__('os').environ) else uv)

    # geometrija: samo POSITION + izabrani UV
    new_meshes = []; accs = []
    def add_acc(arr, ctype, typ, target, minmax=False):
        vi = add_view(arr.tobytes(), target)
        a = {'bufferView': vi, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
        if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        accs.append(a); return len(accs) - 1
    for mesh in j['meshes']:
        prims = []
        for pr in mesh['primitives']:
            pos = read_acc(j, b, pr['attributes']['POSITION']).astype(np.float32)
            uv = read_acc(j, b, pr['attributes']['TEXCOORD_%d' % uvset[pr['material']]]).astype(np.float32)
            idx = read_acc(j, b, pr['indices']).reshape(-1)
            idx32 = idx.astype(np.uint32)
            if mesh.get('name') == 'Modern Bathroom_Structure_0':
                # tanka pregrada tuša (x ≈ −0,44) je u izvornom modelu crna ploča koja zaklanja pogled; staklo je zasebni mesh → izbacujemo pregradu
                M = np.eye(4)
                for nn in (0, 1, 3): M = M @ np.array(j['nodes'][nn]['matrix']).reshape(4, 4).T
                W = (np.c_[pos, np.ones(len(pos))] @ M.T)[:, :3]
                tri = idx32.reshape(-1, 3)
                keep = ~np.all((W[tri][:, :, 0] > -0.475) & (W[tri][:, :, 0] < -0.405) & (W[tri][:, :, 2] > 1.9), axis=1)
                print('Structure: removed partition tris', int((~keep).sum()))
                idx32 = tri[keep].reshape(-1)
            # ukloni duplirane temene (isti pos+uv)
            key = np.concatenate([pos, uv], 1)
            uniq, inv = np.unique(key, axis=0, return_inverse=True)
            inv = inv.reshape(-1)
            pos2 = uniq[:, :3].copy(); uv2 = uniq[:, 3:].copy(); idx2 = inv[idx32]
            it = np.uint16 if len(pos2) < 65535 else np.uint32
            prims.append({'attributes': {'POSITION': add_acc(pos2, 5126, 'VEC3', 34962, True), 'TEXCOORD_0': add_acc(uv2, 5126, 'VEC2', 34962)},
                          'indices': add_acc(idx2.astype(it), 5123 if it == np.uint16 else 5125, 'SCALAR', 34963),
                          'material': pr['material']})
        new_meshes.append({'name': mesh.get('name'), 'primitives': prims})

    # Window ravan se izbacuje (spoljni prozor), ostalo ostaje
    nodes = json.loads(json.dumps(j['nodes']))
    nj = {'asset': j['asset'], 'scene': 0, 'scenes': j['scenes'], 'nodes': nodes, 'meshes': new_meshes,
          'materials': new_mats, 'textures': new_tex, 'images': out_imgs,
          'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}],
          'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(chunks)}],
          'extensionsUsed': ['KHR_materials_unlit']}
    js = json.dumps(nj, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(chunks) % 4: chunks.append(0)
    total = 12 + 8 + len(js) + 8 + len(chunks)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(chunks), 0x004E4942)); f.write(bytes(chunks))
    tris = sum(a['count'] for pm in new_meshes for pr in pm['primitives'] for a in [accs[pr['indices']]]) // 3
    print(dst, round(total / 1e6, 2), 'MB', 'tris', tris, 'verts', sum(accs[pr['attributes']['POSITION']]['count'] for pm in new_meshes for pr in pm['primitives']), 'tex', len(new_tex))

if __name__ == '__main__':
    a = sys.argv
    main(a[1], a[2], int(a[3]), int(a[4]), int(a[5]) if len(a) > 5 else 82)
