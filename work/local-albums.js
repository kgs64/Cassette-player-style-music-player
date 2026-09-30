export const safeName=value=>String(value||'Untitled').normalize('NFC').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').slice(0,100)||'Untitled';
export class LocalAlbums{
 constructor(archive){this.archive=archive;this.handle=null;this.saved=0;this.message='CHOOSE FOLDER';}
 async restore(){try{this.handle=(await this.archive.get('preferences','output-folder'))?.handle||null;this.message=this.handle?'FOLDER READY':'CHOOSE FOLDER';}catch{}}
 async choose(){if(!window.showDirectoryPicker){this.message='USE MP3 DOWNLOAD';return false;}this.handle=await window.showDirectoryPicker({id:'cassette-albums',mode:'readwrite'});if(this.archive.db)await this.archive.write(['preferences'],tx=>tx.objectStore('preferences').put({id:'output-folder',handle:this.handle}));this.message='FOLDER READY';return true;}
 async save(track){if(!this.handle){this.message='CHOOSE FOLDER TO AUTO SAVE';return false;}try{if(await this.handle.queryPermission({mode:'readwrite'})!=='granted'){this.message='RESELECT OUTPUT FOLDER';return false;}
 const dir=await this.handle.getDirectoryHandle(safeName(track.artist)+' — '+safeName(track.album),{create:true});
 // Stable unique suffix prevents duplicate titles from overwriting earlier songs.
 const file=await dir.getFileHandle(safeName(track.title)+' — '+safeName(track.id)+'.mp3',{create:true});const writer=await file.createWritable();try{await writer.write(track.audioBlob);await writer.close();}catch(e){await writer.abort().catch(()=>{});throw e;}
 this.saved++;this.message='SAVED TO ALBUM FOLDER';return true;
 }catch(e){this.message='LOCAL SAVE FAILED / RETRY FOLDER';return false;}}
}
