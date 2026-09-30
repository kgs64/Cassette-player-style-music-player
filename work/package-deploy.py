from pathlib import Path
import shutil, zipfile
root=Path(__file__).resolve().parent.parent/'outputs'
names=['index.html','cassette-world.html','sw.js','manifest.webmanifest','使用说明.md','iPhone使用说明.md','开发交接说明.md','THIRD_PARTY_NOTICES.md']
files=[root/n for n in names]
for folder in ['icons','third-party']:
    files += [p for p in (root/folder).rglob('*') if p.is_file()]
for filename in ['cassette-world-web-app.zip','cassette-world-ios.zip']:
    with zipfile.ZipFile(root/filename,'w',zipfile.ZIP_DEFLATED) as archive:
        for source in files: archive.write(source,source.relative_to(root))
for source in files:
    target=root/'ios'/source.relative_to(root)
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target)
print('Updated web + iOS packages and outputs/ios')
