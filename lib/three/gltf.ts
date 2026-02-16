import { DRACOLoader } from 'three-stdlib';

export function configureDraco(loader: any): void {
  const draco = new DRACOLoader();
  // Use hosted decoders to avoid shipping decoder binaries in this scaffold bundle.
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(draco);
}
