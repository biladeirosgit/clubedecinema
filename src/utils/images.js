export const posterSrc = (slug) => `${process.env.PUBLIC_URL}/posters/${slug}.png`;
export const backdropSrc = (slug) => `${process.env.PUBLIC_URL}/backgrounds/${slug}.png`;
export const pfpSrc = (displayName) => `${process.env.PUBLIC_URL}/pfp/${displayName}.png`;

// Icone do hub dos Biladeiros, na navbar. E o favicon do hub, extraido do .ico
// (170 kB) e reduzido a 64px -> 4 kB.
export const hubIconSrc = () => `${process.env.PUBLIC_URL}/hub.png`;
