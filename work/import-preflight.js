/* Metadata-only preflight: never read/decode an already archived source file. */
(function(root){
 function key(name,size,modified){return JSON.stringify([String(name),Number(size),Number(modified)||0]);}
 function index(tracks){const result=new Set();for(const t of tracks){if(t.sourceRequired||!t.audioBlob)continue;
  if(t.fileName&&Number.isFinite(t.fileSize))result.add(key(t.fileName,t.fileSize,t.lastModified));
  // Older archives already retain the same source fields in their fingerprint.
  if(typeof t.fingerprint==='string'){const p=t.fingerprint.split('|');if(p.length>=4){p.pop();const modified=p.pop(),size=p.pop(),name=p.join('|');result.add(key(name,size,modified));}}
 }return result;}
 function filter(files,tracks){const known=index(tracks),pending=[],skipped=[];for(const f of files)(known.has(key(f.name,f.size,f.lastModified))?skipped:pending).push(f);return{pending,skipped};}
 root.cassetteImportPreflight={filter};
})(globalThis);
