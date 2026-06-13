// Categorical colormap for BEV Austrian Land Cover (LC) 6-class product.
// Values 1-6 are encoded in the raster; we map each to a distinct color.

export const LAND_COVER_COLORMAP = {
  1: [34, 139, 34, 255],    // high vegetation - dark green
  2: [50, 205, 50, 255],    // medium vegetation - lime green
  3: [152, 251, 152, 255],  // low vegetation - pale green
  4: [255, 0, 0, 255],      // buildings - red
  5: [210, 180, 140, 255],  // soil / ground - tan
  6: [0, 0, 255, 255]       // water - blue
}

export const LAND_COVER_LABELS = {
  1: 'High vegetation',
  2: 'Medium vegetation',
  3: 'Low vegetation',
  4: 'Buildings',
  5: 'Soil / ground',
  6: 'Water'
}

export function getEncodedColormap() {
  return encodeURIComponent(JSON.stringify(LAND_COVER_COLORMAP))
}
