// webpjs.d.ts

declare module 'webpjs' {

    export function cwebp(
      buffer: Buffer, 
      quality: number
    ): Promise<Buffer>;
  
    export var version: string;
  
  }