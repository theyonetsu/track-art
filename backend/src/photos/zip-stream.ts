import { Writable } from 'stream';

/**
 * Écrivain ZIP minimal (méthode STORE, sans compression — les JPEG ne se compressent pas)
 * avec descripteurs de données pour pouvoir streamer sans connaître les tailles à l'avance.
 * Aucune dépendance. Limité aux archives < 4 Go (pas de Zip64).
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(crc: number, buf: Buffer) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosDateTime(d: Date) {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() >> 1) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
}

type Entry = { name: Buffer; crc: number; size: number; offset: number; time: number; date: number };

export class ZipStream {
  private offset = 0;
  private entries: Entry[] = [];
  constructor(private out: Writable) {}

  private write(buf: Buffer) {
    this.offset += buf.length;
    return new Promise<void>((resolve, reject) => {
      const ok = this.out.write(buf, (err) => (err ? reject(err) : undefined));
      if (ok) resolve(); else this.out.once('drain', resolve);
    });
  }

  /** Ajoute un fichier à partir d'un flux async d'octets */
  async addFile(filename: string, source: AsyncIterable<Buffer | Uint8Array>) {
    const name = Buffer.from(filename, 'utf8');
    const { time, date } = dosDateTime(new Date());
    const offset = this.offset;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);        // version
    local.writeUInt16LE(0x0808, 6);    // bit 3 (data descriptor) + bit 11 (UTF-8)
    local.writeUInt16LE(0, 8);         // STORE
    local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
    local.writeUInt32LE(0, 14); local.writeUInt32LE(0, 18); local.writeUInt32LE(0, 22); // crc/sizes dans le descripteur
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    await this.write(local); await this.write(name);

    let crc = 0, size = 0;
    for await (const chunk of source) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      crc = crc32(crc, b); size += b.length;
      await this.write(b);
    }
    const desc = Buffer.alloc(16);
    desc.writeUInt32LE(0x08074b50, 0); desc.writeUInt32LE(crc, 4); desc.writeUInt32LE(size, 8); desc.writeUInt32LE(size, 12);
    await this.write(desc);
    this.entries.push({ name, crc, size, offset, time, date });
  }

  async finish() {
    const cdStart = this.offset;
    for (const e of this.entries) {
      const h = Buffer.alloc(46);
      h.writeUInt32LE(0x02014b50, 0);
      h.writeUInt16LE(20, 4); h.writeUInt16LE(20, 6);
      h.writeUInt16LE(0x0808, 8); h.writeUInt16LE(0, 10);
      h.writeUInt16LE(e.time, 12); h.writeUInt16LE(e.date, 14);
      h.writeUInt32LE(e.crc, 16); h.writeUInt32LE(e.size, 20); h.writeUInt32LE(e.size, 24);
      h.writeUInt16LE(e.name.length, 28); h.writeUInt16LE(0, 30); h.writeUInt16LE(0, 32);
      h.writeUInt16LE(0, 34); h.writeUInt16LE(0, 36); h.writeUInt32LE(0, 38); h.writeUInt32LE(e.offset, 42);
      await this.write(h); await this.write(e.name);
    }
    const cdSize = this.offset - cdStart;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
    end.writeUInt16LE(this.entries.length, 8); end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(cdStart, 16); end.writeUInt16LE(0, 20);
    await this.write(end);
    await new Promise<void>((resolve) => this.out.end(resolve));
  }
}
