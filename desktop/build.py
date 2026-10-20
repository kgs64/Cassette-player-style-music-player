from pathlib import Path
import hashlib,plistlib,shutil,subprocess
root=Path(__file__).resolve().parent
version='44.9.0';archive=root/'runtime'/f'electron-v{version}-darwin-arm64.zip'
checks=(root/'runtime/SHASUMS256.txt').read_text().splitlines()
expected=next(line.split()[0] for line in checks if line.split()[-1].lstrip('*')==archive.name)
if hashlib.sha256(archive.read_bytes()).hexdigest()!=expected:raise SystemExit('Electron checksum mismatch')
delivery=root/'dist';delivery.mkdir(exist_ok=True)
dist=Path('/private/tmp/cassette-world-desktop-build');dist.mkdir(exist_ok=True)
app=dist/'Cassette World.app'
if app.exists():shutil.rmtree(app)
staging=root/'runtime/extracted'
if not (staging/'Electron.app').exists():
 staging.mkdir(exist_ok=True);subprocess.run(['ditto','-x','-k',str(archive),str(staging)],check=True)
subprocess.run(['ditto',str(staging/'Electron.app'),str(app)],check=True)
resources=app/'Contents/Resources';target=resources/'app';target.mkdir(exist_ok=True)
for name in ['main.cjs','package.json']:shutil.copy2(root/name,target/name)
web=target/'web';web.mkdir(exist_ok=True)
outputs=root.parent/'outputs'
for name in ['index.html','THIRD_PARTY_NOTICES.md','使用说明.md']:shutil.copy2(outputs/name,web/name)
for name in ['icons','third-party']:shutil.copytree(outputs/name,web/name,dirs_exist_ok=True)
for name in ['LICENSE','LICENSES.chromium.html']:
 if (staging/name).exists():shutil.copy2(staging/name,resources/name)
plist=app/'Contents/Info.plist';data=plistlib.loads(plist.read_bytes());data.update(CFBundleName='Cassette World',CFBundleDisplayName='Cassette World',CFBundleIdentifier='com.kgs64.cassetteworld.desktop',CFBundleShortVersionString='1.0.0',CFBundleVersion='1',LSApplicationCategoryType='public.app-category.music',NSHighResolutionCapable=True)
plist.write_bytes(plistlib.dumps(data))
iconset=root/'runtime/Cassette.iconset';iconset.mkdir(exist_ok=True)
for size in [16,32,128,256,512]:
 for scale in [1,2]:
  name=f'icon_{size}x{size}'+('@2x' if scale==2 else '')+'.png'
  subprocess.run(['sips','-z',str(size*scale),str(size*scale),str(outputs/'icons/icon-512.png'),'--out',str(iconset/name)],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['iconutil','-c','icns',str(iconset),'-o',str(resources/'electron.icns')],check=True)
# Local ad-hoc signing supports this Mac; public distribution needs Developer ID + notarization.
subprocess.run(['xattr','-cr',str(app)],check=True)
subprocess.run(['codesign','--force','--deep','--sign','-',str(app)],check=True)
subprocess.run(['ditto','-c','-k','--sequesterRsrc','--keepParent',str(app),str(dist/'Cassette-World-Mac-Apple-Silicon.zip')],check=True)
subprocess.run(['ditto','--noextattr','--norsrc',str(app),str(delivery/app.name)],check=True)
shutil.copyfile(dist/'Cassette-World-Mac-Apple-Silicon.zip',delivery/'Cassette-World-Mac-Apple-Silicon.zip')
print(delivery/app.name)
